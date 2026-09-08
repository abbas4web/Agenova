import { cn } from '../../utils/cn';
import type { OptimisticMessage } from '../../types';
import { AlertCircle } from 'lucide-react';

interface MessageBubbleProps {
  message: OptimisticMessage;
  agentIcon?: string;
}

// Thinking dots animation
function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5" aria-label="Agent is thinking">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-thinking"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}

// Renders markdown-like content safely without a full markdown parser
function MessageContent({ content }: { content: string }) {
  if (!content) return null;

  // Split on code blocks first
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="prose-chat">
      {parts.map((part, i) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.slice(3, -3).split('\n');
          const lang = lines[0]?.trim() ?? '';
          const code = lines.slice(lang ? 1 : 0).join('\n');
          return (
            <pre key={i} className="relative">
              {lang && (
                <span className="absolute top-2 right-3 text-[10px] text-slate-500 font-mono select-none">
                  {lang}
                </span>
              )}
              <code>{code}</code>
            </pre>
          );
        }
        // Render inline content preserving newlines
        return (
          <span key={i} className="whitespace-pre-wrap">
            {part}
          </span>
        );
      })}
    </div>
  );
}

export default function MessageBubble({ message, agentIcon }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <div
      className={cn(
        'flex gap-3 px-4 py-3 group animate-slide-up',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-base leading-none select-none',
          isUser
            ? 'bg-brand-600/20 border border-brand-500/30 text-brand-400 text-xs font-semibold'
            : 'bg-surface-800 border border-surface-700/60'
        )}
        aria-hidden="true"
      >
        {isUser ? 'You' : (agentIcon ?? '🤖')}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          'max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-brand-600/20 border border-brand-500/20 text-slate-100 rounded-tr-sm'
            : message.error
            ? 'bg-red-500/10 border border-red-500/20 text-red-300 rounded-tl-sm'
            : 'bg-surface-800/60 border border-surface-700/40 text-slate-200 rounded-tl-sm'
        )}
      >
        {message.pending ? (
          <ThinkingIndicator />
        ) : message.error ? (
          <div className="flex items-start gap-2">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
            <span>{message.content}</span>
          </div>
        ) : (
          <MessageContent content={message.content} />
        )}
      </div>
    </div>
  );
}
