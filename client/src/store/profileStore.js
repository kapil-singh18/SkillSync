import { create } from 'zustand';
import axiosInstance from '../api/axiosInstance';
import useAuthStore from './authStore';

const useProfileStore = create((set) => ({
  profile: null,
  completeness: 0,
  isLoading: false,
  isSaving: false,

  // ── Fetch own full profile ──────────────────────────────────────────────────
  fetchProfile: async () => {
    set({ isLoading: true });
    try {
      const { data } = await axiosInstance.get('/users/profile');
      set({ profile: data.user, completeness: data.profileCompleteness });
      // Sync authStore user so TopBar avatar updates
      useAuthStore.getState().fetchMe();
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Update profile fields ───────────────────────────────────────────────────
  updateProfile: async (fields) => {
    set({ isSaving: true });
    try {
      const { data } = await axiosInstance.put('/users/profile', fields);
      set({ profile: data.user, completeness: data.profileCompleteness });
      useAuthStore.setState({ user: data.user });
      return { success: true };
    } finally {
      set({ isSaving: false });
    }
  },

  // ── Change student ↔ mentor role ────────────────────────────────────────────
  changeRole: async (role) => {
    set({ isSaving: true });
    try {
      const { data } = await axiosInstance.put('/users/role', { role });
      set((s) => ({ profile: { ...s.profile, role: data.user.role } }));
      useAuthStore.setState({ user: data.user });
      return { success: true };
    } finally {
      set({ isSaving: false });
    }
  },

  // ── Upload avatar ───────────────────────────────────────────────────────────
  uploadAvatar: async (file) => {
    set({ isSaving: true });
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const { data } = await axiosInstance.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      set({ profile: data.user, completeness: data.profileCompleteness });
      useAuthStore.setState({ user: data.user });
      return { success: true };
    } finally {
      set({ isSaving: false });
    }
  },

  // ── Remove avatar ───────────────────────────────────────────────────────────
  removeAvatar: async () => {
    set({ isSaving: true });
    try {
      const { data } = await axiosInstance.delete('/users/avatar');
      set({ profile: data.user, completeness: data.profileCompleteness });
      useAuthStore.setState({ user: data.user });
      return { success: true };
    } finally {
      set({ isSaving: false });
    }
  },

  // ── Fetch another user's public profile ────────────────────────────────────
  fetchPublicProfile: async (id) => {
    set({ isLoading: true });
    try {
      const { data } = await axiosInstance.get(`/users/${id}`);
      return { success: true, user: data.user };
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useProfileStore;
