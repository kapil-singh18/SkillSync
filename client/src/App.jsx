import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Discover from './pages/Discover';
import Chat from './pages/Chat';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Roadmap from './pages/Roadmap';
import RoadmapDetail from './pages/RoadmapDetail';
import Assessments from './pages/Assessments';
import Community from './pages/Community';
import Leaderboard from './pages/Leaderboard';
import Resume from './pages/Resume';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/roadmap/:id" element={<RoadmapDetail />} />
          <Route path="/assessments" element={<Assessments />} />
          <Route path="/community" element={<Community />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/resume" element={<Resume />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

