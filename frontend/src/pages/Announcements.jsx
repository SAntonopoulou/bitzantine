import React, { useState, useEffect, useRef, useCallback } from 'react';
import Masonry from 'react-masonry-css';
import AnnouncementCard from '../components/AnnouncementCard';
import Search from '../components/Search';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const observer = useRef();

  // Reset announcements and page when search term changes
  useEffect(() => {
    setAnnouncements([]);
    setPage(0);
    setHasMore(true);
  }, [debouncedSearchTerm]);

  // Fetch announcements when page or search term changes
  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true);
      try {
        let url = `${API_URL}/announcements?skip=${page * 6}&limit=6`;
        if (debouncedSearchTerm) {
          url += `&search=${debouncedSearchTerm}`;
        }
        const res = await fetch(url);
        const newAnnouncements = await res.json();
        
        setAnnouncements(prev => {
          const existingIds = new Set(prev.map(a => a.id));
          const filteredNew = newAnnouncements.filter(a => !existingIds.has(a.id));
          return page === 0 ? newAnnouncements : [...prev, ...filteredNew];
        });

        setHasMore(newAnnouncements.length === 6);
      } catch (error) {
        console.error("Failed to fetch announcements", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, [page, debouncedSearchTerm]);

  const lastAnnouncementElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  const breakpointColumnsObj = {
    default: 3,
    1100: 2,
    700: 1
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-4xl font-bold text-amber-500 mb-8 text-center">Announcements</h1>
      <div className="max-w-2xl mx-auto">
        <Search onSearchChange={setSearchTerm} />
      </div>
      
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="my-masonry-grid"
        columnClassName="my-masonry-grid_column"
      >
        {announcements.map((announcement, index) => {
          if (announcements.length === index + 1) {
            return <div ref={lastAnnouncementElementRef} key={announcement.id}><AnnouncementCard announcement={announcement} /></div>;
          } else {
            return <AnnouncementCard key={announcement.id} announcement={announcement} />;
          }
        })}
      </Masonry>
      
      {loading && <p className="text-center text-stone-400 py-8">Loading...</p>}
      {!loading && !hasMore && announcements.length > 0 && <p className="text-center text-stone-500 py-8">You've reached the end.</p>}
      {!loading && announcements.length === 0 && (
        <div className="text-center py-12 text-stone-500">
          No announcements found.
        </div>
      )}
    </div>
  );
}
