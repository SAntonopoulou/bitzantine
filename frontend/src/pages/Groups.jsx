import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user: currentUser } = useAuth();
  const { showNotification } = useNotification();

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await api.get('/groups');
        setGroups(res.data);
      } catch (err) {
        console.error("Failed to fetch groups:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  const handleApply = async (groupId) => {
    try {
      await api.post(`/groups/${groupId}/apply`);
      showNotification('Application submitted successfully!', 'success');
    } catch (err) {
      showNotification(err.response?.data?.detail || 'Failed to apply', 'error');
    }
  };

  const isMember = (groupId) => {
    // This check might need adjustment depending on how user groups are structured in the auth context
    return currentUser?.groups?.some(g => g.id === groupId);
  };

  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-4 sm:p-8 text-stone-400 text-center">Loading groups...</div>;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-amber-500 text-center md:text-left">Guild Groups</h1>
        <div className="w-full md:w-1/3">
          <input
            type="text"
            placeholder="Search groups..."
            className="w-full bg-stone-800 border border-stone-700 rounded-lg px-4 py-2 text-stone-200 focus:outline-none focus:border-amber-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {filteredGroups.map(group => (
          <div key={group.id} className="bg-stone-800 rounded-xl shadow-lg overflow-hidden border border-stone-700 hover:border-amber-500 transition-all duration-300 flex flex-col">
            {group.image_url ? (
              <div className="h-40 sm:h-48 w-full overflow-hidden">
                <img src={`http://localhost:8000${group.image_url}`} alt={group.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="h-40 sm:h-48 w-full bg-stone-700 flex items-center justify-center">
                <span className="text-stone-500 text-3xl sm:text-4xl font-bold">{group.name[0]}</span>
              </div>
            )}
            
            <div className="p-4 sm:p-6 flex flex-col flex-grow">
              <div className="flex justify-between items-start mb-3 sm:mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-stone-200">{group.name}</h2>
                <span className="text-xs uppercase tracking-widest bg-stone-900 text-amber-500 px-2 py-1 rounded flex-shrink-0 ml-2">
                  {group.type}
                </span>
              </div>
              
              <p className="text-stone-400 mb-6 line-clamp-3 flex-grow text-sm sm:text-base">{group.description}</p>

              {group.leader && (
                <div className="flex items-center gap-3 mb-4 p-2 bg-stone-900/50 rounded-lg">
                  {group.leader.avatar_url ? (
                    <img src={`http://localhost:8000${group.leader.avatar_url}`} alt={group.leader.username} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 bg-stone-700 rounded-full flex items-center justify-center text-amber-500 font-bold text-xs flex-shrink-0">
                      {group.leader.username[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <span className="text-xs text-stone-500 uppercase tracking-wider">Leader</span>
                    <Link to={`/profile/${group.leader.username}`} className="text-sm text-stone-300 hover:text-amber-500 block truncate">
                      {group.leader.username}
                    </Link>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-stone-700">
                <Link 
                  to={`/groups/${group.id}`}
                  className="text-amber-500 hover:text-amber-400 font-medium hover:underline text-sm"
                >
                  View Details
                </Link>
                
                {currentUser && currentUser.role !== 'user' && !isMember(group.id) && (
                  <button 
                    onClick={() => handleApply(group.id)}
                    className="px-3 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 text-sm"
                  >
                    Apply
                  </button>
                )}
                {isMember(group.id) && (
                  <span className="text-stone-500 text-sm italic">Member</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredGroups.length === 0 && (
        <div className="text-center py-12 bg-stone-800 rounded-xl border border-stone-700">
          <p className="text-stone-400 text-lg">No groups found matching your search.</p>
        </div>
      )}
    </div>
  );
}
