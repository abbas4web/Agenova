import { useState, useRef, useEffect } from 'react';
import { Send, Square } from 'lucide-react';
import { cn } from '../../utils/cn';

interface InputBarProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export default function InputBar({
  onSend,
  isLoading,
  placeholder = 'Message…',
  disabled,
}: InputBarProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  // Re-focus after send
  useEffect(() => {
    if (!isLoading) {
      textareaRef.current?.focus();
    }
  }, [isLoading]);

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed || isLoading || disabled) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const canSend = value.trim().length > 0 && !isLoading && !disabled;

  return (
    <div className="px-4 py-3 border-t border-surface-800/60 bg-surface-950/80 backdrop-blur-sm">
      <div
        className={cn(
          'flex items-end gap-3 rounded-2xl border px-4 py-3 transition-all duration-150',
          'bg-surface-900 border-surface-700/60',
          'focus-within:border-brand-500/60 focus-within:bg-surface-800/80'
        )}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          aria-label="Message input"
          className={cn(
            'flex-1 resize-none bg-transparent text-sm text-slate-100 placeholder-slate-600',
            'outline-none leading-relaxed max-h-[200px] overflow-y-auto scrollbar-hide',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        />

        <button
          onClick={handleSubmit}
          disabled={!canSend}
          aria-label={isLoading ? 'Waiting for response' : 'Send message'}
          className={cn(
            'flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150',
            canSend
              ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-sm shadow-brand-900/50'
              : 'bg-surface-800 text-slate-600 cursor-not-allowed'
          )}
        >
          {isLoading ? (
            <Square size={13} className="text-brand-400 animate-pulse" />
          ) : (
            <Send size={13} />
          )}
        </button>
      </div>

      <p className="text-[10px] text-slate-700 text-center mt-2">
        Press Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
