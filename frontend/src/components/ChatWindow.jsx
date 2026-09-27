import { useEffect, useRef, useCallback } from 'react';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { WelcomeScreen } from './WelcomeScreen';
import { Header } from './Header';
import { ChatInput } from './ChatInput';
import { useChat } from '../hooks/useChat';

/**
 * Main chat window — orchestrates all chat components.
 * Handles auto-scrolling, quick actions, and streaming state.
 */
export const ChatWindow = () => {
  const { messages, isStreaming, sendMessage, clearChat } = useChat();
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // High-performance auto-scroll: direct container scrollTop during streaming (zero DOM reflows), smooth on turn completion
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container && isStreaming) {
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200;
      if (isNearBottom) {
        container.scrollTop = container.scrollHeight;
      }
    } else if (!isStreaming) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isStreaming]);

  const handleQuickAction = useCallback((prompt) => {
    sendMessage(prompt);
  }, [sendMessage]);

  const showTypingIndicator =
    isStreaming && messages.length > 0 && !messages[messages.length - 1]?.isStreaming;

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-50 overflow-hidden w-full h-full">
      {/* Header */}
      <Header onClearChat={clearChat} messageCount={messages.length} />

      {/* Messages Area */}
      <main
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-y-auto scrollbar-thin"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-5">
          {messages.length === 0 ? (
            <WelcomeScreen onQuickAction={handleQuickAction} />
          ) : (
            <>
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {showTypingIndicator && <TypingIndicator />}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      <ChatInput onSend={sendMessage} isStreaming={isStreaming} />
    </div>
  );
};
