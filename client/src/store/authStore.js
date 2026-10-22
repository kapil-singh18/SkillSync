import { create } from 'zustand';
import axiosInstance from '../api/axiosInstance';

const TOKEN_KEY = 'skillsync-token';

const getStoredToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

const setStoredToken = (token) => {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Storage not available
  }
};

const useAuthStore = create((set, get) => ({
  user: null,
  token: getStoredToken(),
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  // ── Session restore ──────────────────────────────────────────────────────────
  fetchMe: async () => {
    const token = get().token;
    if (!token) {
      set({ isInitialized: true });
      return;
    }
    try {
      const { data } = await axiosInstance.get('/auth/me');
      set({ user: data.user, isAuthenticated: true, isInitialized: true });
    } catch {
      setStoredToken(null);
      set({ user: null, token: null, isAuthenticated: false, isInitialized: true });
    }
  },

  // ── Register ─────────────────────────────────────────────────────────────────
  register: async ({ name, email, password }) => {
    set({ isLoading: true });
    try {
      const { data } = await axiosInstance.post('/auth/register', { name, email, password });
      return { success: true, message: data.message };
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Login ────────────────────────────────────────────────────────────────────
  login: async ({ email, password }) => {
    set({ isLoading: true });
    try {
      const { data } = await axiosInstance.post('/auth/login', { email, password });
      setStoredToken(data.token);
      set({ user: data.user, token: data.token, isAuthenticated: true });
      return { success: true };
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Logout ───────────────────────────────────────────────────────────────────
  logout: () => {
    setStoredToken(null);
    set({ user: null, token: null, isAuthenticated: false });
  },

  // ── Verify email ─────────────────────────────────────────────────────────────
  verifyEmail: async (token) => {
    set({ isLoading: true });
    try {
      const { data } = await axiosInstance.post('/auth/verify-email', { token });
      return { success: true, message: data.message };
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Resend verification ───────────────────────────────────────────────────────
  resendVerification: async (email) => {
    set({ isLoading: true });
    try {
      const { data } = await axiosInstance.post('/auth/resend-verification', { email });
      return { success: true, message: data.message };
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Forgot password ───────────────────────────────────────────────────────────
  forgotPassword: async (email) => {
    set({ isLoading: true });
    try {
      const { data } = await axiosInstance.post('/auth/forgot-password', { email });
      return { success: true, message: data.message };
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Reset password ────────────────────────────────────────────────────────────
  resetPassword: async ({ token, password }) => {
    set({ isLoading: true });
    try {
      const { data } = await axiosInstance.post('/auth/reset-password', { token, password });
      return { success: true, message: data.message };
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Change password ───────────────────────────────────────────────────────────
  changePassword: async ({ currentPassword, newPassword }) => {
    set({ isLoading: true });
    try {
      const { data } = await axiosInstance.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      return { success: true, message: data.message };
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useAuthStore;
