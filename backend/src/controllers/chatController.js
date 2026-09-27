import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { streamChatResponse } from '../services/geminiService.js';
import { Conversation } from '../models/Conversation.js';

/**
 * POST /api/chat/stream
 * Streams Gemini response as Server-Sent Events.
 * Optionally saves messages to MongoDB if sessionId provided.
 */
export const streamChat = async (req, res) => {
  const { message, sessionId, history = [], file } = req.body;

  // Must have either a text message or an attached file
  if ((!message || typeof message !== 'string' || message.trim().length === 0) && !file) {
    return res.status(400).json({ error: 'Please provide a message or upload a file.' });
  }

  const userText = message && typeof message === 'string' ? message.trim() : '';

  if (userText.length > 25000) {
    return res.status(400).json({ error: 'Message too long. Please keep it under 25,000 characters.' });
  }

  const activeSessionId = sessionId || uuidv4();

  try {
    // Stream Gemini response (writes SSE to res internally)
    const fullText = await streamChatResponse({
      userMessage: userText,
      history,
      file,
      res,
    });

    // Persist to MongoDB (best-effort, non-blocking)
    persistConversation(activeSessionId, userText, fullText).catch((err) =>
      console.error('DB save error (non-fatal):', err.message)
    );
  } catch (error) {
    console.error('Gemini stream error:', error);

    // If headers already sent (streaming started), can't send JSON error
    if (!res.headersSent) {
      res.status(500).json({ error: 'AI service error. Please try again.' });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Stream interrupted.' })}\n\n`);
      res.end();
    }
  }
};

/**
 * POST /api/chat/sessions
 * Creates a new session ID for a fresh conversation.
 */
export const createSession = (req, res) => {
  const sessionId = uuidv4();
  res.json({ sessionId });
};

/**
 * GET /api/chat/history/:sessionId
 * Retrieves conversation history for a session.
 */
export const getHistory = async (req, res) => {
  const { sessionId } = req.params;
  try {
    const conversation = await Conversation.findOne({ sessionId }).lean();
    if (!conversation) {
      return res.json({ sessionId, messages: [], title: 'New Conversation' });
    }
    res.json({
      sessionId,
      title: conversation.title,
      messages: conversation.messages,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to retrieve history.' });
  }
};

/**
 * GET /api/chat/sessions
 * Lists all conversation sessions (most recent first).
 */
export const listSessions = async (req, res) => {
  try {
    const sessions = await Conversation.find({}, 'sessionId title messageCount updatedAt')
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();
    res.json({ sessions });
  } catch (error) {
    console.error('List sessions error:', error);
    res.status(500).json({ error: 'Failed to list sessions.' });
  }
};

/**
 * DELETE /api/chat/history/:sessionId
 * Deletes a conversation session.
 */
export const deleteSession = async (req, res) => {
  const { sessionId } = req.params;
  try {
    await Conversation.deleteOne({ sessionId });
    res.json({ message: 'Session deleted successfully.' });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ error: 'Failed to delete session.' });
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function persistConversation(sessionId, userMessage, assistantMessage) {
  // If MongoDB is offline, skip persistence gracefully without buffering
  if (mongoose.connection.readyState !== 1) return;

  const userMsg = { role: 'user', content: userMessage };
  const modelMsg = { role: 'model', content: assistantMessage };

  await Conversation.findOneAndUpdate(
    { sessionId },
    {
      $push: { messages: { $each: [userMsg, modelMsg] } },
      $setOnInsert: { sessionId },
    },
    { upsert: true, new: true }
  );
}
