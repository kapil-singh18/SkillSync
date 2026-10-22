import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import Spinner from './Spinner';

/**
 * ProtectedRoute — redirects unauthenticated users to /login,
 * preserving the intended destination in location state.
 * Shows a full-screen spinner while the session is initializing.
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const location = useLocation();

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

/**
 * GuestRoute — redirects authenticated users away from login/register.
 */
const GuestRoute = ({ children }) => {
  const { isAuthenticated, isInitialized } = useAuthStore();

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

/**
 * RoleRoute — restricts access to users with one of the allowed roles.
 * Must be used inside a ProtectedRoute.
 *
 * @param {{ allowedRoles: string[], children: React.ReactNode }} props
 */
const RoleRoute = ({ allowedRoles, children }) => {
  const user = useAuthStore((s) => s.user);

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export { ProtectedRoute, GuestRoute, RoleRoute };
