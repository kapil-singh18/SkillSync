import { create } from 'zustand';
import { fetchDiscover, connectUser, dismissUser, fetchConnections } from '../api/matchApi';

const useMatchStore = create((set, get) => ({
  matches: [],
  connections: [],
  isLoading: false,
  error: null,

  fetchDiscover: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await fetchDiscover();
      set({ matches: data.matches, isLoading: false });
    } catch (err) {
      set({
        error: err.response?.data?.message || 'Failed to load discover results',
        isLoading: false,
      });
    }
  },

  connect: async (userId) => {
    // Optimistic removal from discover list
    set((state) => ({
      matches: state.matches.filter((m) => m.user._id !== userId),
    }));
    try {
      await connectUser(userId);
    } catch {
      // Re-fetch on error to restore state
      get().fetchDiscover();
    }
  },

  dismiss: async (userId) => {
    // Optimistic removal from discover list
    set((state) => ({
      matches: state.matches.filter((m) => m.user._id !== userId),
    }));
    try {
      await dismissUser(userId);
    } catch {
      get().fetchDiscover();
    }
  },

  fetchConnections: async () => {
    try {
      const { data } = await fetchConnections();
      set({ connections: data.connections });
    } catch {
      // Non-critical — silently fail
    }
  },

  clearError: () => set({ error: null }),
}));

export default useMatchStore;
