import { create } from 'zustand';
import axiosInstance from '../api/axiosInstance';

const useGamificationStore = create((set) => ({
  leaderboard: [],
  allBadges: [],
  myStats: null,
  isLoading: false,
  error: null,

  // ─── Leaderboard ───────────────────────────────────────────────────────────
  fetchLeaderboard: async (limit = 20) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await axiosInstance.get('/gamification/leaderboard', {
        params: { limit },
      });
      set({ leaderboard: data.data, isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to load leaderboard', isLoading: false });
    }
  },

  // ─── All badges ───────────────────────────────────────────────────────────
  fetchAllBadges: async () => {
    try {
      const { data } = await axiosInstance.get('/gamification/badges');
      set({ allBadges: data.data });
    } catch (err) {
      console.error('Failed to load badges:', err);
    }
  },

  // ─── My stats ─────────────────────────────────────────────────────────────
  fetchMyStats: async () => {
    try {
      const { data } = await axiosInstance.get('/gamification/me');
      set({ myStats: data.data });
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  },
}));

export default useGamificationStore;
