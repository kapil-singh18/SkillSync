import { useEffect } from 'react';
import useAuthStore from '../store/authStore';
import useToastStore from '../store/toastStore';

/**
 * Runs once on app mount to:
 * 1. Restore the user session from a stored token (GET /api/auth/me).
 * 2. Listen for the skillsync:session-expired custom event emitted by
 *    the axios interceptor on 401 responses, clearing auth state and
 *    showing a toast before the page redirects.
 */
const useInitAuth = () => {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const logout = useAuthStore((s) => s.logout);
  const addToast = useToastStore((s) => s.addToast);

  useEffect(() => {
    fetchMe();

    const handleExpired = (event) => {
      logout();
      addToast({ type: 'error', message: event.detail?.message || 'Session expired. Please log in again.' });
    };

    window.addEventListener('skillsync:session-expired', handleExpired);
    return () => window.removeEventListener('skillsync:session-expired', handleExpired);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

export default useInitAuth;
