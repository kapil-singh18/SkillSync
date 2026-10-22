import axios from 'axios';

const TOKEN_KEY = 'skillsync-token';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor — attaches Bearer token ───────────────────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // localStorage not available
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — handles 401 session expiry ─────────────────────────
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';

    // On 401 from any protected route (not from login/register themselves)
    const isAuthMutation =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/me');

    if (status === 401 && !isAuthMutation) {
      try {
        localStorage.removeItem(TOKEN_KEY);
      } catch {
        // ignore
      }

      // Dispatch a custom event; authStore subscribes to it in useInitAuth
      window.dispatchEvent(
        new CustomEvent('skillsync:session-expired', {
          detail: { message: 'Your session has expired. Please log in again.' },
        })
      );

      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login?reason=session-expired';
      }
    }

    // Normalise error — preserve status, code, and field errors
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';

    const enhancedError = new Error(message);
    enhancedError.status = status;
    enhancedError.code = error.response?.data?.code;
    enhancedError.errors = error.response?.data?.errors;
    return Promise.reject(enhancedError);
  }
);

export default axiosInstance;
