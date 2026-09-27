import express from 'express';
import {
  streamChat,
  createSession,
  getHistory,
  listSessions,
  deleteSession,
} from '../controllers/chatController.js';

const router = express.Router();

// ─── Chat Streaming ────────────────────────────────────────────────────────────
// POST  /api/chat/stream   → streams Gemini response as SSE
router.post('/stream', streamChat);

// ─── Session Management ────────────────────────────────────────────────────────
// POST  /api/chat/sessions       → create new session
router.post('/sessions', createSession);

// GET   /api/chat/sessions       → list all sessions
router.get('/sessions', listSessions);

// GET   /api/chat/history/:id    → get conversation history
router.get('/history/:sessionId', getHistory);

// DELETE /api/chat/history/:id   → delete a session
router.delete('/history/:sessionId', deleteSession);

export default router;
