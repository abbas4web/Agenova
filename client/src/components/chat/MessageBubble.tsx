import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
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

// Custom renderers so Markdown elements match the dark theme
const markdownComponents: Components = {
  // Paragraphs
  p: ({ children }) => (
    <p className="my-1.5 leading-relaxed">{children}</p>
  ),

  // Headings
  h1: ({ children }) => <h1 className="text-lg font-bold text-white mt-3 mb-1.5">{children}</h1>,
  h2: ({ children }) => <h2 className="text-base font-semibold text-white mt-3 mb-1.5">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-semibold text-white mt-2 mb-1">{children}</h3>,

  // Bold / italic
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  em: ({ children }) => <em className="italic text-slate-300">{children}</em>,

  // Inline code
  code: ({ children, className }) => {
    const isBlock = className?.includes('language-');
    if (isBlock) {
      return (
        <code className="block text-xs font-mono text-slate-200 leading-relaxed">
          {children}
        </code>
      );
    }
    return (
      <code className="text-xs font-mono text-indigo-300 bg-slate-800/80 px-1.5 py-0.5 rounded">
        {children}
      </code>
    );
  },

  // Code block wrapper
  pre: ({ children }) => (
    <pre className="my-2 p-3 rounded-xl bg-slate-900/80 border border-slate-700/50 overflow-x-auto text-xs font-mono">
      {children}
    </pre>
  ),

  // Lists
  ul: ({ children }) => <ul className="my-1.5 ml-4 space-y-0.5 list-disc marker:text-slate-500">{children}</ul>,
  ol: ({ children }) => <ol className="my-1.5 ml-4 space-y-0.5 list-decimal marker:text-slate-500">{children}</ol>,
  li: ({ children }) => <li className="text-slate-200 leading-relaxed">{children}</li>,

  // Blockquote
  blockquote: ({ children }) => (
    <blockquote className="my-2 pl-3 border-l-2 border-indigo-500 text-slate-400 italic">
      {children}
    </blockquote>
  ),

  // Horizontal rule
  hr: () => <hr className="my-3 border-slate-700" />,

  // Links
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors"
    >
      {children}
    </a>
  ),

  // Tables (GFM)
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-xl border border-slate-700/50">
      <table className="w-full text-xs text-left border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-slate-800/80 text-slate-300 uppercase text-[10px] tracking-wider">
      {children}
    </thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-slate-700/40">{children}</tbody>
  ),
  tr: ({ children }) => (
    <tr className="hover:bg-slate-800/40 transition-colors">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2 font-semibold text-slate-300 whitespace-nowrap">{children}</th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 text-slate-300 align-top">{children}</td>
  ),
};

export default function MessageBubble({ message, agentIcon }: MessageBubbleProps) {
  const isUser = message.role === 'user';

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
          'max-w-[82%] rounded-2xl px-4 py-3 text-sm',
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
        ) : isUser ? (
          // User messages — plain text, preserve newlines
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        ) : (
          // Assistant messages — full Markdown rendering
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}
