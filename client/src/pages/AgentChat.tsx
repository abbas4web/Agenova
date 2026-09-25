import { useEffect, useCallback, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAgentsStore } from '../store/agentsStore';
import { useChatStore } from '../store/chatStore';
import ChatWindow from '../components/chat/ChatWindow';
import InputBar from '../components/chat/InputBar';
import SkinProfileForm, { type SkinProfile } from '../components/chat/SkinProfileForm';
import { getAgentColors } from '../utils/agentColors';
import type { AgentColor } from '../types';
import { cn } from '../utils/cn';
import AgentIcon from '../components/common/AgentIcon';

// Marker prefix stored in conversation so we don't re-show the form on reload
const PROFILE_MARKER = '📋 My skin profile:';

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

  // ── Skin profile form state ─────────────────────────────────────────────────
  // true = form is visible and waiting for input
  const [showProfileForm, setShowProfileForm] = useState(false);
  // Track the conversation id when the form was triggered so we don't re-trigger
  const profileShownForConv = useRef<string | null>(null);

  // ── Derived: has the user already sent a profile in this conversation? ──────
  const profileAlreadySent = messages.some((m) =>
    m.role === 'user' && m.content.startsWith(PROFILE_MARKER)
  );

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // Set active agent in store so TopBar shows the agent name + icon
  useEffect(() => {
    if (agentId) setActiveAgent(agentId);
    return () => setActiveAgent(null);
  }, [agentId, setActiveAgent]);

  // Load messages when conversationId changes; reset form state on nav
  useEffect(() => {
    setShowProfileForm(false);
    if (conversationId) {
      loadConversation(conversationId);
    } else {
      startNewConversation();
    }
  }, [conversationId, loadConversation, startNewConversation]);

  // ── Show the form after the first user message in a skincare conversation ───
  useEffect(() => {
    if (!agent?.allowImages) return;                      // only for Derma
    if (profileAlreadySent) return;                       // already done
    if (showProfileForm) return;                          // already visible

    const userMessages = messages.filter((m) => m.role === 'user');
    const convKey = conversationId ?? 'new';

    // Trigger once: right after the first user message lands
    if (userMessages.length === 1 && profileShownForConv.current !== convKey) {
      profileShownForConv.current = convKey;
      setShowProfileForm(true);
    }
  }, [messages, agent?.allowImages, profileAlreadySent, showProfileForm, conversationId]);

  // ── Resolve current conversationId (may be set after first send) ────────────
  const { activeConversationId } = useChatStore();
  const resolvedConversationId = conversationId ?? activeConversationId ?? undefined;

  const handleSend = useCallback(
    async (message: string, imageBase64?: string, imageMimeType?: string, imagePreviewUrl?: string) => {
      if (!agentId) return;
      try {
        const result = await sendMessage(
          message, agentId, conversationId, imageBase64, imageMimeType, imagePreviewUrl
        );
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

  // ── Handle profile form submission ──────────────────────────────────────────
  const handleProfileSubmit = useCallback(
    async (profile: SkinProfile) => {
      setShowProfileForm(false);
      const skinTypeLabel = profile.skinType === 'not_sure' ? 'not sure' : profile.skinType;
      const lines = [
        `${PROFILE_MARKER}`,
        `• Skin type: ${skinTypeLabel}`,
        profile.routine.trim()
          ? `• Daily routine / products: ${profile.routine.trim()}`
          : null,
        profile.diet.trim()
          ? `• Diet: ${profile.diet.trim()}`
          : null,
      ]
        .filter(Boolean)
        .join('\n');

      if (!agentId) return;
      try {
        const result = await sendMessage(
          lines, agentId, resolvedConversationId
        );
        if (!conversationId && result.conversationId) {
          navigate(
            `/agent/${result.agentId}/conversation/${result.conversationId}`,
            { replace: true }
          );
          fetchConversations(agentId);
        }
      } catch {
        // Error is stored in chatStore
      }
    },
    [agentId, conversationId, resolvedConversationId, sendMessage, navigate, fetchConversations]
  );

  const handleProfileSkip = useCallback(() => {
    setShowProfileForm(false);
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────

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

      {/* Skin profile form — slides in after first message for Derma */}
      {showProfileForm && (
        <SkinProfileForm
          onSubmit={handleProfileSubmit}
          onSkip={handleProfileSkip}
          isLoading={isSending}
        />
      )}

      <InputBar
        onSend={handleSend}
        isLoading={isSending}
        placeholder={agent ? `Ask ${agent.name}…` : 'Message…'}
        showImageUpload={agent?.allowImages === true}
      />
    </div>
  );
}
