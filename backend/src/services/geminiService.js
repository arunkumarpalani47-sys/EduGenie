import { GoogleGenAI } from '@google/genai';
import { config } from '../config/config.js';
import { EDUGENIE_SYSTEM_PROMPT } from '../config/systemPrompt.js';

// Fresh client per request prevents Node 22 on Windows stale socket ECONNRESET issues
const getAIClient = () => new GoogleGenAI({ apiKey: config.geminiApiKey });

/**
 * Convert and sanitize stored message history to Gemini chat history format.
 * Enforces:
 *  1. Non-empty string parts
 *  2. Starts with 'user'
 *  3. Strictly alternates user <-> model
 *  4. Ends with 'model' (since chat.sendMessageStream appends the next user turn)
 */
const formatHistoryForGemini = (messages = []) => {
  const valid = [];
  let expectedRole = 'user';

  for (const msg of messages) {
    if (!msg || !msg.content || typeof msg.content !== 'string' || !msg.content.trim()) {
      continue;
    }
    const role = msg.role === 'model' || msg.role === 'assistant' ? 'model' : 'user';

    // Must alternate strictly
    if (role === expectedRole) {
      valid.push({
        role,
        parts: [{ text: msg.content.trim() }],
      });
      expectedRole = role === 'user' ? 'model' : 'user';
    }
  }

  // History for chat session must end with 'model' because sendMessageStream sends 'user'
  if (valid.length > 0 && valid[valid.length - 1].role === 'user') {
    valid.pop();
  }

  return valid;
};

/**
 * Build the message payload (text or multimodal parts with images/PDFs/documents).
 */
const buildMessagePayload = (userMessage, file) => {
  if (!file || !file.data || !file.mimeType) {
    return userMessage;
  }

  const parts = [];

  // Images and PDFs are passed as inline base64 data to Gemini
  if (file.mimeType.startsWith('image/') || file.mimeType === 'application/pdf') {
    parts.push({
      inlineData: {
        data: file.data, // base64 string without data:mime;base64, prefix
        mimeType: file.mimeType,
      },
    });
  } else {
    // Text, code, CSV, Markdown, etc.
    let textContent = '';
    try {
      textContent = Buffer.from(file.data, 'base64').toString('utf-8');
    } catch {
      textContent = file.data;
    }
    parts.push({
      text: `[Attached File: ${file.name || 'document'}]\n\`\`\`\n${textContent}\n\`\`\``,
    });
  }

  const promptText =
    userMessage && userMessage.trim()
      ? userMessage.trim()
      : 'Please analyze this uploaded document or image, explain its key concepts, and walk me through it step by step.';

  parts.push({ text: promptText });
  return parts;
};

/**
 * Stream a response from Gemini using automatic multi-model fallback cascade.
 * Supports both text and multimodal inputs (images, PDFs, documents).
 *
 * @param {Object} params
 * @param {string} params.userMessage - Latest user message
 * @param {Array}  params.history     - Prior messages for context
 * @param {Object} [params.file]      - Optional file object { data, mimeType, name }
 * @param {Object} params.res         - Express response object (SSE stream)
 * @returns {string} Full accumulated response text
 */
export const streamChatResponse = async ({ userMessage, history, file, res }) => {
  // 1. Immediately establish SSE stream with browser so client never waits on pending HTTP connection
  if (!res.headersSent) {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    // Disable Nagle's algorithm for zero-delay instant packet delivery
    res.socket?.setNoDelay(true);
    if (typeof res.flushHeaders === 'function') res.flushHeaders();
    res.write(`data: ${JSON.stringify({ type: 'start' })}\n\n`);
    if (typeof res.flush === 'function') res.flush();
  }

  // Ordered cascade: strictly use the sub-1.3s models with high quota to prevent hangs
  const candidateModels = [
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash-lite',
  ];

  const uniqueModels = [...new Set(candidateModels.filter(Boolean))];
  const sanitizedHistory = formatHistoryForGemini(history);
  const messagePayload = buildMessagePayload(userMessage, file);

  let stream = null;
  let activeModel = null;
  let lastError = null;
  const ai = getAIClient();

  for (const model of uniqueModels) {
    try {
      const chat = ai.chats.create({
        model,
        config: {
          systemInstruction: EDUGENIE_SYSTEM_PROMPT,
          temperature: 0.2,        // Low temperature = direct greedy decoding = fastest token throughput
          topP: 0.8,
          maxOutputTokens: 2048,   // Snappy responses, prevents runaway generation
        },
        history: sanitizedHistory,
      });

      stream = await chat.sendMessageStream({ message: messagePayload });
      activeModel = model;
      break;
    } catch (err) {
      console.warn(`[EduGenie Cascade] Model ${model} unavailable (${err.status || err.message}). Switching to fallback...`);
      lastError = err;
    }
  }

  if (!stream) {
    console.error('[EduGenie] All candidate models exhausted:', lastError);
    res.write(`data: ${JSON.stringify({ type: 'error', message: 'All models are currently busy. Please retry.' })}\n\n`);
    res.end();
    return '';
  }

  let fullText = '';

  for await (const chunk of stream) {
    const text = chunk.text;
    if (text) {
      fullText += text;
      res.write(`data: ${JSON.stringify({ type: 'chunk', text, model: activeModel })}\n\n`);
      if (typeof res.flush === 'function') res.flush();
    }
  }

  res.write(`data: ${JSON.stringify({ type: 'done', fullText, model: activeModel })}\n\n`);
  res.end();

  return fullText;
};

/**
 * Non-streaming single response with fallback.
 */
export const generateText = async (prompt) => {
  const models = ['gemini-3.1-flash-lite', 'gemini-3.5-flash-lite'];
  const ai = getAIClient();
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      return response.text;
    } catch (e) {
      console.warn(`[generateText] ${model} failed, trying next...`);
    }
  }
  throw new Error('Text generation failed across all models.');
};
