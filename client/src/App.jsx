import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ui/ErrorBoundary';
import ToastProvider from './components/ui/ToastProvider';
import AppShell from './components/layout/AppShell';
import PublicLayout from './components/layout/PublicLayout';
import { ProtectedRoute, GuestRoute } from './components/ui/RouteGuards';
import useInitAuth from './hooks/useInitAuth';

// Public pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Authenticated pages
import Dashboard from './pages/Dashboard';
import Discover from './pages/Discover';
import Chat from './pages/Chat';
import Projects from './pages/Projects';
import Roadmaps from './pages/Roadmaps';
import Assessments from './pages/Assessments';
import Community from './pages/Community';
import Resources from './pages/Resources';
import Leaderboard from './pages/Leaderboard';
import Career from './pages/Career';
import Sessions from './pages/Sessions';
import Profile from './pages/Profile';
import PublicProfile from './pages/PublicProfile';
import NotFound from './pages/NotFound';

// Inner component so hooks can run inside BrowserRouter
const AppRoutes = () => {
  useInitAuth();

  return (
    <Routes>
      {/* Landing — own layout */}
      <Route path="/" element={<Landing />} />

      {/* Public auth routes — minimal layout, redirect if already logged in */}
      <Route element={<PublicLayout />}>
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <Register />
            </GuestRoute>
          }
        />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      {/* Protected routes — app shell with sidebar */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/roadmaps" element={<Roadmaps />} />
        <Route path="/assessments" element={<Assessments />} />
        <Route path="/community" element={<Community />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/career" element={<Career />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <ErrorBoundary>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
    <ToastProvider />
  </ErrorBoundary>
);

export default App;
