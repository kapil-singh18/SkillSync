import { create } from 'zustand';
import axiosInstance from '../api/axiosInstance';

const TOKEN_KEY = 'skillsync_token';

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem(TOKEN_KEY) || null,
  isAuthenticated: !!localStorage.getItem(TOKEN_KEY),
  error: null,
  isLoading: false,

  // ─── Register ──────────────────────────────────────────────────────────────
  register: async ({ name, email, password }) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await axiosInstance.post('/auth/register', {
        name,
        email,
        password,
      });
      localStorage.setItem(TOKEN_KEY, data.token);
      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      const message =
        err.response?.data?.message || 'Registration failed. Please try again.';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  // ─── Login ─────────────────────────────────────────────────────────────────
  login: async ({ email, password }) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await axiosInstance.post('/auth/login', {
        email,
        password,
      });
      localStorage.setItem(TOKEN_KEY, data.token);
      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      const message =
        err.response?.data?.message || 'Login failed. Please check your credentials.';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  // ─── Logout ────────────────────────────────────────────────────────────────
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    // Disconnect socket if active
    import('../lib/socket').then(({ disconnectSocket }) => disconnectSocket());
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },

  // ─── Clear error ───────────────────────────────────────────────────────────
  clearError: () => set({ error: null }),
}));

export default useAuthStore;
