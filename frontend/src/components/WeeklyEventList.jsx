import React, { useState, useEffect, useCallback } from 'react';
import EventCard from './EventCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function WeeklyEventList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [weekRange, setWeekRange] = useState('');

  const fetchWeeklyEvents = useCallback(() => {
    setLoading(true);
    const today = new Date();
    today.setDate(today.getDate() + weekOffset * 7);

    const dayOfWeek = today.getDay();
    const firstDay = new Date(today.setDate(today.getDate() - dayOfWeek));
    const lastDay = new Date(new Date(firstDay).setDate(firstDay.getDate() + 6));

    const start = firstDay.toISOString().split('T')[0];
    const end = lastDay.toISOString().split('T')[0];
    
    setWeekRange(`${firstDay.toLocaleDateString()} - ${lastDay.toLocaleDateString()}`);

    fetch(`${API_URL}/events?start=${start}&end=${end}&limit=100`)
      .then(res => res.json())
      .then(data => {
        setEvents(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch weekly events", err);
        setLoading(false);
      });
  }, [weekOffset]);

  useEffect(() => {
    fetchWeeklyEvents();
  }, [fetchWeeklyEvents]);

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

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => setWeekOffset(weekOffset - 1)} className="bitz-btn">
          &larr; Previous Week
        </button>
        <h2 className="text-3xl font-bold text-amber-500 text-center">Events This Week</h2>
        <button onClick={() => setWeekOffset(weekOffset + 1)} className="bitz-btn">
          Next Week &rarr;
        </button>
      </div>
      <p className="text-center text-stone-400 mb-8">{weekRange}</p>
      
      {loading ? (
        <p className="text-center text-stone-400 py-8">Loading...</p>
      ) : events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map(event => (
            <EventCard key={event.id} event={event} onRsvpSuccess={handleRsvpSuccess} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-stone-500">
          No events scheduled for this week.
        </div>
      )}
    </div>
  );
}
