import { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAgentsStore } from '../store/agentsStore';
import { useChatStore } from '../store/chatStore';
import ChatWindow from '../components/chat/ChatWindow';
import InputBar from '../components/chat/InputBar';
import AgentCard from '../components/chat/AgentCard';
import { getAgentColors } from '../utils/agentColors';
import type { AgentColor } from '../types';
import { cn } from '../utils/cn';

export default function AgentChat() {
  const { agentId, conversationId } = useParams<{
    agentId: string;
    conversationId?: string;
  }>();

  const navigate = useNavigate();
  const { getAgent, setActiveAgent, fetchAgents } = useAgentsStore();
  const {
    messages,
    messagesLoading,
    isSending,
    sendMessage,
    loadConversation,
    startNewConversation,
    fetchConversations,
  } = useChatStore();

  const agent = agentId ? getAgent(agentId) : undefined;

  // Ensure agents are loaded (handles direct URL navigation)
  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // Set active agent in store for the TopBar display
  useEffect(() => {
    if (agentId) setActiveAgent(agentId);
    return () => setActiveAgent(null);
  }, [agentId, setActiveAgent]);

  // Load messages when conversationId changes
  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    } else {
      startNewConversation();
    }
  }, [conversationId, loadConversation, startNewConversation]);

  const handleSend = useCallback(
    async (message: string) => {
      if (!agentId) return;
      try {
        const result = await sendMessage(message, agentId, conversationId);

        // Navigate to the conversation URL after first message
        if (!conversationId && result.conversationId) {
          navigate(
            `/agent/${result.agentId}/conversation/${result.conversationId}`,
            { replace: true }
          );
          fetchConversations(agentId);
        }
      } catch {
        // Error is already stored in chatStore — MessageBubble renders it
      }
    },
    [agentId, conversationId, sendMessage, navigate, fetchConversations]
  );

  function handleNewChat() {
    if (agentId) {
      startNewConversation();
      navigate(`/agent/${agentId}`);
    }
  }

  // If agent not found (direct URL with bad ID), show a not-found state
  if (!agent && !messagesLoading) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500">
        <p className="text-sm">Agent not found.</p>
      </div>
    );
  }

  const colors = agent ? getAgentColors(agent.color as AgentColor) : null;

  return (
    <div className="h-full flex flex-col">
      {/* Agent header bar */}
      {agent && (
        <div
          className={cn(
            'flex items-center justify-between px-4 py-2.5 border-b border-surface-800/40 flex-shrink-0',
            'bg-surface-950/60'
          )}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center text-lg flex-shrink-0',
                colors?.bgLight
              )}
              aria-hidden="true"
            >
              {agent.icon}
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white">{agent.name}</h1>
              <p className="text-[11px] text-slate-500 hidden sm:block truncate max-w-xs">
                {agent.description}
              </p>
            </div>
          </div>

          <button
            onClick={handleNewChat}
            aria-label="New conversation"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-surface-800 border border-transparent hover:border-surface-700/60 transition-all"
          >
            <Plus size={13} />
            <span className="hidden sm:inline">New chat</span>
          </button>
        </div>
      )}

      {/* Chat window — takes all remaining space */}
      <ChatWindow
        messages={messages}
        isLoading={messagesLoading}
        agentIcon={agent?.icon}
        agentName={agent?.name}
        emptyState={
          agent && (
            <div className="text-center max-w-sm px-4">
              <div
                className={cn(
                  'w-16 h-16 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4',
                  colors?.bgLight
                )}
                aria-hidden="true"
              >
                {agent.icon}
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">{agent.name}</h2>
              <p className="text-sm text-slate-500 leading-relaxed">{agent.description}</p>
              <p className="text-xs text-slate-600 mt-4">
                Send a message to start the conversation.
              </p>
            </div>
          )
        }
      />

      {/* Input bar */}
      <InputBar
        onSend={handleSend}
        isLoading={isSending}
        placeholder={agent ? `Ask ${agent.name}…` : 'Message…'}
      />
    </div>
  );
}
