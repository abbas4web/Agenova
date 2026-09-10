import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { AlertCircle, UserRound, Bot, Scan, Sparkles } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { OptimisticMessage } from '../../types';
import AgentIcon from '../common/AgentIcon';

interface MessageBubbleProps {
  message: OptimisticMessage;
  agentIcon?: string;
  /** Preview URL of the image the user just sent — used to show scan animation */
  pendingImageUrl?: string;
}

// ── Plain thinking dots (no image) ───────────────────────────────────────────
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

// ── Face-scan animation shown while Derma processes a photo ──────────────────
function SkinScanIndicator({ imageUrl }: { imageUrl: string }) {
  return (
    <div className="flex flex-col items-start gap-3" aria-label="Analysing skin">
      {/* Image with scan overlay */}
      <div className="relative w-[200px] h-[200px] rounded-2xl overflow-hidden border border-rose-500/40 shadow-lg shadow-rose-900/20">
        {/* The uploaded photo */}
        <img
          src={imageUrl}
          alt="Analysing"
          className="w-full h-full object-cover"
        />

        {/* Dark tint */}
        <div className="absolute inset-0 bg-slate-950/30" />

        {/* Horizontal scan line */}
        <div
          className="animate-scan-line absolute left-0 right-0 h-[2px] pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, #f43f5e, #fb923c, #f43f5e, transparent)' }}
        />

        {/* Scan glow — diffuse bloom that follows the line */}
        <div
          className="animate-scan-line absolute left-0 right-0 h-8 pointer-events-none"
          style={{
            marginTop: '-16px',
            background: 'linear-gradient(180deg, transparent, rgba(244,63,94,0.12), transparent)',
            animationDelay: '0s',
          }}
        />

        {/* Corner brackets — top-left */}
        <span className="animate-corner-ping absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-rose-400 rounded-tl-sm" />
        {/* top-right */}
        <span className="animate-corner-ping absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-rose-400 rounded-tr-sm" style={{ animationDelay: '0.5s' }} />
        {/* bottom-left */}
        <span className="animate-corner-ping absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-rose-400 rounded-bl-sm" style={{ animationDelay: '1s' }} />
        {/* bottom-right */}
        <span className="animate-corner-ping absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-rose-400 rounded-br-sm" style={{ animationDelay: '1.5s' }} />

        {/* Centre dot reticle */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="animate-scan-pulse w-5 h-5 rounded-full border border-rose-400/60 flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-scan-pulse" style={{ animationDelay: '0.3s' }} />
          </span>
        </div>
      </div>

      {/* Status label */}
      <div className="flex items-center gap-2 text-xs text-rose-300/80">
        <Scan size={13} className="animate-scan-pulse flex-shrink-0" />
        <span className="animate-scan-pulse">Analysing skin</span>
        <Sparkles size={11} className="animate-scan-pulse text-orange-400/70" style={{ animationDelay: '0.6s' }} />
      </div>
    </div>
  );
}

// ── Markdown renderers ────────────────────────────────────────────────────────
const markdownComponents: Components = {
  p: ({ children }) => <p className="my-1.5 leading-relaxed">{children}</p>,

  h1: ({ children }) => <h1 className="text-lg font-bold text-white mt-3 mb-1.5">{children}</h1>,
  h2: ({ children }) => <h2 className="text-base font-semibold text-white mt-3 mb-1.5">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-semibold text-white mt-2 mb-1">{children}</h3>,

  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  em: ({ children }) => <em className="italic text-slate-300">{children}</em>,

  code: ({ children, className }) => {
    const isBlock = className?.includes('language-');
    if (isBlock) {
      return (
        <code className="block text-xs font-mono text-slate-200 leading-relaxed">{children}</code>
      );
    }
    return (
      <code className="text-xs font-mono text-indigo-300 bg-slate-800/80 px-1.5 py-0.5 rounded">
        {children}
      </code>
    );
  },

  pre: ({ children }) => (
    <pre className="my-2 p-3 rounded-xl bg-slate-900/80 border border-slate-700/50 overflow-x-auto text-xs font-mono">
      {children}
    </pre>
  ),

  ul: ({ children }) => <ul className="my-1.5 ml-4 space-y-0.5 list-disc marker:text-slate-500">{children}</ul>,
  ol: ({ children }) => <ol className="my-1.5 ml-4 space-y-0.5 list-decimal marker:text-slate-500">{children}</ol>,
  li: ({ children }) => <li className="text-slate-200 leading-relaxed">{children}</li>,

  blockquote: ({ children }) => (
    <blockquote className="my-2 pl-3 border-l-2 border-indigo-500 text-slate-400 italic">
      {children}
    </blockquote>
  ),

  hr: () => <hr className="my-3 border-slate-700" />,

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
  tbody: ({ children }) => <tbody className="divide-y divide-slate-700/40">{children}</tbody>,
  tr: ({ children }) => <tr className="hover:bg-slate-800/40 transition-colors">{children}</tr>,
  th: ({ children }) => <th className="px-3 py-2 font-semibold text-slate-300 whitespace-nowrap">{children}</th>,
  td: ({ children }) => <td className="px-3 py-2 text-slate-300 align-top">{children}</td>,
};

// ── Main component ────────────────────────────────────────────────────────────
export default function MessageBubble({ message, agentIcon, pendingImageUrl }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const showScanAnimation = message.pending && !!pendingImageUrl;

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
          'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 select-none',
          isUser
            ? 'bg-brand-600/20 border border-brand-500/30 text-brand-400'
            : showScanAnimation
            ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
            : 'bg-surface-800 border border-surface-700/60 text-slate-400'
        )}
        aria-hidden="true"
      >
        {isUser ? (
          <UserRound size={15} strokeWidth={1.75} />
        ) : agentIcon ? (
          <AgentIcon iconKey={agentIcon} size={15} strokeWidth={1.75} />
        ) : (
          <Bot size={15} strokeWidth={1.75} />
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          'max-w-[82%] rounded-2xl px-4 py-3 text-sm',
          isUser
            ? 'bg-brand-600/20 border border-brand-500/20 text-slate-100 rounded-tr-sm'
            : message.error
            ? 'bg-red-500/10 border border-red-500/20 text-red-300 rounded-tl-sm'
            : showScanAnimation
            ? 'bg-rose-950/30 border border-rose-500/20 rounded-tl-sm'
            : 'bg-surface-800/60 border border-surface-700/40 text-slate-200 rounded-tl-sm'
        )}
      >
        {showScanAnimation ? (
          <SkinScanIndicator imageUrl={pendingImageUrl} />
        ) : message.pending ? (
          <ThinkingIndicator />
        ) : message.error ? (
          <div className="flex items-start gap-2">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
            <span>{message.content}</span>
          </div>
        ) : isUser ? (
          // User messages — text + optional image preview
          <div className="space-y-2">
            {message.imagePreviewUrl && (
              <img
                src={message.imagePreviewUrl}
                alt="Attached image"
                className="max-w-[220px] max-h-[220px] rounded-xl object-cover border border-brand-500/20"
              />
            )}
            {message.content && (
              <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
            )}
          </div>
        ) : (
          // Assistant messages — full Markdown rendering
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}
