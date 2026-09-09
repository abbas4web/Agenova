import { create } from 'zustand';
import type { Agent } from '../types';
import { agentsApi } from '../services/api';

interface AgentsState {
  agents: Agent[];
  activeAgentId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchAgents: () => Promise<void>;
  setActiveAgent: (agentId: string | null) => void;
  getAgent: (agentId: string) => Agent | undefined;
}

export const useAgentsStore = create<AgentsState>((set, get) => ({
  agents: [],
  activeAgentId: null,
  isLoading: false,
  error: null,

  fetchAgents: async () => {
    set({ isLoading: true, error: null });
    try {
      const agents = await agentsApi.getAll();
      set({ agents, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load agents.',
      });
    }
  },

  setActiveAgent: (agentId) => set({ activeAgentId: agentId }),

  getAgent: (agentId) => get().agents.find((a) => a.id === agentId),
}));
