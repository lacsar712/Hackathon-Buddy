import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Projects from './pages/Projects';
import Matching from './pages/Matching';
import Chat from './pages/Chat';
import PrivateChat from './pages/PrivateChat';
import EditorPage from './pages/EditorPage';
import Landing from './pages/Landing';
import HackathonExplorer from './pages/HackathonExplorer';

// Protect routes - redirect to login if not authenticated
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen bg-hb-bg text-gray-400 font-bold animate-pulse text-xl">🚀 HACKATHONBUDDY</div>;
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : children;
};

function AppRoutes() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-hb-bg">
      {user && <Navbar />}
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Landing />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/projects" element={<PrivateRoute><Projects /></PrivateRoute>} />
        <Route path="/match" element={<PrivateRoute><Matching /></PrivateRoute>} />
        <Route path="/hackathons" element={<PrivateRoute><HackathonExplorer/></PrivateRoute>} />
        <Route path="/chat/:projectId" element={<PrivateRoute><Chat /></PrivateRoute>} />
        <Route path="/chat/private/:recipientId" element={<PrivateRoute><PrivateChat /></PrivateRoute>} />
        <Route path="/editor/:projectId" element={<PrivateRoute><EditorPage /></PrivateRoute>} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
