import { Sparkles, Trash2 } from 'lucide-react';

/**
 * Top navigation bar with EduGenie branding and chat controls.
 */
export const Header = ({ onClearChat, messageCount }) => {
  return (
    <header className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-white border-b border-slate-200 shadow-sm flex-shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-800 leading-tight">EduGenie</h1>
          <p className="text-[10px] text-indigo-500 font-medium leading-tight">
            AI Learning Assistant
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">

        {/* Live status */}
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 font-medium">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          <span>Active</span>
        </div>

        {/* Clear chat */}
        {messageCount > 0 && (
          <button
            onClick={onClearChat}
            title="Start new conversation"
            aria-label="Clear chat and start new conversation"
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors duration-200"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        )}
      </div>
    </header>
  );
};
