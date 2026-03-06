import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const EraHeader = ({ era }) => (
  <div className="w-full mb-8 relative rounded-lg overflow-hidden shadow-lg">
    {era.image_url && (
      <img 
        src={`${API_URL}${era.image_url}`} 
        alt={era.name} 
        className="w-full h-48 object-cover"
      />
    )}
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
      <h2 className="text-3xl font-bold">{era.name}</h2>
      <p className="text-sm opacity-90">
        {new Date(era.start_date).toLocaleDateString()} - {era.end_date ? new Date(era.end_date).toLocaleDateString() : 'Present'}
      </p>
      {era.description && <p className="mt-2 text-gray-200">{era.description}</p>}
    </div>
  </div>
);

const LoreEntryCard = ({ entry, eraColor }) => (
  <div 
    className="bg-white rounded-lg shadow-md p-6 mb-6 border-l-4 transition-all hover:shadow-lg"
    style={{ borderLeftColor: eraColor || '#cbd5e1' }}
  >
    {entry.image_url && (
      <img 
        src={`${API_URL}${entry.image_url}`} 
        alt={entry.title} 
        className="w-full h-64 object-cover rounded-md mb-4"
      />
    )}
    <div className="flex justify-between items-start mb-2">
      <h3 className="text-xl font-bold text-gray-900">{entry.title}</h3>
      <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${entry.entry_type === 'core' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
        {entry.entry_type}
      </span>
    </div>
    <div className="prose max-w-none mb-4" dangerouslySetInnerHTML={{ __html: entry.content }} />
    
    <div className="flex flex-wrap gap-2 mt-4">
      {entry.tags && entry.tags.map((tag, idx) => (
        <span key={idx} className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
          #{tag}
        </span>
      ))}
    </div>
    <div className="mt-4 text-xs text-gray-500">
      Posted on {new Date(entry.created_at).toLocaleDateString()}
    </div>
  </div>
);

export default function Lore() {
  const { user } = useAuth();
  const [eras, setEras] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [sortDesc, setSortDesc] = useState(true);
  const [selectedEraId, setSelectedEraId] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);
  
  const observer = useRef();
  
  const fetchEras = async () => {
    try {
      const res = await fetch(`${API_URL}/lore/eras`);
      if (res.ok) {
        const data = await res.json();
        setEras(data);
      }
    } catch (error) {
      console.error("Failed to fetch eras", error);
    }
  };

  const fetchEntries = async (pageNum, reset = false) => {
    try {
      let url = `${API_URL}/lore/entries?skip=${pageNum * 5}&limit=5&sort_desc=${sortDesc}`;
      if (selectedEraId) url += `&era_id=${selectedEraId}`;
      if (selectedTag) url += `&tag=${selectedTag}`;
      
      const res = await fetch(url);
      if (res.ok) {
        const newEntries = await res.json();
        if (newEntries.length < 5) setHasMore(false);
        
        setEntries(prev => reset ? newEntries : [...prev, ...newEntries]);
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Failed to fetch entries", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEras();
  }, []);

  useEffect(() => {
    setLoading(true);
    setHasMore(true);
    fetchEntries(0, true);
  }, [sortDesc, selectedEraId, selectedTag]);

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchEntries(page + 1);
    }
  };

  const getEraColor = (eraId) => {
    const era = eras.find(e => e.id === eraId);
    return era ? era.color_hex : '#cbd5e1';
  };

  const getEraForEntry = (entry) => eras.find(e => e.id === entry.era_id);

  // Helper to determine if we need to render an Era Header
  const shouldRenderEraHeader = (index) => {
    if (index === 0) return true;
    const currentEntry = entries[index];
    const prevEntry = entries[index - 1];
    return currentEntry.era_id !== prevEntry.era_id;
  };

  const isAdmin = user && (user.role === 'admin' || user.role === 'super_admin');

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Sidebar - Timeline */}
      <div className="w-64 bg-white shadow-md hidden md:block fixed h-full overflow-y-auto p-6 z-10">
        <h2 className="text-xl font-bold mb-6 text-gray-800">Timeline</h2>
        <div className="relative border-l-2 border-gray-200 ml-3 space-y-8">
          {eras.map((era) => (
            <div key={era.id} className="relative pl-6 cursor-pointer group" onClick={() => setSelectedEraId(selectedEraId === era.id ? null : era.id)}>
              <div 
                className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white transition-all ${selectedEraId === era.id ? 'scale-125 ring-2 ring-offset-1' : ''}`}
                style={{ backgroundColor: era.color_hex }}
              />
              <h3 className={`font-semibold text-sm transition-colors ${selectedEraId === era.id ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-700'}`}>
                {era.name}
              </h3>
              <span className="text-xs text-gray-400">
                {new Date(era.start_date).getFullYear()}
              </span>
            </div>
          ))}
        </div>
        
        {isAdmin && (
           <Link to="/admin/lore" className="mt-8 block w-full text-center bg-gray-800 text-white py-2 rounded hover:bg-gray-700 transition">
             Manage Lore
           </Link>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 p-8 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Guild Lore</h1>
          <div className="flex gap-4">
            <button 
              onClick={() => setSortDesc(!sortDesc)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {sortDesc ? 'Newest First' : 'Oldest First'}
            </button>
            {(selectedEraId || selectedTag) && (
              <button 
                onClick={() => { setSelectedEraId(null); setSelectedTag(null); }}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        <div className="space-y-8">
          {entries.map((entry, index) => {
            const era = getEraForEntry(entry);
            const showHeader = era && shouldRenderEraHeader(index);
            
            return (
              <React.Fragment key={entry.id}>
                {showHeader && <EraHeader era={era} />}
                <LoreEntryCard entry={entry} eraColor={era ? era.color_hex : null} />
              </React.Fragment>
            );
          })}
        </div>

        {loading && <div className="text-center py-8">Loading lore...</div>}
        
        {!loading && hasMore && (
          <div className="text-center mt-8">
            <button 
              onClick={loadMore}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition shadow"
            >
              Load More Stories
            </button>
          </div>
        )}
        
        {!loading && entries.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No lore entries found.
          </div>
        )}
      </div>
    </div>
  );
}
