import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

const GroupNode = ({ group }) => (
  <div className="ml-8 border-l-2 border-stone-700 pl-6 mb-6">
    <div className="bg-stone-800 p-6 rounded-xl shadow-lg border border-stone-700 hover:border-amber-500 transition-colors">
      <div className="flex items-center gap-4 mb-4">
        {group.image_url && (
          <img src={`http://localhost:8000${group.image_url}`} alt={group.name} className="w-16 h-16 rounded-lg object-cover" />
        )}
        <div>
          <h3 className="text-xl font-bold text-amber-500">
            <Link to={`/groups/${group.id}`} className="hover:underline">{group.name}</Link>
          </h3>
          <p className="text-stone-400 text-sm">{group.description}</p>
          {group.type && (
            <span className="text-xs uppercase tracking-widest bg-stone-900 text-amber-500 px-2 py-1 rounded mt-2 inline-block">
              {group.type}
            </span>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-stone-900/50 p-3 rounded-lg">
          <span className="text-xs uppercase tracking-wider text-stone-500 font-bold block mb-1">Leader</span>
          {group.leader ? (
            <div className="flex items-center gap-2">
              {group.leader.avatar_url ? (
                <img src={`http://localhost:8000${group.leader.avatar_url}`} alt={group.leader.username} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 bg-stone-700 rounded-full flex items-center justify-center text-amber-500 font-bold text-xs">
                  {group.leader.username[0].toUpperCase()}
                </div>
              )}
              <Link to={`/profile/${group.leader.username}`} className="text-stone-200 font-medium hover:text-amber-500">
                {group.leader.username}
              </Link>
            </div>
          ) : (
            <span className="text-stone-600 italic">No Leader Assigned</span>
          )}
        </div>
        
        <div className="bg-stone-900/50 p-3 rounded-lg">
          <span className="text-xs uppercase tracking-wider text-stone-500 font-bold block mb-1">Officers</span>
          <div className="flex flex-wrap gap-2">
            {group.officers && group.officers.length > 0 ? (
              group.officers.map(officer => (
                <div key={officer.id} className="flex items-center gap-2 bg-stone-700 px-2 py-1 rounded hover:bg-stone-600 transition-colors">
                  {officer.avatar_url ? (
                    <img src={`http://localhost:8000${officer.avatar_url}`} alt={officer.username} className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <div className="w-5 h-5 bg-stone-600 rounded-full flex items-center justify-center text-amber-500 font-bold text-[10px]">
                      {officer.username[0].toUpperCase()}
                    </div>
                  )}
                  <Link 
                    to={`/profile/${officer.username}`}
                    className="text-stone-300 text-sm hover:text-amber-500"
                  >
                    {officer.username}
                  </Link>
                </div>
              ))
            ) : (
              <span className="text-stone-600 italic text-sm">None</span>
            )}
          </div>
        </div>
      </div>
    </div>
    
    {group.children && group.children.length > 0 && (
      <div className="mt-6 ml-4">
        {group.children.map(child => (
          <GroupNode key={child.id} group={child} />
        ))}
      </div>
    )}
  </div>
);

export default function Government() {
  const [hierarchy, setHierarchy] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHierarchy = async () => {
      try {
        const res = await api.get('/groups/hierarchy');
        setHierarchy(res.data);
      } catch (err) {
        console.error("Failed to fetch hierarchy:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHierarchy();
  }, []);

  if (loading) return <div className="p-8 text-stone-400">Loading hierarchy...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold text-amber-500 mb-12">Government Structure</h1>
      
      {hierarchy.length > 0 ? (
        <div className="space-y-12">
          {hierarchy.map(rootGroup => (
            <div key={rootGroup.id}>
              <GroupNode group={rootGroup} />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-stone-800 p-12 rounded-2xl text-center border border-stone-700">
          <p className="text-stone-400 text-lg">No government structure has been defined yet.</p>
        </div>
      )}
    </div>
  );
}
