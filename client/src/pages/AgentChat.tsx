import { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAgentsStore } from '../store/agentsStore';
import { useChatStore } from '../store/chatStore';
import ChatWindow from '../components/chat/ChatWindow';
import InputBar from '../components/chat/InputBar';
import { getAgentColors } from '../utils/agentColors';
import type { AgentColor } from '../types';
import { cn } from '../utils/cn';
import AgentIcon from '../components/common/AgentIcon';

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

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // Set active agent in store so TopBar shows the agent name + icon
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
    async (message: string, imageBase64?: string, imageMimeType?: string, imagePreviewUrl?: string) => {
      if (!agentId) return;
      try {
        const result = await sendMessage(message, agentId, conversationId, imageBase64, imageMimeType, imagePreviewUrl);
        if (!conversationId && result.conversationId) {
          navigate(
            `/agent/${result.agentId}/conversation/${result.conversationId}`,
            { replace: true }
          );
          fetchConversations(agentId);
        }
      } catch {
        // Error is stored in chatStore — MessageBubble renders it
      }
    },
    [agentId, conversationId, sendMessage, navigate, fetchConversations]
  );

  if (!agent && !messagesLoading) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500">
        <p className="text-sm">Agent not found.</p>
      </div>
    );
  }

  const colors = agent ? getAgentColors(agent.color as AgentColor) : null;

  return (
    <div className="h-full flex flex-col min-w-0 overflow-hidden">
      {/* Chat window — no duplicate header, TopBar already shows agent */}
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
                  'w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4',
                  colors?.bgLight,
                  colors?.text
                )}
                aria-hidden="true"
              >
                <AgentIcon iconKey={agent.icon} size={32} strokeWidth={1.5} />
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

      <InputBar
        onSend={handleSend}
        isLoading={isSending}
        placeholder={agent ? `Ask ${agent.name}…` : 'Message…'}
      />
    </div>
  );
}
