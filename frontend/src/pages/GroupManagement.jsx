import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import ConfirmationModal from '../components/ConfirmationModal';

export default function GroupManagement() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [groupData, setGroupData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { showNotification } = useNotification();
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);

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

  const handleApprove = async (userId) => {
    try {
      await api.patch(`/groups/${id}/members/${userId}/approve`);
      showNotification('Member approved', 'success');
      fetchGroup();
    } catch (err) {
      showNotification('Failed to approve member', 'error');
    }
  };

  const confirmRemove = async () => {
    if (!memberToRemove) return;
    try {
      await api.delete(`/groups/${id}/members/${memberToRemove.user.id}`);
      showNotification('Member removed', 'success');
      fetchGroup();
    } catch (err) {
      showNotification('Failed to remove member', 'error');
    } finally {
      setIsRemoveModalOpen(false);
      setMemberToRemove(null);
    }
  };

  const handleRemove = (member) => {
    setMemberToRemove(member);
    setIsRemoveModalOpen(true);
  };

  const handlePromote = async (userId) => {
    try {
      await api.post(`/groups/${id}/officers/${userId}`);
      showNotification('Member promoted to Officer', 'success');
      fetchGroup();
    } catch (err) {
      showNotification('Failed to promote member', 'error');
    }
  };

  const handleDemote = async (userId) => {
    try {
      await api.delete(`/groups/${id}/officers/${userId}`);
      showNotification('Officer demoted to Member', 'success');
      fetchGroup();
    } catch (err) {
      showNotification('Failed to demote officer', 'error');
    }
  };

  if (loading) return <div className="p-8 text-stone-400">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!groupData) return <div className="p-8 text-stone-400">Group not found</div>;

  const { group, members } = groupData;
  // Use loose equality for ID comparison
  const isLeader = currentUser?.id == group.leader_id;
  const isOfficer = members.some(m => m.user.id == currentUser?.id && m.role === 'officer' && m.status === 'approved');
  
  // Security check: redirect if not leader or officer
  if (!isLeader && !isOfficer && currentUser?.role !== 'admin' && currentUser?.role !== 'super_admin') {
      return <div className="p-8 text-red-500">Access Denied. You must be a leader or officer of this group.</div>;
  }

  const pendingMembers = members.filter(m => m.status === 'pending');
  const activeMembers = members.filter(m => m.status === 'approved');

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-amber-500">Manage Group: {group.name}</h1>
        <Link to={`/groups/${id}`} className="text-stone-400 hover:text-stone-200">
          Back to Group Page
        </Link>
      </div>

      <div className="space-y-12">
        {/* Pending Applications */}
        <section>
          <h2 className="text-2xl font-bold text-stone-200 mb-4 border-b border-stone-700 pb-2">Pending Applications</h2>
          {pendingMembers.length > 0 ? (
            <div className="grid gap-4">
              {pendingMembers.map(m => (
                <div key={m.user.id} className="bg-stone-800 p-4 rounded-lg border border-stone-700 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {m.user.avatar_url ? (
                      <img src={`http://localhost:8000${m.user.avatar_url}`} alt={m.user.username} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 bg-stone-700 rounded-full flex items-center justify-center text-amber-500 font-bold">
                        {m.user.username[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-stone-200 font-bold">{m.user.username}</p>
                      <p className="text-stone-500 text-sm">{m.user.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => handleApprove(m.user.id)} className="bitz-btn-sm bg-green-600 hover:bg-green-700 border-none">Approve</button>
                    <button onClick={() => handleRemove(m)} className="px-3 py-1 rounded bg-red-900/50 text-red-200 hover:bg-red-900 border border-red-800">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-stone-500 italic">No pending applications.</p>
          )}
        </section>

        {/* Active Members Management */}
        <section>
          <h2 className="text-2xl font-bold text-stone-200 mb-4 border-b border-stone-700 pb-2">Member Management</h2>
          <div className="bg-stone-800 rounded-xl overflow-hidden border border-stone-700">
            <table className="w-full text-left">
              <thead className="bg-stone-900 text-stone-400 text-xs uppercase">
                <tr>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-700">
                {activeMembers.map(m => (
                  <tr key={m.user.id} className="hover:bg-stone-700/50">
                    <td className="px-6 py-4 flex items-center gap-3">
                      {m.user.avatar_url ? (
                        <img src={`http://localhost:8000${m.user.avatar_url}`} alt={m.user.username} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 bg-stone-700 rounded-full flex items-center justify-center text-amber-500 font-bold text-xs">
                          {m.user.username[0].toUpperCase()}
                        </div>
                      )}
                      <span className="text-stone-200">{m.user.username}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs uppercase font-bold ${
                        m.role === 'leader' ? 'bg-amber-900 text-amber-200' :
                        m.role === 'officer' ? 'bg-blue-900 text-blue-200' :
                        'bg-stone-700 text-stone-300'
                      }`}>
                        {m.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {m.role !== 'leader' && (
                        <div className="flex gap-3">
                          {isLeader && m.role === 'member' && (
                            <button onClick={() => handlePromote(m.user.id)} className="text-blue-400 hover:underline text-sm">Promote to Officer</button>
                          )}
                          {isLeader && m.role === 'officer' && (
                            <button onClick={() => handleDemote(m.user.id)} className="text-yellow-500 hover:underline text-sm">Demote to Member</button>
                          )}
                          <button onClick={() => handleRemove(m)} className="text-red-500 hover:underline text-sm">Remove</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <ConfirmationModal 
        isOpen={isRemoveModalOpen}
        message={`Are you sure you want to remove ${memberToRemove?.user.username} from the group?`}
        onConfirm={confirmRemove}
        onCancel={() => setIsRemoveModalOpen(false)}
      />
    </div>
  );
}
