import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { authApi } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  clearError: () => void;
  hydrateFromToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const result = await authApi.login(email, password);
          localStorage.setItem('agentora_token', result.token);
          set({
            user: result.user,
            token: result.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err) {
          set({
            isLoading: false,
            error: err instanceof Error ? err.message : 'Login failed.',
          });
          throw err;
        }
      },

      register: async (email, password, displayName) => {
        set({ isLoading: true, error: null });
        try {
          const result = await authApi.register(email, password, displayName);
          localStorage.setItem('agentora_token', result.token);
          set({
            user: result.user,
            token: result.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err) {
          set({
            isLoading: false,
            error: err instanceof Error ? err.message : 'Registration failed.',
          });
          throw err;
        }
      },

      logout: () => {
        localStorage.removeItem('agentora_token');
        set({ user: null, token: null, isAuthenticated: false, error: null });
      },

      setUser: (user) => set({ user }),

      clearError: () => set({ error: null }),

      hydrateFromToken: async () => {
        const token = localStorage.getItem('agentora_token');
        if (!token || get().isAuthenticated) return;

        try {
          const user = await authApi.me();
          set({ user, token, isAuthenticated: true });
        } catch {
          // Token expired or invalid — clear it
          localStorage.removeItem('agentora_token');
          set({ user: null, token: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'agentora-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
