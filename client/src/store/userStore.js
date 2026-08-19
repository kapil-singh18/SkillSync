import { create } from 'zustand';
import { fetchMyProfile, updateMyProfile } from '../api/userApi';

const useUserStore = create((set) => ({
  profile: null,
  isLoading: false,
  isSaving: false,
  error: null,
  saveSuccess: false,

  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await fetchMyProfile();
      set({ profile: data.user, isLoading: false });
    } catch (err) {
      set({
        error: err.response?.data?.message || 'Failed to load profile',
        isLoading: false,
      });
    }
  },

  updateProfile: async (updates) => {
    set({ isSaving: true, error: null, saveSuccess: false });
    try {
      const { data } = await updateMyProfile(updates);
      set({ profile: data.user, isSaving: false, saveSuccess: true });
      // Auto-clear success flag after 3 s
      setTimeout(() => set({ saveSuccess: false }), 3000);
    } catch (err) {
      set({
        error: err.response?.data?.message || 'Failed to save profile',
        isSaving: false,
        saveSuccess: false,
      });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));

export default useUserStore;
