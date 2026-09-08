import axios, { type AxiosError } from 'axios';
import type {
  Agent,
  AuthResponse,
  ChatRequest,
  ChatResponse,
  Conversation,
  Message,
  User,
  UserPreferences,
} from '../types';

// ── Axios instance ─────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 60_000, // AI calls can be slow
});

// ── Auth token injection ───────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('agentora_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response error normalisation ──────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error: string; details?: string }>) => {
    const message =
      error.response?.data?.error ??
      error.message ??
      'An unexpected error occurred.';
    return Promise.reject(new Error(message));
  }
);

// ── Auth endpoints ────────────────────────────────────────────────────────────
export const authApi = {
  register: async (email: string, password: string, displayName: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/register', {
      email,
      password,
      displayName,
    });
    return data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    return data;
  },

  me: async (): Promise<User> => {
    const { data } = await api.get<{ user: User }>('/auth/me');
    return data.user;
  },
};

// ── Agents endpoints ──────────────────────────────────────────────────────────
export const agentsApi = {
  getAll: async (): Promise<Agent[]> => {
    const { data } = await api.get<{ agents: Agent[] }>('/agents');
    return data.agents;
  },

  getOne: async (id: string): Promise<Agent> => {
    const { data } = await api.get<{ agent: Agent }>(`/agents/${id}`);
    return data.agent;
  },
};

// ── Chat endpoint ─────────────────────────────────────────────────────────────
export const chatApi = {
  send: async (payload: ChatRequest): Promise<ChatResponse> => {
    const { data } = await api.post<ChatResponse>('/chat', payload);
    return data;
  },
};

// ── Conversations endpoints ───────────────────────────────────────────────────
export const conversationsApi = {
  list: async (agentId?: string): Promise<Conversation[]> => {
    const { data } = await api.get<{ conversations: Conversation[] }>('/conversations', {
      params: agentId ? { agentId } : undefined,
    });
    return data.conversations;
  },

  getMessages: async (conversationId: string): Promise<Message[]> => {
    const { data } = await api.get<{ messages: Message[] }>(
      `/conversations/${conversationId}/messages`
    );
    return data.messages;
  },

  updateTitle: async (conversationId: string, title: string): Promise<void> => {
    await api.patch(`/conversations/${conversationId}`, { title });
  },

  delete: async (conversationId: string): Promise<void> => {
    await api.delete(`/conversations/${conversationId}`);
  },
};

// ── Users endpoints ───────────────────────────────────────────────────────────
export const usersApi = {
  updatePreferences: async (preferences: Partial<UserPreferences>): Promise<User> => {
    const { data } = await api.patch<{ user: User }>('/users/me/preferences', preferences);
    return data.user;
  },

  updateDisplayName: async (displayName: string): Promise<User> => {
    const { data } = await api.patch<{ user: User }>('/users/me/display-name', { displayName });
    return data.user;
  },

  updatePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await api.patch('/users/me/password', { currentPassword, newPassword });
  },
};

export default api;
