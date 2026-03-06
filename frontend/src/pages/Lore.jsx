import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Utility to strip HTML tags
const stripHtml = (html) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
};

const EraHeader = ({ era }) => (
  <div className="w-full mb-8 relative rounded-lg overflow-hidden shadow-lg" id={`era-header-${era.id}`}>
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
      {era.description && <p className="mt-2 text-gray-200">{stripHtml(era.description)}</p>}
    </div>
  </div>
);

const LoreEntryCard = ({ entry, eraColor }) => {
  const excerpt = useMemo(() => {
    const cleanText = stripHtml(entry.content);
    return cleanText.length > 100 ? cleanText.substring(0, 100) + '...' : cleanText;
  }, [entry.content]);

  return (
    <div 
      id={`entry-card-${entry.id}`}
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
        <Link to={`/lore/${entry.id}`} className="text-xl font-bold text-gray-900 hover:text-blue-700 transition-colors">
          {entry.title}
        </Link>
        <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${entry.entry_type === 'core' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
          {entry.entry_type}
        </span>
      </div>
      <div className="prose max-w-none mb-4 text-gray-600">
        {excerpt}
        <Link to={`/lore/${entry.id}`} className="text-blue-600 hover:underline ml-2">Read More</Link>
      </div>
      
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
};

const TimelineEra = ({ era, entries, activeEntryId, onEraClick, onEntryClick, isSelected }) => (
  <div className="relative pl-6 group">
    <div 
      className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white transition-all cursor-pointer ${isSelected ? 'scale-125 ring-2 ring-offset-1' : ''}`}
      style={{ backgroundColor: era.color_hex }}
      onClick={() => onEraClick(era.id)}
    />
    <h3 
      className={`font-semibold text-sm transition-colors cursor-pointer ${isSelected ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-700'}`}
      onClick={() => onEraClick(era.id)}
    >
      {era.name}
    </h3>
    <span className="text-xs text-gray-400">
      {new Date(era.start_date).getFullYear()}
    </span>
    <div className="mt-2 pl-1 space-y-2">
      {entries.map(entry => (
        <div 
          key={entry.id} 
          className="relative flex items-center cursor-pointer"
          onClick={() => onEntryClick(entry.id)}
        >
          <div className={`w-2 h-2 rounded-full transition-all ${activeEntryId === entry.id ? 'bg-blue-500 scale-125' : 'bg-gray-300 group-hover:bg-gray-400'}`} />
          <span className={`ml-2 text-xs transition-colors ${activeEntryId === entry.id ? 'text-blue-600 font-semibold' : 'text-gray-400 group-hover:text-gray-600'}`}>
            {entry.title}
          </span>
        </div>
      ))}
    </div>
  </div>
);

export default function Lore() {
  const { user } = useAuth();
  const [eras, setEras] = useState([]);
  const [entries, setEntries] = useState([]);
  const [eraEntries, setEraEntries] = useState({}); // Store entries per era for the timeline
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [sortDesc, setSortDesc] = useState(true);
  const [selectedEraId, setSelectedEraId] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);
  const [activeEntryId, setActiveEntryId] = useState(null);
  
  const observer = useRef();
  const entryRefs = useRef({});

  const fetchEras = async () => {
    try {
      const res = await fetch(`${API_URL}/lore/eras`);
      if (res.ok) {
        const data = await res.json();
        setEras(data);
        // Fetch entries for each era for the timeline dots
        data.forEach(era => fetchEntriesForEra(era.id));
      }
    } catch (error) {
      console.error("Failed to fetch eras", error);
    }
  };

  const fetchEntriesForEra = async (eraId) => {
    try {
      const res = await fetch(`${API_URL}/lore/entries?era_id=${eraId}&limit=100`); // Fetch all for dots
      if (res.ok) {
        const data = await res.json();
        setEraEntries(prev => ({ ...prev, [eraId]: data }));
      }
    } catch (error) {
      console.error(`Failed to fetch entries for era ${eraId}`, error);
    }
  };

  const fetchEntries = async (pageNum, reset = false) => {
    setLoading(true);
    try {
      let url = `${API_URL}/lore/entries?skip=${pageNum * 5}&limit=5&sort_desc=${sortDesc}`;
      if (selectedEraId) url += `&era_id=${selectedEraId}`;
      if (selectedTag) url += `&tag=${selectedTag}`;
      
      const res = await fetch(url);
      if (res.ok) {
        const newEntries = await res.json();
        setHasMore(newEntries.length === 5);
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
    fetchEntries(0, true);
  }, [sortDesc, selectedEraId, selectedTag]);

  // Intersection Observer for tracking active entry
  useEffect(() => {
    const callback = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const entryId = parseInt(entry.target.id.split('-')[2]);
          setActiveEntryId(entryId);
        }
      });
    };
    observer.current = new IntersectionObserver(callback, { rootMargin: '-50% 0px -50% 0px', threshold: 0 });

    Object.values(entryRefs.current).forEach(ref => {
      if (ref) observer.current.observe(ref);
    });

    return () => observer.current.disconnect();
  }, [entries]);

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchEntries(page + 1);
    }
  };

  const handleEntryDotClick = (entryId) => {
    const element = document.getElementById(`entry-card-${entryId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const sortedEras = useMemo(() => {
    const erasCopy = [...eras];
    return sortDesc ? erasCopy.reverse() : erasCopy;
  }, [eras, sortDesc]);

  const getEraForEntry = (entry) => eras.find(e => e.id === entry.era_id);

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
          {sortedEras.map((era) => (
            <TimelineEra
              key={era.id}
              era={era}
              entries={eraEntries[era.id] || []}
              activeEntryId={activeEntryId}
              isSelected={selectedEraId === era.id}
              onEraClick={() => setSelectedEraId(selectedEraId === era.id ? null : era.id)}
              onEntryClick={handleEntryDotClick}
            />
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
                <div ref={el => entryRefs.current[entry.id] = el}>
                  <LoreEntryCard entry={entry} eraColor={era ? era.color_hex : null} />
                </div>
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
