const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

/**
 * Stream a chat message from the EduGenie API using SSE.
 *
 * @param {Object} params
 * @param {string}   params.message    - User's message text
 * @param {string}   params.sessionId  - Active session ID
 * @param {Array}    params.history    - Previous messages [{role, content}]
 * @param {Function} params.onChunk    - Called with each streaming text chunk
 * @param {Function} params.onDone     - Called when stream completes with full text
 * @param {Function} params.onError    - Called on error with error message string
 */
export const streamChat = async ({ message, sessionId, history, file, onChunk, onDone, onError }) => {
  try {
    const response = await fetch(`${API_URL}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, sessionId, history, file }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Network error' }));
      onError(err.error || `Server error ${response.status}`);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep incomplete line in buffer

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (!raw) continue;

        try {
          const event = JSON.parse(raw);
          if (event.type === 'chunk' && event.text) {
            onChunk(event.text);
          } else if (event.type === 'done') {
            onDone(event.fullText);
          } else if (event.type === 'error') {
            onError(event.message || 'Stream error');
          }
        } catch {
          // skip malformed SSE lines
        }
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') return;
    onError('Connection failed. Is the server running?');
  }
};

/** Create a new chat session */
export const createSession = async () => {
  const res = await fetch(`${API_URL}/api/chat/sessions`, { method: 'POST' });
  const data = await res.json();
  return data.sessionId;
};

/** Fetch conversation history for a session */
export const fetchHistory = async (sessionId) => {
  const res = await fetch(`${API_URL}/api/chat/history/${sessionId}`);
  return res.json();
};

/** Fetch all sessions */
export const fetchSessions = async () => {
  const res = await fetch(`${API_URL}/api/chat/sessions`);
  return res.json();
};

/** Delete a session */
export const deleteSession = async (sessionId) => {
  await fetch(`${API_URL}/api/chat/history/${sessionId}`, { method: 'DELETE' });
};
