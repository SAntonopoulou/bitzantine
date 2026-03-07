import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { format, utcToZonedTime } from 'date-fns-tz';
import Notification from '../components/Notification';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ message: '', type: '' });

  const fetchEvent = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/events/${id}`, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Event not found');
      }
      const fetchedData = await res.json();
      setData(fetchedData);
    } catch (err) {
      console.error(err);
      setNotification({ message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const handleRsvp = async (status) => {
    if (!user) {
      setNotification({ message: 'Please log in to RSVP.', type: 'error' });
      return;
    }
    try {
      const res = await fetch(`${API_URL}/events/${id}/rsvp?status=${status}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.ok) {
        setNotification({ message: `You are now ${status.replace('_', ' ')}`, type: 'success' });
        fetchEvent(); // Force a refetch of the event data
      } else {
        const error = await res.json();
        setNotification({ message: `RSVP failed: ${error.detail}`, type: 'error' });
      }
    } catch (error) {
      setNotification({ message: 'An unexpected error occurred.', type: 'error' });
    }
  };

  if (loading) return <div className="p-8 text-center text-stone-400">Loading Event...</div>;
  if (!data || !data.event) return <div className="p-8 text-center text-red-500">Event not found.</div>;

  const { event, previous_event_id, next_event_id } = data;
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const zonedStartTime = utcToZonedTime(new Date(event.date), userTimeZone);
  const zonedEndTime = event.end_time ? utcToZonedTime(new Date(event.end_time), userTimeZone) : null;

  const attendees = event.rsvps?.filter(rsvp => rsvp.status === 'attending') || [];
  const interested = event.rsvps?.filter(rsvp => rsvp.status === 'interested') || [];
  const notAttending = event.rsvps?.filter(rsvp => rsvp.status === 'not_attending') || [];
  const isFull = event.max_participants && attendees.length >= event.max_participants;
  const isAdmin = user && (user.role === 'admin' || user.role === 'super_admin' || user.role === 'moderator');

  return (
    <>
      <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification({ message: '', type: '' })} />
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-stone-800 rounded-lg shadow-xl overflow-hidden">
          {event.featured_image_url && (
            <img src={`${API_URL}${event.featured_image_url}`} alt={event.title} className="w-full h-96 object-cover" />
          )}
          <div className="p-8">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-4xl font-bold text-amber-500">{event.title}</h1>
              {isAdmin && (
                <Link to={`/admin/events/edit/${event.id}`} className="bitz-btn">Edit Event</Link>
              )}
            </div>
            <div className="text-lg text-amber-400 mb-6 font-semibold">
              {format(zonedStartTime, 'eeee, MMMM d, yyyy')} at {format(zonedStartTime, 'h:mm a zzz')}
              {zonedEndTime && ` to ${format(zonedEndTime, 'h:mm a zzz')}`}
            </div>
            <div className="prose prose-invert max-w-none mb-8" dangerouslySetInnerHTML={{ __html: event.description }} />
            
            <div className="bg-stone-900/50 p-6 rounded-lg">
              <h2 className="text-2xl font-bold text-amber-400 mb-6">RSVP</h2>
              <div className="flex items-center justify-between">
                <div className="flex gap-4">
                  <button onClick={() => handleRsvp('attending')} disabled={isFull} className="bitz-btn disabled:bg-gray-500 disabled:cursor-not-allowed">Attend</button>
                  <button onClick={() => handleRsvp('interested')} className="border border-stone-600 px-4 py-2 rounded text-stone-300 hover:bg-stone-700">Interested</button>
                  <button onClick={() => handleRsvp('not_attending')} className="text-stone-500 hover:underline">Can't Go</button>
                </div>
                {isFull && <p className="text-red-500 font-bold">This event is full.</p>}
              </div>
              <div className="mt-6">
                <h3 className="font-bold text-stone-300 mb-2">{attendees.length} Attending {event.max_participants && `(${event.max_participants} max)`}</h3>
                <div className="flex flex-wrap gap-2">
                  {attendees.map(rsvp => (
                    <Link to={`/profile/${rsvp.user.id}`} key={rsvp.user.id} title={rsvp.user.username}>
                      <img src={rsvp.user.profile?.avatar_url || `https://ui-avatars.com/api/?name=${rsvp.user.username}&background=a16207&color=fff`} alt={rsvp.user.username} className="w-12 h-12 rounded-full object-cover border-2 border-stone-700" />
                    </Link>
                  ))}
                </div>
              </div>
              <div className="mt-4">
                <h3 className="font-bold text-stone-300 mb-2">{interested.length} Interested</h3>
                <div className="flex flex-wrap gap-2">
                  {interested.map(rsvp => (
                    <Link to={`/profile/${rsvp.user.id}`} key={rsvp.user.id} title={rsvp.user.username}>
                      <img src={rsvp.user.profile?.avatar_url || `https://ui-avatars.com/api/?name=${rsvp.user.username}&background=a16207&color=fff`} alt={rsvp.user.username} className="w-12 h-12 rounded-full object-cover border-2 border-stone-700" />
                    </Link>
                  ))}
                </div>
              </div>
              <div className="mt-4">
                <h3 className="font-bold text-stone-300 mb-2">{notAttending.length} Can't Go</h3>
                <div className="flex flex-wrap gap-2">
                  {notAttending.map(rsvp => (
                    <Link to={`/profile/${rsvp.user.id}`} key={rsvp.user.id} title={rsvp.user.username}>
                      <img src={rsvp.user.profile?.avatar_url || `https://ui-avatars.com/api/?name=${rsvp.user.username}&background=a16207&color=fff`} alt={rsvp.user.username} className="w-12 h-12 rounded-full object-cover border-2 border-stone-700" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-between mt-8">
          {previous_event_id ? <Link to={`/events/${previous_event_id}`} className="bitz-btn">&larr; Previous Event</Link> : <div />}
          {next_event_id ? <Link to={`/events/${next_event_id}`} className="bitz-btn">Next Event &rarr;</Link> : <div />}
        </div>
      </div>
    </>
  );
}
