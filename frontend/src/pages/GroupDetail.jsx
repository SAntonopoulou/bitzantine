import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, API_URL } from '../api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import ConfirmationModal from '../components/ConfirmationModal';
import { Settings, LogOut, UserPlus } from 'lucide-react';

export default function GroupDetail() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [groupData, setGroupData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { showNotification } = useNotification();
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  useEffect(() => {
    fetchGroup();
  }, [id]);

  const fetchGroup = async () => {
    try {
      const res = await api.get(`/groups/${id}`);
      setGroupData(res.data);
    } catch (err) {
      setError('Failed to load group details');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    try {
      await api.post(`/groups/${id}/apply`);
      showNotification('Application submitted successfully!', 'success');
      fetchGroup();
    } catch (err) {
      showNotification(err.response?.data?.detail || 'Failed to apply', 'error');
    }
  };

  const confirmLeave = async () => {
    try {
      await api.delete(`/groups/${id}/members/${currentUser.id}`);
      showNotification('You have left the group', 'success');
      navigate('/groups');
    } catch (err) {
      showNotification(err.response?.data?.detail || 'Failed to leave group', 'error');
    } finally {
      setIsLeaveModalOpen(false);
    }
  };

  if (loading) return <div className="p-4 sm:p-8 text-stone-400 text-center">Loading...</div>;
  if (error) return <div className="p-4 sm:p-8 text-red-500 text-center">{error}</div>;
  if (!groupData) return <div className="p-4 sm:p-8 text-stone-400 text-center">Group not found</div>;

  const { group, members } = groupData;
  const isLeader = currentUser?.id == group.leader_id;
  const isOfficer = members.some(m => m.user.id == currentUser?.id && m.role === 'officer' && m.status === 'approved');
  const isManagement = isLeader || isOfficer || currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
  const isMember = members.some(m => m.user.id == currentUser?.id && m.status === 'approved');
  const hasPending = members.some(m => m.user.id == currentUser?.id && m.status === 'pending');
  const leaderUser = group.leader || members.find(m => m.role === 'leader')?.user;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <div className="bg-stone-800 rounded-2xl shadow-2xl overflow-hidden border border-stone-700">
        {group.image_url && (
          <div className="h-48 sm:h-64 w-full overflow-hidden">
            <img src={`${API_URL}${group.image_url}`} alt={group.name} className="w-full h-full object-cover" />
          </div>
        )}
        
        <div className="p-4 sm:p-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-amber-500 mb-2">{group.name}</h1>
              <span className="text-xs uppercase tracking-widest bg-stone-900 text-amber-500 px-2 py-1 rounded">
                {group.type}
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0 w-full md:w-auto">
              {isManagement && (
                <Link to={`/groups/${id}/manage`} className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 rounded-md bg-stone-700 text-stone-200 hover:bg-stone-600 transition-colors">
                  <Settings size={16} /> Manage Group
                </Link>
              )}
              {isMember ? (
                <button onClick={() => setIsLeaveModalOpen(true)} className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 rounded-md bg-red-900/50 text-red-300 hover:bg-red-900 border border-red-800 transition-colors">
                  <LogOut size={16} /> Leave Group
                </button>
              ) : hasPending ? (
                <span className="flex items-center justify-center w-full sm:w-auto px-4 py-2 rounded-md bg-yellow-900/50 text-yellow-200 border border-yellow-700">Application Pending</span>
              ) : currentUser?.role !== 'user' && (
                <button onClick={handleApply} className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 rounded-md bg-amber-600 text-white hover:bg-amber-700 transition-colors">
                  <UserPlus size={16} /> Apply to Join
                </button>
              )}
            </div>
          </div>

          <p className="text-stone-400 text-base sm:text-lg mb-8">{group.description}</p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-stone-900/50 p-4 sm:p-6 rounded-xl border border-stone-700">
              <h3 className="text-amber-500 font-bold uppercase tracking-widest text-sm mb-4">Leader</h3>
              {leaderUser ? (
                <div className="flex items-center gap-4">
                  <img src={leaderUser.avatar_url ? `${API_URL}${leaderUser.avatar_url}` : `https://ui-avatars.com/api/?name=${leaderUser.username}&background=292524&color=f59e0b`} alt={leaderUser.username} className="w-12 h-12 rounded-full object-cover" />
                  <Link to={`/profile/${leaderUser.username}`} className="text-stone-200 text-lg font-medium hover:text-amber-500 truncate">
                    {leaderUser.display_name || leaderUser.username}
                  </Link>
                </div>
              ) : <p className="text-stone-500 italic">No leader assigned</p>}
            </div>

            <div className="lg:col-span-2 bg-stone-900/50 p-4 sm:p-6 rounded-xl border border-stone-700">
              <h3 className="text-amber-500 font-bold uppercase tracking-widest text-sm mb-4">Officers</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {members.filter(m => m.role === 'officer' && m.status === 'approved').map(m => (
                  <div key={m.user.id} className="flex items-center gap-3 bg-stone-800 p-3 rounded-lg border border-stone-700">
                    <img src={m.user.avatar_url ? `${API_URL}${m.user.avatar_url}` : `https://ui-avatars.com/api/?name=${m.user.username}&background=292524&color=f59e0b`} alt={m.user.username} className="w-8 h-8 rounded-full object-cover" />
                    <Link to={`/profile/${m.user.username}`} className="text-stone-200 hover:text-amber-500 truncate">
                      {m.user.display_name || m.user.username}
                    </Link>
                  </div>
                ))}
                {members.filter(m => m.role === 'officer' && m.status === 'approved').length === 0 && <p className="text-stone-500 italic">No officers appointed</p>}
              </div>
            </div>
          </div>

          <div className="mt-12">
            <h3 className="text-amber-500 font-bold uppercase tracking-widest text-sm mb-6">Members ({members.filter(m => m.status === 'approved').length})</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {members.filter(m => m.status === 'approved').map(m => (
                <div key={m.user.id} className="bg-stone-900/50 p-4 rounded-xl border border-stone-700 text-center group">
                  <img src={m.user.avatar_url ? `${API_URL}${m.user.avatar_url}` : `https://ui-avatars.com/api/?name=${m.user.username}&background=292524&color=f59e0b`} alt={m.user.username} className="w-16 h-16 rounded-full mx-auto mb-3 object-cover" />
                  <Link to={`/profile/${m.user.username}`} className="text-stone-200 font-medium truncate hover:text-amber-500 block text-sm">
                    {m.user.display_name || m.user.username}
                  </Link>
                  <span className="text-xs text-stone-500 uppercase tracking-wider">{m.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal 
        isOpen={isLeaveModalOpen}
        message={isLeader ? 'As the leader, leaving will leave the group leaderless unless you assign a new one first. Are you sure?' : 'Are you sure you want to leave this group?'}
        onConfirm={confirmLeave}
        onCancel={() => setIsLeaveModalOpen(false)}
        confirmText="Confirm Leave"
      />
    </div>
  );
}
