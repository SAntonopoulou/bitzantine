import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Announcements from './pages/Announcements';
import Events from './pages/Events';
import Government from './pages/Government';
import Lore from './pages/Lore';
import LoreEntryPage from './pages/LoreEntryPage';
import AdminLore from './pages/AdminLore';
import Join from './pages/Join';
import Register from './pages/Register';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Groups from './pages/Groups';
import Vote from './pages/Vote';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/events" element={<Events />} />
            <Route path="/government" element={<Government />} />
            <Route path="/lore" element={<Lore />} />
            <Route path="/lore/:entryId" element={<LoreEntryPage />} />
            <Route path="/join" element={<Join />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            
            <Route path="/profile/me" element={
              <ProtectedRoute roles={['user', 'citizen', 'officer', 'moderator', 'admin', 'super_admin']}>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/groups" element={
              <ProtectedRoute roles={['user', 'citizen', 'officer', 'moderator', 'admin', 'super_admin']}>
                <Groups />
              </ProtectedRoute>
            } />
            <Route path="/vote" element={
              <ProtectedRoute roles={['user', 'citizen', 'officer', 'moderator', 'admin', 'super_admin']}>
                <Vote />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute roles={['user', 'citizen', 'officer', 'moderator', 'admin', 'super_admin']}>
                <Settings />
              </ProtectedRoute>
            } />
            
            <Route path="/admin" element={
              <ProtectedRoute roles={['admin', 'super_admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/lore" element={
              <ProtectedRoute roles={['admin', 'super_admin']}>
                <AdminLore />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}
