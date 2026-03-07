import React, { useState, useEffect, useRef, useCallback } from 'react';
import EventCard from './EventCard';
import Search from './Search';

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

export default function EventList() {
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const observer = useRef();

  const fetchEvents = useCallback(async (isNewSearch = false) => {
    const currentPage = isNewSearch ? 0 : page;
    if (loading || (!hasMore && !isNewSearch)) return;
    
    setLoading(true);
    try {
      let url = `${API_URL}/events?skip=${currentPage * 9}&limit=9`;
      if (debouncedSearchTerm) {
        url += `&search=${debouncedSearchTerm}`;
      }
      const res = await fetch(url);
      const newEvents = await res.json();
      
      setEvents(prev => isNewSearch ? newEvents : [...prev, ...newEvents]);
      setHasMore(newEvents.length === 9);
      if (!isNewSearch) {
        setPage(prev => prev + 1);
      } else {
        setPage(1);
      }
    } catch (error) {
      console.error("Failed to fetch events", error);
    } finally {
      setLoading(false);
    }
  }, [page, hasMore, loading, debouncedSearchTerm]);

  useEffect(() => {
    setEvents([]);
    setPage(0);
    setHasMore(true);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    fetchEvents(page === 0);
  }, [page, debouncedSearchTerm]);

  const handleRsvpSuccess = (updatedRsvp) => {
    setEvents(prevEvents => 
      prevEvents.map(event => {
        if (event.id === updatedRsvp.event_id) {
          const existingRsvps = event.rsvps || [];
          const newRsvps = [
            ...existingRsvps.filter(r => r.user_id !== updatedRsvp.user_id),
            updatedRsvp
          ];
          return { ...event, rsvps: newRsvps };
        }
        return event;
      })
    );
  };

  const lastEventElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
         setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  return (
    <div>
      <div className="max-w-2xl mx-auto mb-8">
        <h2 className="text-3xl font-bold text-amber-500 mb-4 text-center">All Upcoming Events</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {events.map((event, index) => {
          const isLastElement = events.length === index + 1;
          return (
            <div ref={isLastElement ? lastEventElementRef : null} key={event.id}>
              <EventCard event={event} onRsvpSuccess={handleRsvpSuccess} />
            </div>
          );
        })}
      </div>
      {loading && <p className="text-center text-stone-400 py-8">Loading more events...</p>}
      {!loading && !hasMore && events.length > 0 && <p className="text-center text-stone-500 py-8">You've reached the end.</p>}
      {!loading && events.length === 0 && (
        <div className="text-center py-12 text-stone-500">
          No events found.
        </div>
      )}
    </div>
  );
}
