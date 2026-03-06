import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/admin/pending-users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setPendingUsers(data);
    }
  };

  const activateUser = async (userId) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/admin/users/${userId}/activate`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      fetchPendingUsers(); // Refresh list
    } else {
      alert('Failed to activate user');
    }
  };

  return (
    <div className="p-8 min-h-screen bg-stone-900 text-amber-50">
      <h1 className="text-3xl font-bold mb-6 text-amber-500">Admin Dashboard</h1>
      
      <div className="bitz-card mb-8">
        <h2 className="text-2xl font-bold mb-4 text-amber-400">Pending Applications</h2>
        {pendingUsers.length === 0 ? (
          <p className="text-stone-400">No pending applications.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-amber-700">
                  <th className="p-3">Username</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Discord</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map(u => (
                  <tr key={u.id} className="border-b border-stone-700 hover:bg-stone-800">
                    <td className="p-3">{u.username}</td>
                    <td className="p-3">{u.email}</td>
                    <td className="p-3">{u.discord_username || '-'}</td>
                    <td className="p-3">
                      <button 
                        onClick={() => activateUser(u.id)}
                        className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm"
                      >
                        Approve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bitz-card">
        <h2 className="text-2xl font-bold mb-4 text-amber-400">Content Management</h2>
        <p className="text-stone-400">Manage posts, events, and other content here (Coming Soon).</p>
      </div>
    </div>
  );
}
