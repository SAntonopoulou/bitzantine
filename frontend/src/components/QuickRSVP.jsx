import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import Notification from './Notification';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function QuickRSVP({ event, onRsvpSuccess }) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });

  const handleRsvp = async (status) => {
    if (!user) {
      setNotification({ message: 'Please log in to RSVP.', type: 'error' });
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/events/${event.id}/rsvp?status=${status}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.ok) {
        const updatedRsvp = await res.json();
        if (onRsvpSuccess) onRsvpSuccess(updatedRsvp);
        setNotification({ message: `You are now ${status.replace('_', ' ')}`, type: 'success' });
      } else {
        const error = await res.json();
        setNotification({ message: `RSVP failed: ${error.detail}`, type: 'error' });
      }
    } catch (error) {
      setNotification({ message: 'An error occurred while trying to RSVP.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const rsvpCounts = useMemo(() => {
    const counts = { attending: 0, interested: 0, not_attending: 0 };
    if (event.rsvps) {
      for (const rsvp of event.rsvps) {
        if (counts[rsvp.status] !== undefined) {
          counts[rsvp.status]++;
        }
      }
    }
    return counts;
  }, [event.rsvps]);

  const isFull = event.max_participants && rsvpCounts.attending >= event.max_participants;

  return (
    <>
      <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification({ message: '', type: '' })} />
      <div className="mt-4 pt-4 border-t border-stone-700">
        <div className="flex justify-between items-center mb-3">
          <div className="flex gap-2">
            <button onClick={() => handleRsvp('attending')} disabled={isFull || isLoading} className="text-xs px-3 py-1 rounded bg-green-700 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed">Attend</button>
            <button onClick={() => handleRsvp('interested')} disabled={isLoading} className="text-xs px-3 py-1 rounded bg-sky-700 hover:bg-sky-600">Interested</button>
            <button onClick={() => handleRsvp('not_attending')} disabled={isLoading} className="text-xs px-3 py-1 rounded bg-red-800 hover:bg-red-700">Can't Go</button>
          </div>
          {isFull && <p className="text-xs text-red-500 font-bold">Event is full</p>}
        </div>
        <div className="flex justify-between text-xs text-stone-400">
          <span>{rsvpCounts.attending} / {event.max_participants || '∞'} Attending</span>
          <span>{rsvpCounts.interested} Interested</span>
          <span>{rsvpCounts.not_attending} Can't Go</span>
        </div>
      </div>
    </>
  );
}
