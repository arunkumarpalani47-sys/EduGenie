/** Animated typing indicator shown while EduGenie is generating a response */
export const TypingIndicator = () => {
  return (
    <div className="flex items-start gap-3 animate-slide-up">
      {/* Avatar */}
      <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold shadow-sm">
        ✨
      </div>

      {/* Bubble */}
      <div className="bubble-assistant flex items-center gap-1.5 py-4 px-5">
        <span className="typing-dot" style={{ animationDelay: '0ms' }} />
        <span className="typing-dot delay-150" style={{ animationDelay: '150ms' }} />
        <span className="typing-dot delay-300" style={{ animationDelay: '300ms' }} />
        <span className="text-xs text-slate-400 ml-2">EduGenie is thinking...</span>
      </div>
    </div>
  );
};
