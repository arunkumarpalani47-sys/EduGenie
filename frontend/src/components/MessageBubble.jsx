import { useState, useEffect, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, User, Sparkles, Volume2, VolumeX, FileText } from 'lucide-react';
import { speak, stopSpeech } from '../utils/speech.js';

/**
 * Renders a single chat message bubble.
 * - User messages: right-aligned indigo bubble
 * - Assistant messages: left-aligned white bubble with markdown rendering + speech output
 */
const GeneratedImage = ({ src, alt }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Clean URL: replace spaces with %20
  const cleanUrl = src ? src.trim().replace(/\s+/g, '%20') : '';

  return (
    <div className="my-3 rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-50 transition-all">
      {!loaded && !error && (
        <div className="h-56 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-indigo-50 to-slate-100 text-slate-500 animate-pulse">
          <Sparkles className="w-6 h-6 text-indigo-500 animate-spin" />
          <span className="text-xs font-medium text-slate-600">Rendering AI Visual...</span>
        </div>
      )}

      {error ? (
        <div className="p-4 bg-slate-50 text-center">
          <p className="text-xs text-slate-600 mb-2 font-medium">Click below to view the generated visual:</p>
          <a
            href={cleanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <span>Open AI Image ↗</span>
          </a>
        </div>
      ) : (
        <img
          src={cleanUrl}
          alt={alt || 'Visual representation'}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`w-full max-h-[300px] sm:max-h-[480px] object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'hidden'}`}
        />
      )}

      {alt && (
        <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="font-medium text-slate-700 truncate max-w-[60%] sm:max-w-[75%]">
            🎨 {alt}
          </span>
          <a
            href={cleanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-800 font-semibold flex-shrink-0"
          >
            Full View ↗
          </a>
        </div>
      )}
    </div>
  );
};

const REMARK_PLUGINS = [remarkGfm];
const MARKDOWN_COMPONENTS = {
  img: ({ src, alt }) => <GeneratedImage src={src} alt={alt} />,
};

export const MessageBubble = memo(({ message }) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isUser = message.role === 'user';

  // Stop speech if component unmounts
  useEffect(() => {
    return () => {
      if (isSpeaking) stopSpeech();
    };
  }, [isSpeaking]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleToggleSpeak = () => {
    if (isSpeaking) {
      stopSpeech();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speak(message.content, () => {
        setIsSpeaking(false);
      });
    }
  };

  return (
    <div
      className={`flex items-start gap-2 sm:gap-3 animate-slide-up ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm text-xs font-bold
          ${isUser ? 'bg-slate-200 text-slate-600' : 'bg-indigo-600 text-white'}`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
      </div>

      {/* Content */}
      <div className={`group relative ${isUser ? 'items-end' : 'items-start'} flex flex-col max-w-[92%] sm:max-w-[85%]`}>
        {isUser ? (
          <div className="bubble-user">
            {message.file && (
              <div className="mb-2 p-2 bg-indigo-700/60 rounded-xl flex items-center gap-2 border border-indigo-400/30">
                {message.file.preview ? (
                  <img
                    src={message.file.preview}
                    alt={message.file.name}
                    className="w-14 h-14 object-cover rounded-lg border border-white/20"
                  />
                ) : (
                  <div className="w-8 h-8 bg-indigo-500/50 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                )}
                <span className="text-xs text-indigo-100 font-medium truncate max-w-[140px] sm:max-w-[200px]">
                  {message.file.name}
                </span>
              </div>
            )}
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>
        ) : (
          <div className={`bubble-assistant w-full ${message.isError ? 'border-red-200 bg-red-50' : ''}`}>
            {message.content ? (
              <div className="markdown-body text-sm">
                <ReactMarkdown
                  remarkPlugins={REMARK_PLUGINS}
                  components={MARKDOWN_COMPONENTS}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 py-1 text-xs text-indigo-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
                <span className="ml-1 text-slate-400 font-normal">Replying...</span>
              </div>
            )}

            {/* Streaming cursor */}
            {message.isStreaming && message.content && (
              <span className="inline-block w-0.5 h-4 bg-indigo-500 ml-0.5 animate-pulse align-middle" />
            )}
          </div>
        )}

        {/* Action buttons (Speak + Copy) */}
        {!isUser && message.content && !message.isStreaming && (
          <div className="flex items-center gap-2 mt-1.5 ml-1">
            {/* Speak / Listen button */}
            <button
              onClick={handleToggleSpeak}
              title={isSpeaking ? 'Stop speaking' : 'Listen to answer'}
              className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-md transition-colors duration-200 ${
                isSpeaking
                  ? 'bg-indigo-100 text-indigo-700 font-medium'
                  : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'
              }`}
              aria-label={isSpeaking ? 'Stop speaking' : 'Speak answer aloud'}
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Listen</span>
                </>
              )}
            </button>

            {/* Copy button */}
            <button
              onClick={copyToClipboard}
              title="Copy response"
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-600 px-2 py-0.5 rounded-md hover:bg-slate-100 transition-colors duration-200"
              aria-label="Copy message"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
