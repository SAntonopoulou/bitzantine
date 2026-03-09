import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { api } from '../api';
import ConfirmationModal from '../components/ConfirmationModal';
import { Tv, Globe, Users } from 'lucide-react';

const PrivacySelector = ({ label, value, onChange, options }) => (
  <div className="flex flex-col space-y-2">
    <label className="text-xs font-bold uppercase tracking-wider text-stone-500">{label} Visibility</label>
    <div className="flex bg-stone-900/50 rounded-lg p-1 border border-stone-700">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-xs font-medium transition-all ${value === opt.id ? 'bg-stone-700 text-amber-500 shadow-sm' : 'text-stone-500 hover:text-stone-300'}`}
          title={opt.label}
        >
          <opt.icon className={`w-4 h-4 ${value === opt.id ? opt.color : ''}`} />
          <span className="hidden sm:inline">{opt.label}</span>
        </button>
      ))}
    </div>
  </div>
);

export default function Settings() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [streamerApplication, setStreamerApplication] = useState({ twitch: '', youtube: '' });

  const fetchProfile = async () => {
    if (user) {
      try {
        const res = await api.get(`/users/${user.username}/profile`);
        setProfile(res.data);
        setStreamerApplication({
          twitch: res.data.social_links?.twitch || '',
          youtube: res.data.social_links?.youtube || ''
        });
      } catch (err) {
        console.error("Failed to fetch profile for settings", err);
      }
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const handleDeleteAccount = async () => {
    setIsDeleteModalOpen(false);
    try {
      await api.delete('/users/me');
      showNotification('Your account has been successfully deleted.', 'success');
      logout();
      navigate('/');
    } catch (error) {
      showNotification('Failed to delete account. Please try again.', 'error');
    }
  };

  const handleStreamerApply = async () => {
    const links = {};
    if (streamerApplication.twitch) links.twitch = streamerApplication.twitch;
    if (streamerApplication.youtube) links.youtube = streamerApplication.youtube;

    if (Object.keys(links).length === 0) {
      showNotification("Please provide at least one streamer profile link.", "error");
      return;
    }

    try {
      await api.post('/users/me/streamer-apply', links);
      showNotification("Application submitted! You'll be notified upon review.", "success");
      setIsApplyModalOpen(false);
      fetchProfile();
    } catch (err) {
      showNotification(err.response?.data?.detail || "Failed to submit application.", "error");
    }
  };

  const handleVisibilityChange = async (level) => {
    try {
        await api.patch(`/users/me/streamer-settings?visibility=${level}`);
        showNotification("Visibility updated successfully.", "success");
        setProfile(prev => ({...prev, streamer_visibility: level}));
    } catch (err) {
        showNotification("Failed to update visibility.", "error");
    }
  };

  const StreamerApplicationSection = () => {
    if (!profile || !user || !['citizen', 'officer', 'moderator', 'admin', 'super_admin'].includes(user.role)) {
      return null;
    }
  
    switch (profile.streamer_status) {
      case 'none':
      case 'rejected':
        return (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-stone-200">Guild Streamer Program</h2>
              <p className="text-stone-400 text-sm mt-1">Promote your stream to the entire guild on our dedicated Streamers page.</p>
              {profile.streamer_status === 'rejected' && <p className="text-red-400 text-sm mt-1">Your previous application was not approved. You may apply again.</p>}
            </div>
            <button onClick={() => setIsApplyModalOpen(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors font-medium">
              <Tv size={16} /> Apply Now
            </button>
          </div>
        );
      case 'pending':
        return <div><h2 className="text-lg sm:text-xl font-semibold text-stone-200">Guild Streamer Program</h2><p className="text-amber-400 mt-2 p-4 bg-stone-700/50 rounded-lg">Your streamer application is under review.</p></div>;
      case 'approved':
        return (
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-green-400">You are an Approved Guild Streamer!</h2>
            <p className="text-stone-400 text-sm mt-1 mb-4">Control who can see you on the streamers page.</p>
            <PrivacySelector
              label="Streamer"
              value={profile.streamer_visibility}
              onChange={handleVisibilityChange}
              options={[
                { id: 'public', label: 'Public', icon: Globe, color: 'text-green-500' },
                { id: 'members_only', label: 'Guild Members', icon: Users, color: 'text-blue-500' },
              ]}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="p-4 sm:p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-amber-500 mb-8">Settings</h1>
        <div className="bg-stone-800 rounded-lg shadow-lg p-4 sm:p-6 border border-stone-700">
          <div className="space-y-6">
            <div className="pb-6 border-b border-stone-700"><StreamerApplicationSection /></div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-stone-700 gap-4">
              <div><h2 className="text-lg sm:text-xl font-semibold text-stone-200">Profile Settings</h2><p className="text-stone-400 text-sm mt-1">Update your personal information and profile appearance.</p></div>
              <Link to="/profile/edit" className="w-full sm:w-auto text-center px-4 py-2 bg-stone-700 text-stone-200 rounded hover:bg-stone-600 transition-colors font-medium">Edit Profile</Link>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-stone-700 gap-4">
              <div><h2 className="text-lg sm:text-xl font-semibold text-stone-200">Account Security</h2><p className="text-stone-400 text-sm mt-1">Change your password and manage account security.</p></div>
              <button className="w-full sm:w-auto px-4 py-2 bg-stone-700 text-stone-300 rounded hover:bg-stone-600 transition-colors cursor-not-allowed opacity-50">Change Password</button>
            </div>
            <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div><h2 className="text-lg sm:text-xl font-semibold text-red-400">Delete Account</h2><p className="text-red-300/70 text-sm mt-1">Permanently delete your account and all associated data. This action cannot be undone.</p></div>
                <button onClick={() => setIsDeleteModalOpen(true)} className="w-full sm:w-auto px-4 py-2 bg-red-800 text-white rounded hover:bg-red-700 transition-colors font-medium">Delete Account</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteAccount} title="Confirm Account Deletion" message="Are you absolutely sure? All of your data will be permanently removed. This action cannot be undone." confirmText="Yes, Delete My Account" isDestructive={true} />
      <ConfirmationModal 
        isOpen={isApplyModalOpen} 
        onClose={() => setIsApplyModalOpen(false)} 
        onConfirm={handleStreamerApply} 
        title="Apply for Guild Streamer" 
        confirmText="Submit Application"
        message="Provide your streaming channel usernames. At least one is required."
      >
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-stone-300 mb-1">Twitch Username</label>
                <input 
                    type="text" 
                    value={streamerApplication.twitch} 
                    onChange={(e) => setStreamerApplication({...streamerApplication, twitch: e.target.value})} 
                    className="mt-1 block w-full rounded-md bg-stone-900 border-stone-600 text-stone-200 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm" 
                    placeholder="your_twitch_name" 
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-stone-300 mb-1">YouTube Handle</label>
                <input 
                    type="text" 
                    value={streamerApplication.youtube} 
                    onChange={(e) => setStreamerApplication({...streamerApplication, youtube: e.target.value})} 
                    className="mt-1 block w-full rounded-md bg-stone-900 border-stone-600 text-stone-200 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm" 
                    placeholder="@YourYouTubeHandle" 
                />
            </div>
        </div>
      </ConfirmationModal>
    </>
  );
}
