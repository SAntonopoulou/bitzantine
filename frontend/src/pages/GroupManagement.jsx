import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import ConfirmationModal from '../components/ConfirmationModal';
import { ArrowUp, ArrowDown, Trash2, Check, X as XIcon } from 'lucide-react';

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

  if (loading) return <div className="p-4 sm:p-8 text-stone-400 text-center">Loading...</div>;
  if (error) return <div className="p-4 sm:p-8 text-red-500 text-center">{error}</div>;
  if (!groupData) return <div className="p-4 sm:p-8 text-stone-400 text-center">Group not found</div>;

  const { group, members } = groupData;
  const isLeader = currentUser?.id == group.leader_id;
  const isOfficer = members.some(m => m.user.id == currentUser?.id && m.role === 'officer' && m.status === 'approved');
  
  if (!isLeader && !isOfficer && currentUser?.role !== 'admin' && currentUser?.role !== 'super_admin') {
      return <div className="p-4 sm:p-8 text-red-500 text-center">Access Denied. You must be a leader or officer of this group.</div>;
  }

  const pendingMembers = members.filter(m => m.status === 'pending');
  const activeMembers = members.filter(m => m.status === 'approved');

  const MemberCard = ({ member, isPending = false }) => (
    <div className="bg-stone-800 p-4 rounded-lg border border-stone-700 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={member.user.avatar_url ? `http://localhost:8000${member.user.avatar_url}` : `https://ui-avatars.com/api/?name=${member.user.username}&background=292524&color=f59e0b`} alt={member.user.username} className="w-10 h-10 rounded-full object-cover" />
          <div>
            <p className="text-stone-200 font-bold">{member.user.username}</p>
            <p className="text-stone-500 text-sm">{member.user.email}</p>
          </div>
        </div>
        {!isPending && (
          <span className={`px-2 py-1 rounded text-xs uppercase font-bold ${
            member.role === 'leader' ? 'bg-amber-900 text-amber-200' :
            member.role === 'officer' ? 'bg-blue-900 text-blue-200' :
            'bg-stone-700 text-stone-300'
          }`}>
            {member.role}
          </span>
        )}
      </div>
      <div className="flex gap-3 justify-end border-t border-stone-700 pt-3">
        {isPending ? (
          <>
            <button onClick={() => handleApprove(member.user.id)} className="flex items-center gap-2 text-sm px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-white"><Check size={16} />Approve</button>
            <button onClick={() => handleRemove(member)} className="flex items-center gap-2 text-sm px-3 py-1 rounded bg-red-900/50 text-red-200 hover:bg-red-900"><XIcon size={16} />Reject</button>
          </>
        ) : (
          <>
            {member.role !== 'leader' && (
              <>
                {isLeader && member.role === 'member' && <button onClick={() => handlePromote(member.user.id)} className="flex items-center gap-2 text-sm text-blue-400 hover:underline"><ArrowUp size={16} />Promote</button>}
                {isLeader && member.role === 'officer' && <button onClick={() => handleDemote(member.user.id)} className="flex items-center gap-2 text-sm text-yellow-500 hover:underline"><ArrowDown size={16} />Demote</button>}
                <button onClick={() => handleRemove(member)} className="flex items-center gap-2 text-sm text-red-500 hover:underline"><Trash2 size={16} />Remove</button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div className="flex-grow">
          <h1 className="text-2xl sm:text-4xl font-bold text-amber-500">Manage Group: {group.name}</h1>
        </div>
        <Link to={`/groups/${id}`} className="text-stone-400 hover:text-stone-200 text-sm sm:text-base flex-shrink-0">
          &larr; Back to Group Page
        </Link>
      </div>

      <div className="space-y-12">
        {/* Pending Applications */}
        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-200 mb-4 border-b border-stone-700 pb-2">Pending Applications</h2>
          {pendingMembers.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {pendingMembers.map(m => <MemberCard key={m.user.id} member={m} isPending={true} />)}
            </div>
          ) : (
            <p className="text-stone-500 italic">No pending applications.</p>
          )}
        </section>

        {/* Active Members Management */}
        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-200 mb-4 border-b border-stone-700 pb-2">Member Management</h2>
          <div className="space-y-4 md:hidden">
            {activeMembers.map(m => <MemberCard key={m.user.id} member={m} />)}
          </div>
          <div className="hidden md:block bg-stone-800 rounded-xl overflow-hidden border border-stone-700">
            <table className="w-full text-left">
              <thead className="bg-stone-900 text-stone-400 text-xs uppercase">
                <tr>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-700">
                {activeMembers.map(m => (
                  <tr key={m.user.id} className="hover:bg-stone-700/50">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <img src={m.user.avatar_url ? `http://localhost:8000${m.user.avatar_url}` : `https://ui-avatars.com/api/?name=${m.user.username}&background=292524&color=f59e0b`} alt={m.user.username} className="w-8 h-8 rounded-full object-cover" />
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
                    <td className="px-6 py-4 text-right">
                      {m.role !== 'leader' && (
                        <div className="flex gap-4 justify-end">
                          {isLeader && m.role === 'member' && <button onClick={() => handlePromote(m.user.id)} className="text-blue-400 hover:underline text-sm">Promote</button>}
                          {isLeader && m.role === 'officer' && <button onClick={() => handleDemote(m.user.id)} className="text-yellow-500 hover:underline text-sm">Demote</button>}
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
