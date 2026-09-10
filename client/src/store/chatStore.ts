import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Conversation, OptimisticMessage } from '../types';
import { chatApi, conversationsApi } from '../services/api';

interface ChatState {
  // Conversations list (sidebar)
  conversations: Conversation[];
  conversationsLoading: boolean;

  // Active conversation
  activeConversationId: string | null;
  messages: OptimisticMessage[];
  messagesLoading: boolean;

  // Sending state
  isSending: boolean;
  sendError: string | null;

  // Actions
  fetchConversations: (agentId?: string) => Promise<void>;
  loadConversation: (conversationId: string) => Promise<void>;
  sendMessage: (
    message: string,
    agentId: string,
    conversationId?: string,
    imageBase64?: string,
    imageMimeType?: string,
    imagePreviewUrl?: string,
  ) => Promise<{ conversationId: string; agentId: string }>;
  startNewConversation: () => void;
  deleteConversation: (conversationId: string) => Promise<void>;
  updateConversationTitle: (conversationId: string, title: string) => Promise<void>;
  clearSendError: () => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  conversationsLoading: false,
  activeConversationId: null,
  messages: [],
  messagesLoading: false,
  isSending: false,
  sendError: null,

  fetchConversations: async (agentId) => {
    set({ conversationsLoading: true });
    try {
      const conversations = await conversationsApi.list(agentId);
      set({ conversations, conversationsLoading: false });
    } catch {
      set({ conversationsLoading: false });
    }
  },

  loadConversation: async (conversationId) => {
    set({ messagesLoading: true, activeConversationId: conversationId, messages: [] });
    try {
      const serverMessages = await conversationsApi.getMessages(conversationId);
      const optimistic: OptimisticMessage[] = serverMessages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
        }));
      set({ messages: optimistic, messagesLoading: false });
    } catch {
      set({ messagesLoading: false });
    }
  },

  sendMessage: async (message, agentId, conversationId, imageBase64, imageMimeType, imagePreviewUrl) => {
    const userMsgId = uuidv4();
    const thinkingMsgId = uuidv4();

    // ── 1. Optimistic update ─────────────────────────────────────────────────
    const userOptimistic: OptimisticMessage = {
      id: userMsgId,
      role: 'user',
      content: message,
      // Attach preview URL so MessageBubble can show the image inline
      ...(imagePreviewUrl ? { imagePreviewUrl } : {}),
    };

    set((state) => ({
      isSending: true,
      sendError: null,
      messages: [
        ...state.messages,
        userOptimistic,
        { id: thinkingMsgId, role: 'assistant', content: '', pending: true },
      ],
    }));

    try {
      const response = await chatApi.send({
        message,
        agentId,
        conversationId: conversationId ?? get().activeConversationId ?? undefined,
        imageBase64,
        imageMimeType,
      });

      // ── 2. Replace thinking indicator with real response ──────────────────
      set((state) => ({
        isSending: false,
        activeConversationId: response.conversationId,
        messages: state.messages.map((m) =>
          m.id === thinkingMsgId
            ? { id: response.messageId, role: 'assistant' as const, content: response.reply }
            : m
        ),
      }));

      get().fetchConversations(agentId);

      return { conversationId: response.conversationId, agentId: response.agentId };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message.';

      set((state) => ({
        isSending: false,
        sendError: errorMessage,
        messages: state.messages.map((m) =>
          m.id === thinkingMsgId
            ? { ...m, pending: false, error: true, content: errorMessage }
            : m
        ),
      }));

      throw err;
    }
  },

  startNewConversation: () => {
    set({ activeConversationId: null, messages: [], sendError: null });
  },

  deleteConversation: async (conversationId) => {
    await conversationsApi.delete(conversationId);
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== conversationId),
      ...(state.activeConversationId === conversationId
        ? { activeConversationId: null, messages: [] }
        : {}),
    }));
  },

  updateConversationTitle: async (conversationId, title) => {
    await conversationsApi.updateTitle(conversationId, title);
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, title } : c
      ),
    }));
  },

  clearSendError: () => set({ sendError: null }),
  clearMessages: () => set({ messages: [], activeConversationId: null }),
}));
