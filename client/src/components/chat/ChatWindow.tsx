import { useEffect, useRef } from 'react';
import type { OptimisticMessage } from '../../types';
import MessageBubble from './MessageBubble';
import Spinner from '../common/Spinner';
import { MessageSquare } from 'lucide-react';

interface ChatWindowProps {
  messages: OptimisticMessage[];
  isLoading: boolean;
  agentIcon?: string;
  agentName?: string;
  emptyState?: React.ReactNode;
}

export default function ChatWindow({
  messages,
  isLoading,
  agentIcon,
  agentName,
  emptyState,
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        {emptyState ?? (
          <div className="text-center text-slate-600">
            <MessageSquare size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">
              Start a conversation with {agentName ?? 'the agent'}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto"
      role="log"
      aria-label="Conversation"
      aria-live="polite"
    >
      <div className="max-w-3xl mx-auto pb-4">
        {messages.map((message, index) => {
          // When this is a pending assistant bubble, check if the previous
          // user message had an image — if so, pass it for the scan animation
          const prevMessage = index > 0 ? messages[index - 1] : undefined;
          const pendingImageUrl =
            message.pending && prevMessage?.imagePreviewUrl
              ? prevMessage.imagePreviewUrl
              : undefined;

          return (
            <MessageBubble
              key={message.id}
              message={message}
              agentIcon={agentIcon}
              pendingImageUrl={pendingImageUrl}
            />
          );
        })}
        <div ref={bottomRef} aria-hidden="true" />
      </div>
    </div>
  );
}
