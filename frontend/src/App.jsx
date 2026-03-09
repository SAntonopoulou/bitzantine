import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { SiteSettingsProvider } from './context/SiteSettingsContext';
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
import Streamers from './pages/Streamers';
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
import AdminUserManagement from './pages/AdminUserManagement';
import AdminGroups from './pages/AdminGroups';
import Join from './pages/Join';
import Register from './pages/Register';
import Login from './pages/Login';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import GroupManagement from './pages/GroupManagement';
import Vote from './pages/Vote';
import Settings from './pages/Settings';
import Polls from './pages/Polls';
import PollDetail from './pages/PollDetail';
import AdminPolls from './pages/AdminPolls';
import HomeEditor from './pages/admin/HomeEditor';
import VerifyCode from './pages/VerifyCode';
import ChangePassword from './pages/ChangePassword';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen bg-stone-900 flex items-center justify-center text-amber-500">Loading...</div>;
  
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
        <NotificationProvider>
          <SiteSettingsProvider>
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
                <Route path="/streamers" element={<Streamers />} />
                <Route path="/join" element={<Join />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/profile/:username" element={<Profile />} />
                <Route path="/verify-code" element={<VerifyCode />} />
                
                {/* User Routes */}
                <Route path="/profile/edit" element={<ProtectedRoute roles={['user', 'citizen', 'officer', 'moderator', 'admin', 'super_admin']}><EditProfile /></ProtectedRoute>} />
                <Route path="/groups" element={<ProtectedRoute roles={['user', 'citizen', 'officer', 'moderator', 'admin', 'super_admin']}><Groups /></ProtectedRoute>} />
                <Route path="/groups/:id" element={<ProtectedRoute roles={['user', 'citizen', 'officer', 'moderator', 'admin', 'super_admin']}><GroupDetail /></ProtectedRoute>} />
                <Route path="/groups/:id/manage" element={<ProtectedRoute roles={['user', 'citizen', 'officer', 'moderator', 'admin', 'super_admin']}><GroupManagement /></ProtectedRoute>} />
                <Route path="/vote" element={<ProtectedRoute roles={['user', 'citizen', 'officer', 'moderator', 'admin', 'super_admin']}><Vote /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute roles={['user', 'citizen', 'officer', 'moderator', 'admin', 'super_admin']}><Settings /></ProtectedRoute>} />
                <Route path="/change-password" element={<ProtectedRoute roles={['user', 'citizen', 'officer', 'moderator', 'admin', 'super_admin']}><ChangePassword /></ProtectedRoute>} />
                <Route path="/polls" element={<ProtectedRoute roles={['user', 'citizen', 'officer', 'moderator', 'admin', 'super_admin']}><Polls /></ProtectedRoute>} />
                <Route path="/polls/:id" element={<ProtectedRoute roles={['user', 'citizen', 'officer', 'moderator', 'admin', 'super_admin']}><PollDetail /></ProtectedRoute>} />
                
                {/* Admin Routes */}
                <Route path="/admin" element={<ProtectedRoute roles={['admin', 'super_admin', 'moderator']}><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/home-editor" element={<ProtectedRoute roles={['admin', 'super_admin']}><HomeEditor /></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute roles={['admin', 'super_admin', 'moderator']}><AdminUserManagement /></ProtectedRoute>} />
                <Route path="/admin/groups" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminGroups /></ProtectedRoute>} />
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
                <Route path="/admin/polls" element={<ProtectedRoute roles={['admin', 'super_admin', 'moderator']}><AdminPolls /></ProtectedRoute>} />
              </Routes>
            </div>
          </SiteSettingsProvider>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}
