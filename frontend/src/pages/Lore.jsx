import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Search from '../components/Search';
import Timeline from '../components/Timeline';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Custom hook for debouncing
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

// Utility to strip HTML tags
const stripHtml = (html) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
};

const EraHeader = ({ era }) => {
  const navigate = useNavigate();
  return (
    <div 
      className="w-full mb-8 relative rounded-lg overflow-hidden shadow-lg cursor-pointer group" 
      id={`era-header-${era.id}`}
      onClick={() => navigate(`/lore/eras/${era.id}`)}
    >
      {era.image_url && (
        <img 
          src={`${API_URL}${era.image_url}`} 
          alt={era.name} 
          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
        />
      )}
      <div className="absolute inset-0 bg-black/60"></div>
      <div className="relative z-10 flex items-end h-full p-6">
        <div>
          <h2 className="text-3xl font-bold text-amber-500">{era.name}</h2>
          <p className="text-sm text-stone-300">
            {new Date(era.start_date).toLocaleDateString()} - {era.end_date ? new Date(era.end_date).toLocaleDateString() : 'Present'}
          </p>
          <div className="mt-2 text-stone-300">
            {stripHtml(era.description)}
            <span className="ml-2 text-amber-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
              View Archive &rarr;
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const LoreEntryCard = React.forwardRef(({ entry, eraColor }, ref) => {
  const excerpt = React.useMemo(() => {
    const cleanText = stripHtml(entry.content);
    return cleanText.length > 100 ? cleanText.substring(0, 100) + '...' : cleanText;
  }, [entry.content]);

  return (
    <div 
      id={`entry-card-${entry.id}`}
      ref={ref}
      className="bg-stone-800 rounded-lg shadow-md p-6 mb-6 border-l-4 transition-all hover:shadow-lg hover:border-amber-500"
      style={{ borderLeftColor: eraColor || '#44403c' }}
    >
      {entry.image_url && (
        <img 
          src={`${API_URL}${entry.image_url}`} 
          alt={entry.title} 
          className="w-full h-64 object-cover rounded-md mb-4"
        />
      )}
      <div className="flex justify-between items-start mb-2">
        <Link to={`/lore/${entry.id}`} className="text-xl font-bold text-amber-500 hover:text-amber-400 transition-colors">
          {entry.title}
        </Link>
        <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${entry.entry_type === 'core' ? 'bg-sky-900 text-sky-300' : 'bg-purple-900 text-purple-300'}`}>
          {entry.entry_type}
        </span>
      </div>
      <div className="prose max-w-none mb-4 text-stone-400">
        {excerpt}
        <Link to={`/lore/${entry.id}`} className="text-amber-600 hover:underline ml-2">Read More</Link>
      </div>
      
      <div className="flex flex-wrap gap-2 mt-4">
        {entry.tags && entry.tags.map((tag, idx) => (
          <span key={idx} className="bg-stone-700 text-stone-300 px-2 py-1 rounded-full text-xs">
            #{tag}
          </span>
        ))}
      </div>
      <div className="mt-4 text-xs text-stone-500">
        Posted on {new Date(entry.created_at).toLocaleDateString()}
      </div>
    </div>
  );
});

export default function Lore() {
  const [eras, setEras] = useState([]);
  const [entries, setEntries] = useState([]);
  const [allEraEntries, setAllEraEntries] = useState({}); // Unfiltered entries for timeline
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [sortDesc, setSortDesc] = useState(true);
  const [activeEntryId, setActiveEntryId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [coreOnly, setCoreOnly] = useState(false);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  const infiniteScrollObserver = useRef();
  const scrollTrackingObserver = useRef();
  const entryRefs = useRef(new Map());

  const lastEntryElementRef = useCallback(node => {
    if (loading) return;
    if (infiniteScrollObserver.current) infiniteScrollObserver.current.disconnect();
    infiniteScrollObserver.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) infiniteScrollObserver.current.observe(node);
  }, [loading, hasMore]);

  const fetchErasAndDots = async () => {
    try {
      const erasRes = await fetch(`${API_URL}/lore/eras`);
      const erasData = await erasRes.json();
      setEras(erasData);

      const allEntriesRes = await fetch(`${API_URL}/lore/entries?limit=999`);
      const allEntriesData = await allEntriesRes.json();
      const groupedByEra = allEntriesData.reduce((acc, item) => {
        const eraId = item.era_id || 'core-standalone'; // Group standalone core entries
        if (!acc[eraId]) acc[eraId] = [];
        acc[eraId].push(item);
        return acc;
      }, {});
      setAllEraEntries(groupedByEra);
    } catch (error) {
      console.error("Failed to fetch initial data", error);
    }
  };
  
  useEffect(() => {
    fetchErasAndDots();
  }, []);

  // Effect for resetting list on new search/sort/filter
  useEffect(() => {
    setEntries([]);
    setPage(0);
    setHasMore(true);
  }, [sortDesc, debouncedSearchTerm, coreOnly]);

  // Effect for fetching data
  useEffect(() => {
    const fetchEntries = async () => {
      setLoading(true);
      let url = `${API_URL}/lore/entries?skip=${page * 10}&limit=10&sort_desc=${sortDesc}`;
      if (debouncedSearchTerm) url += `&search=${debouncedSearchTerm}`;
      if (coreOnly) url += `&entry_type=core`;
      
      try {
        const res = await fetch(url);
        const newEntries = await res.json();
        setEntries(prev => page === 0 ? newEntries : [...prev, ...newEntries]);
        setHasMore(newEntries.length === 10);
      } catch (error) {
        console.error("Failed to fetch entries", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, [page, sortDesc, debouncedSearchTerm, coreOnly]);

  // Filter timeline entries based on the coreOnly flag
  const timelineEntries = useMemo(() => {
    if (!coreOnly) {
      return allEraEntries;
    }
    const filtered = {};
    for (const eraId in allEraEntries) {
      const eraEntries = allEraEntries[eraId].filter(entry => entry.entry_type === 'core');
      if (eraEntries.length > 0) {
        filtered[eraId] = eraEntries;
      }
    }
    return filtered;
  }, [coreOnly, allEraEntries]);

  // Setup scroll tracking observer
  useEffect(() => {
    const handleIntersect = (observedEntries) => {
      const intersecting = observedEntries.find(e => e.isIntersecting);
      if (intersecting) {
        const entryId = parseInt(intersecting.target.id.split('-')[2]);
        setActiveEntryId(entryId);
      }
    };

    scrollTrackingObserver.current = new IntersectionObserver(handleIntersect, {
      rootMargin: "-50% 0px -50% 0px",
      threshold: 0
    });

    return () => scrollTrackingObserver.current?.disconnect();
  }, []);

  // Connect observer to refs
  useEffect(() => {
    const observer = scrollTrackingObserver.current;
    if (!observer) return;

    entryRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      entryRefs.current.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, [entries]);

  const handleEraClick = (eraId) => {
    const element = document.getElementById(`era-header-${eraId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleEntryDotClick = (entryId) => {
    const element = document.getElementById(`entry-card-${entryId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const getEraForEntry = (entry) => eras.find(e => e.id === entry.era_id);

  const shouldRenderEraHeader = (index) => {
    if (index === 0) return true;
    const currentEntry = entries[index];
    const prevEntry = entries[index - 1];
    return currentEntry.era_id !== prevEntry.era_id;
  };

  return (
    <div className="flex justify-center">
      <div className="flex w-full max-w-7xl">
        <Timeline 
          eras={eras}
          eraEntries={timelineEntries}
          activeEntryId={activeEntryId}
          selectedEraId={null}
          onEraClick={handleEraClick}
          onEntryClick={handleEntryDotClick}
          sortDesc={sortDesc}
          isMainLorePage={true}
        />

        <div className="flex-1 md:ml-64 p-8">
          <Search onSearchChange={setSearchTerm} />
          
          <div className="flex justify-end items-center mb-8 gap-4">
            <button 
              onClick={() => setCoreOnly(!coreOnly)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${coreOnly ? 'bg-amber-600 text-white' : 'bg-stone-800 border border-stone-600 text-stone-300 hover:bg-stone-700'}`}
            >
              Core Lore Only
            </button>
            <button 
              onClick={() => setSortDesc(!sortDesc)}
              className="px-4 py-2 bg-stone-800 border border-stone-600 rounded-md text-sm font-medium text-stone-300 hover:bg-stone-700"
            >
              {sortDesc ? 'Newest First' : 'Oldest First'}
            </button>
          </div>

          {entries.map((entry, index) => {
            const era = getEraForEntry(entry);
            const showHeader = era && shouldRenderEraHeader(index);
            const isLastElement = index === entries.length - 1;
            
            return (
              <div key={entry.id} ref={isLastElement ? lastEntryElementRef : null}>
                {showHeader && <EraHeader era={era} />}
                <LoreEntryCard 
                  ref={node => {
                    if (node) {
                      entryRefs.current.set(entry.id, node);
                    } else {
                      entryRefs.current.delete(entry.id);
                    }
                  }}
                  entry={entry} 
                  eraColor={era ? era.color_hex : null} 
                />
              </div>
            );
          })}
          
          {loading && <div className="text-center py-8 text-stone-400">Loading more...</div>}
          
          {!loading && entries.length === 0 && (
            <div className="text-center py-12 text-stone-500">
              No lore entries found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
