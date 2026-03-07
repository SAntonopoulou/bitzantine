import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Announcements from './pages/Announcements';
import AnnouncementDetail from './pages/AnnouncementDetail';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Government from './pages/Government';
import Lore from './pages/Lore';
import LoreEntryPage from './pages/LoreEntryPage';
import EraPage from './pages/EraPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminLore from './pages/AdminLore';
import AddEra from './pages/AddEra';
import AddEntry from './pages/AddEntry';
import EditEraPage from './pages/EditEraPage';
import EditEntryPage from './pages/EditEntryPage';
import AdminAnnouncements from './pages/AdminAnnouncements';
import AddAnnouncement from './pages/AddAnnouncement';
import EditAnnouncement from './pages/EditAnnouncement';
import AdminEvents from './pages/AdminEvents';
import AddEvent from './pages/AddEvent';
import EditEvent from './pages/EditEvent';
import AddEventTemplate from './pages/AddEventTemplate';
import EditEventTemplate from './pages/EditEventTemplate';
import Join from './pages/Join';
import Register from './pages/Register';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Groups from './pages/Groups';
import Vote from './pages/Vote';
import Settings from './pages/Settings';

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
        <div className="min-h-screen bg-stone-900 text-stone-200">
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/announcements/:id" element={<AnnouncementDetail />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/government" element={<Government />} />
            <Route path="/lore" element={<Lore />} />
            <Route path="/lore/eras/:eraId" element={<EraPage />} />
            <Route path="/lore/:entryId" element={<LoreEntryPage />} />
            <Route path="/join" element={<Join />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            
            {/* User Routes */}
            <Route path="/profile/me" element={<ProtectedRoute roles={['user', 'citizen', 'officer', 'moderator', 'admin', 'super_admin']}><Profile /></ProtectedRoute>} />
            <Route path="/groups" element={<ProtectedRoute roles={['user', 'citizen', 'officer', 'moderator', 'admin', 'super_admin']}><Groups /></ProtectedRoute>} />
            <Route path="/vote" element={<ProtectedRoute roles={['user', 'citizen', 'officer', 'moderator', 'admin', 'super_admin']}><Vote /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute roles={['user', 'citizen', 'officer', 'moderator', 'admin', 'super_admin']}><Settings /></ProtectedRoute>} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/lore" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminLore /></ProtectedRoute>} />
            <Route path="/admin/lore/add-era" element={<ProtectedRoute roles={['admin', 'super_admin']}><AddEra /></ProtectedRoute>} />
            <Route path="/admin/lore/add-entry" element={<ProtectedRoute roles={['admin', 'super_admin']}><AddEntry /></ProtectedRoute>} />
            <Route path="/admin/lore/edit-era/:eraId" element={<ProtectedRoute roles={['admin', 'super_admin']}><EditEraPage /></ProtectedRoute>} />
            <Route path="/admin/lore/edit-entry/:entryId" element={<ProtectedRoute roles={['admin', 'super_admin']}><EditEntryPage /></ProtectedRoute>} />
            <Route path="/admin/announcements" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminAnnouncements /></ProtectedRoute>} />
            <Route path="/admin/announcements/add" element={<ProtectedRoute roles={['admin', 'super_admin']}><AddAnnouncement /></ProtectedRoute>} />
            <Route path="/admin/announcements/edit/:id" element={<ProtectedRoute roles={['admin', 'super_admin']}><EditAnnouncement /></ProtectedRoute>} />
            <Route path="/admin/events" element={<ProtectedRoute roles={['admin', 'super_admin', 'moderator']}><AdminEvents /></ProtectedRoute>} />
            <Route path="/admin/events/add" element={<ProtectedRoute roles={['admin', 'super_admin', 'moderator']}><AddEvent /></ProtectedRoute>} />
            <Route path="/admin/events/edit/:id" element={<ProtectedRoute roles={['admin', 'super_admin', 'moderator']}><EditEvent /></ProtectedRoute>} />
            <Route path="/admin/events/templates/add" element={<ProtectedRoute roles={['admin', 'super_admin']}><AddEventTemplate /></ProtectedRoute>} />
            <Route path="/admin/events/templates/edit/:id" element={<ProtectedRoute roles={['admin', 'super_admin']}><EditEventTemplate /></ProtectedRoute>} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}
