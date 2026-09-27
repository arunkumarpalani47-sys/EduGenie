import { useState, useCallback, useRef } from 'react';
import { streamChat } from '../services/api';
import { v4 as uuidv4 } from '../utils/uuid.js';

/**
 * Core chat hook — manages messages, streaming state, and session context.
 */
export const useChat = () => {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId] = useState(() => uuidv4());
  const streamingIdRef = useRef(null);

  const sendMessage = useCallback(
    async (text, file = null) => {
      const trimmed = text ? text.trim() : '';
      if ((!trimmed && !file) || isStreaming) return;

      const userMessage = {
        id: uuidv4(),
        role: 'user',
        content: trimmed || (file ? `Attached: ${file.name}` : ''),
        file: file ? { name: file.name, type: file.mimeType, preview: file.preview } : null,
      };
      const assistantId = uuidv4();

      setMessages((prev) => [
        ...prev,
        userMessage,
        { id: assistantId, role: 'assistant', content: '', isStreaming: true },
      ]);
      setIsStreaming(true);
      streamingIdRef.current = assistantId;

      // Keep the most recent 4 messages trimmed to max 800 chars to keep latency ultra-fast
      const history = messages
        .filter((m) => !m.isError && m.content && m.content.trim().length > 0 && !m.isStreaming)
        .slice(-4)
        .map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          content: m.content.trim().slice(0, 800),
        }));

      // High-performance streaming buffer: first token renders synchronously, subsequent tokens batch at 60fps
      let bufferedText = '';
      let animationFrameId = null;
      let hasReceivedFirstChunk = false;

      const scheduleFlush = () => {
        if (animationFrameId) return;
        animationFrameId = requestAnimationFrame(() => {
          animationFrameId = null;
          if (!bufferedText) return;
          const delta = bufferedText;
          bufferedText = '';
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: m.content + delta }
                : m
            )
          );
        });
      };

      await streamChat({
        message: trimmed,
        file: file ? { data: file.data, mimeType: file.mimeType, name: file.name } : null,
        sessionId,
        history,
        onChunk: (chunk) => {
          if (!hasReceivedFirstChunk) {
            hasReceivedFirstChunk = true;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: chunk }
                  : m
              )
            );
            return;
          }
          bufferedText += chunk;
          scheduleFlush();
        },
        onDone: (fullText) => {
          if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
          }
          bufferedText = '';
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: fullText, isStreaming: false }
                : m
            )
          );
          setIsStreaming(false);
          streamingIdRef.current = null;
        },
        onError: (errorMsg) => {
          if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
          }
          bufferedText = '';
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: `❌ ${errorMsg}`, isStreaming: false, isError: true }
                : m
            )
          );
          setIsStreaming(false);
          streamingIdRef.current = null;
        },
      });
    },
    [messages, isStreaming, sessionId]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setIsStreaming(false);
  }, []);

  return { messages, isStreaming, sessionId, sendMessage, clearChat };
};
