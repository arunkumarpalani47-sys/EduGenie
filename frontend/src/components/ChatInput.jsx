import { useRef, useCallback, useState } from 'react';
import { Send, Square, Paperclip, X, FileText } from 'lucide-react';

/**
 * Chat input area with file upload (images, PDFs, documents) and auto-resize textarea.
 */
export const ChatInput = ({ onSend, isStreaming, disabled }) => {
  const [value, setValue] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const MAX_CHARS = 4000;

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if ((!trimmed && !attachedFile) || isStreaming || disabled) return;

    onSend(trimmed, attachedFile);
    setValue('');
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [value, attachedFile, isStreaming, disabled, onSend]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e) => {
    const newVal = e.target.value;
    if (newVal.length > MAX_CHARS) return;
    setValue(newVal);

    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert('File is too large. Please select a file under 25MB.');
      return;
    }

    // Fast image optimization: resize large images to max 1200px on canvas
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const MAX_DIM = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height && width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Fast JPEG encoding with 0.85 quality
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          const base64Data = optimizedDataUrl.split(',')[1];
          const approxKb = Math.round((base64Data.length * 3) / 4 / 1024);

          setAttachedFile({
            name: file.name,
            size: `${approxKb} KB (optimized)`,
            mimeType: 'image/jpeg',
            data: base64Data,
            preview: optimizedDataUrl,
          });

          if (textareaRef.current) textareaRef.current.focus();
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      // Non-image files (PDFs, docs) read directly
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        setAttachedFile({
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          mimeType: file.type || 'application/octet-stream',
          data: dataUrl.split(',')[1],
          preview: null,
        });
        if (textareaRef.current) textareaRef.current.focus();
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachedFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const charCount = value.length;
  const isNearLimit = charCount > MAX_CHARS * 0.85;
  const canSend = (value.trim().length > 0 || attachedFile) && !isStreaming && !disabled;

  return (
    <div className="border-t border-slate-200 bg-white px-3 sm:px-4 pt-2 pb-3 sm:py-3 flex-shrink-0">
      <div className="max-w-3xl mx-auto">
        {/* Attached File Preview Tag */}
        {attachedFile && (
          <div className="flex items-center gap-2 mb-2 p-2 bg-indigo-50 border border-indigo-100 rounded-xl w-fit max-w-[90vw] sm:max-w-md animate-slide-up">
            {attachedFile.preview ? (
              <img
                src={attachedFile.preview}
                alt={attachedFile.name}
                className="w-10 h-10 object-cover rounded-lg border border-indigo-200 flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5" />
              </div>
            )}
            <div className="overflow-hidden text-xs min-w-0 flex-1">
              <p className="font-semibold text-slate-800 truncate">{attachedFile.name}</p>
              <p className="text-slate-500">{attachedFile.size}</p>
            </div>
            <button
              type="button"
              onClick={removeAttachedFile}
              className="ml-1 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Input Box */}
        <div className="flex items-end gap-1.5 sm:gap-2 bg-white border border-slate-200 rounded-2xl px-2.5 sm:px-3 py-1.5 sm:py-2 shadow-sm focus-within:ring-2 focus-within:ring-indigo-400 focus-within:border-transparent transition-all">
          {/* File Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Upload image, PDF, or document to ask questions about"
            aria-label="Upload file"
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 bg-slate-100 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept="image/*,.pdf,.txt,.csv,.md,.json,.py,.js,.html,.css"
            className="hidden"
          />

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={
              isStreaming
                ? 'EduGenie is thinking & streaming...'
                : attachedFile
                ? 'Ask anything about this file...'
                : 'Ask a question, upload notes, or study...'
            }
            disabled={isStreaming || disabled}
            rows={1}
            aria-label="Chat input"
            className="flex-1 resize-none bg-transparent text-base sm:text-sm text-slate-800 placeholder-slate-400 py-1.5 focus:outline-none leading-relaxed max-h-36 sm:max-h-40 scrollbar-thin disabled:opacity-60"
          />

          {/* Send / Stop button */}
          <button
            onClick={handleSend}
            disabled={!canSend}
            aria-label={isStreaming ? 'Stop generating' : 'Send message'}
            className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm
              ${
                canSend
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
          >
            {isStreaming ? (
              <Square className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Footer: hints + char counter */}
        <div className="flex justify-between items-center mt-1.5 px-1">
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <span className="hidden sm:inline">Press <kbd className="px-1 py-0.5 bg-slate-100 rounded text-slate-500 font-mono text-[10px]">Enter</kbd> to send ·</span>
            <span>📎 Upload files to study</span>
          </p>
          {charCount > 0 && (
            <span className={`text-xs ${isNearLimit ? 'text-amber-500' : 'text-slate-400'}`}>
              {charCount}/{MAX_CHARS}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
