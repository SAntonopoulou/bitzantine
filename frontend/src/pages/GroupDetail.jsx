import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiClient, API_URL } from '../apiClient';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import ConfirmationModal from '../components/ConfirmationModal';

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
      const res = await apiClient.get(`/groups/${id}`);
      setGroupData(res.data);
    } catch (err) {
      setError('Failed to load group details');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    try {
      await apiClient.post(`/groups/${id}/apply`);
      showNotification('Application submitted successfully!', 'success');
      fetchGroup();
    } catch (err) {
      showNotification(err.response?.data?.detail || 'Failed to apply', 'error');
    }
  };

  const confirmLeave = async () => {
    try {
      await apiClient.delete(`/groups/${id}/members/${currentUser.id}`);
      showNotification('You have left the group', 'success');
      navigate('/groups'); // Redirect to groups list
    } catch (err) {
      showNotification(err.response?.data?.detail || 'Failed to leave group', 'error');
    } finally {
      setIsLeaveModalOpen(false);
    }
  };

  if (loading) return <div className="p-8 text-stone-400">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!groupData) return <div className="p-8 text-stone-400">Group not found</div>;

  const { group, members } = groupData;
  // Use loose equality for ID comparison to handle string/int mismatch
  const isLeader = currentUser?.id == group.leader_id;
  const isOfficer = members.some(m => m.user.id == currentUser?.id && m.role === 'officer' && m.status === 'approved');
  const isManagement = isLeader || isOfficer || currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
  const isMember = members.some(m => m.user.id == currentUser?.id && m.status === 'approved');
  const hasPending = members.some(m => m.user.id == currentUser?.id && m.status === 'pending');

  // Fallback to find leader in members list if group.leader is missing
  const leaderUser = group.leader || members.find(m => m.role === 'leader')?.user;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="bg-stone-800 rounded-2xl shadow-2xl overflow-hidden border border-stone-700">
        {group.image_url && (
          <div className="h-64 w-full overflow-hidden">
            <img src={`${API_URL}${group.image_url}`} alt={group.name} className="w-full h-full object-cover" />
          </div>
        )}
        
        <div className="p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-4xl font-bold text-amber-500">{group.name}</h1>
                {isManagement && (
                  <Link to={`/groups/${id}/manage`} className="text-stone-500 hover:text-amber-500" title="Manage Group">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  </Link>
                )}
              </div>
              <p className="text-stone-400 text-lg">{group.description}</p>
            </div>
            
            {!isMember && !hasPending && currentUser?.role !== 'user' && (
              <button onClick={handleApply} className="bitz-btn">Apply to Join</button>
            )}
            {hasPending && (
              <span className="bg-yellow-900/50 text-yellow-200 px-4 py-2 rounded-lg border border-yellow-700">Application Pending</span>
            )}
            {isMember && (
              <button onClick={() => setIsLeaveModalOpen(true)} className="text-red-500 hover:underline font-medium">Leave Group</button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Leader Section */}
            <div className="bg-stone-900/50 p-6 rounded-xl border border-stone-700">
              <h3 className="text-amber-500 font-bold uppercase tracking-widest text-sm mb-4">Leader</h3>
              {leaderUser ? (
                <div className="flex items-center gap-4">
                  {leaderUser.profile?.avatar_url ? (
                    <img src={`${API_URL}${leaderUser.profile.avatar_url}`} alt={leaderUser.username} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 bg-stone-700 rounded-full flex items-center justify-center text-amber-500 font-bold">
                      {leaderUser.username[0].toUpperCase()}
                    </div>
                  )}
                  <Link to={`/profile/${leaderUser.username}`} className="text-stone-200 text-lg font-medium hover:text-amber-500">
                    {leaderUser.username}
                  </Link>
                </div>
              ) : (
                <p className="text-stone-500 italic">No leader assigned</p>
              )}
            </div>

            {/* Officers Section */}
            <div className="lg:col-span-2 bg-stone-900/50 p-6 rounded-xl border border-stone-700">
              <h3 className="text-amber-500 font-bold uppercase tracking-widest text-sm mb-4">Officers</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {members.filter(m => m.role === 'officer' && m.status === 'approved').map(m => (
                  <div key={m.user.id} className="flex items-center justify-between bg-stone-800 p-3 rounded-lg border border-stone-700">
                    <div className="flex items-center gap-3">
                      {m.user.profile?.avatar_url ? (
                        <img src={`${API_URL}${m.user.profile.avatar_url}`} alt={m.user.username} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 bg-stone-700 rounded-full flex items-center justify-center text-amber-500 font-bold text-xs">
                          {m.user.username[0].toUpperCase()}
                        </div>
                      )}
                      <Link to={`/profile/${m.user.username}`} className="text-stone-200 hover:text-amber-500">
                        {m.user.username}
                      </Link>
                    </div>
                  </div>
                ))}
                {members.filter(m => m.role === 'officer' && m.status === 'approved').length === 0 && (
                  <p className="text-stone-500 italic">No officers appointed</p>
                )}
              </div>
            </div>
          </div>

          {/* Members Section */}
          <div className="mt-12">
            <h3 className="text-amber-500 font-bold uppercase tracking-widest text-sm mb-6">Members</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {members.filter(m => m.status === 'approved').map(m => (
                <div key={m.user.id} className="bg-stone-900/50 p-4 rounded-xl border border-stone-700 text-center group relative">
                  {m.user.profile?.avatar_url ? (
                    <img src={`${API_URL}${m.user.profile.avatar_url}`} alt={m.user.username} className="w-16 h-16 rounded-full mx-auto mb-3 object-cover" />
                  ) : (
                    <div className="w-16 h-16 bg-stone-700 rounded-full mx-auto mb-3 flex items-center justify-center text-amber-500 font-bold text-xl">
                      {m.user.username[0].toUpperCase()}
                    </div>
                  )}
                  <Link to={`/profile/${m.user.username}`} className="text-stone-200 font-medium truncate hover:text-amber-500 block">
                    {m.user.username}
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
        message={isLeader 
          ? 'As the leader, leaving will leave the group leaderless unless you assign a new one first. Are you sure?' 
          : 'Are you sure you want to leave this group?'}
        onConfirm={confirmLeave}
        onCancel={() => setIsLeaveModalOpen(false)}
        confirmText="Confirm Leave"
      />
    </div>
  );
}
