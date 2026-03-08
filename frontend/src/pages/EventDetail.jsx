import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import { api, API_URL } from '../api';
import { useNotification } from '../context/NotificationContext';
import { Calendar, Clock, Edit, UserPlus } from 'lucide-react';

const EventDateTime = ({ start, end, timezone }) => {
  if (!start) return null;

  const zonedStartTime = utcToZonedTime(new Date(start), timezone);
  const zonedEndTime = end ? utcToZonedTime(new Date(end), timezone) : null;

  const isSameDay = zonedEndTime ? format(zonedStartTime, 'yyyy-MM-dd') === format(zonedEndTime, 'yyyy-MM-dd') : true;

  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-stone-300 mb-6">
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-amber-500" />
        <div>
          <p className="font-bold">Date</p>
          <p className="text-sm">
            {format(zonedStartTime, 'eeee, MMMM d, yyyy')}
            {!isSameDay && zonedEndTime && ` - ${format(zonedEndTime, 'eeee, MMMM d, yyyy')}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-amber-500" />
        <div>
          <p className="font-bold">Time</p>
          <p className="text-sm">
            {format(zonedStartTime, 'h:mm a')}
            {zonedEndTime && ` to ${format(zonedEndTime, 'h:mm a')}`}
            <span className="text-xs text-stone-500 ml-2">{format(zonedStartTime, 'zzz')}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();

  const fetchEvent = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/events/${id}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
      showNotification(err.response?.data?.detail || 'Event not found', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showNotification]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const handleRsvp = async (status) => {
    if (!user) {
      showNotification('Please log in to RSVP.', 'error');
      return;
    }
    try {
      await api.post(`/events/${id}/rsvp?status=${status}`);
      showNotification(`You are now ${status.replace('_', ' ')}`, 'success');
      fetchEvent();
    } catch (error) {
      showNotification(error.response?.data?.detail || 'RSVP failed', 'error');
    }
  };

  if (loading) return <div className="p-4 sm:p-8 text-center text-stone-400">Loading Event...</div>;
  if (!data || !data.event) return <div className="p-4 sm:p-8 text-center text-red-500">Event not found.</div>;

  const { event, previous_event_id, next_event_id } = data;
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  const attendees = event.rsvps?.filter(rsvp => rsvp.status === 'attending') || [];
  const interested = event.rsvps?.filter(rsvp => rsvp.status === 'interested') || [];
  const isFull = event.max_participants && attendees.length >= event.max_participants;
  const isAdmin = user && (user.role === 'admin' || user.role === 'super_admin' || user.role === 'moderator');

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-stone-800 rounded-lg shadow-xl overflow-hidden">
        {event.featured_image_url && (
          <img src={`${API_URL}${event.featured_image_url}`} alt={event.title} className="w-full h-64 sm:h-96 object-cover" />
        )}
        <div className="p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-amber-500 mb-2 sm:mb-0">{event.title}</h1>
            {isAdmin && (
              <Link to={`/admin/events/edit/${event.id}`} className="flex items-center gap-2 mt-2 sm:mt-0 px-4 py-2 bg-stone-700 text-stone-200 rounded hover:bg-stone-600 transition-colors text-sm">
                <Edit size={16} /> Edit Event
              </Link>
            )}
          </div>
          
          <EventDateTime start={event.date} end={event.end_time} timezone={userTimeZone} />

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-6 text-stone-300 text-sm">
            {event.host && (
              <div className="flex items-center gap-2">
                <span className="text-stone-400">Host:</span>
                <Link to={`/profile/${event.host.username}`} className="flex items-center gap-2 hover:text-amber-400">
                  <img src={event.host.avatar_url ? `${API_URL}${event.host.avatar_url}` : `https://ui-avatars.com/api/?name=${event.host.username}&background=292524&color=f59e0b`} alt={event.host.username} className="w-6 h-6 rounded-full object-cover" />
                  <span className="font-medium">{event.host.display_name || event.host.username}</span>
                </Link>
              </div>
            )}
            {event.host_group && (
              <div className="flex items-center gap-2">
                <span className="text-stone-400">Group:</span>
                <Link to={`/groups/${event.host_group.id}`} className="flex items-center gap-2 hover:text-amber-400">
                  <img src={event.host_group.image_url ? `${API_URL}${event.host_group.image_url}` : `https://ui-avatars.com/api/?name=${event.host_group.name}&background=292524&color=f59e0b`} alt={event.host_group.name} className="w-6 h-6 rounded-full object-cover" />
                  <span className="font-medium">{event.host_group.name}</span>
                </Link>
              </div>
            )}
          </div>

          <div 
            className="prose prose-invert max-w-none mb-8 whitespace-pre-wrap text-stone-300"
            dangerouslySetInnerHTML={{ __html: event.description }}
          />
          
          <div className="bg-stone-900/50 p-4 sm:p-6 rounded-lg border border-stone-700">
            <h2 className="text-xl sm:text-2xl font-bold text-amber-400 mb-6">RSVP</h2>
            <div className="flex flex-wrap gap-4 mb-6">
              <button onClick={() => handleRsvp('attending')} disabled={isFull} className={`px-4 py-2 rounded font-bold transition-colors text-sm sm:text-base ${isFull ? 'bg-stone-600 cursor-not-allowed text-stone-400' : 'bg-green-600 hover:bg-green-700 text-white'}`}>
                {isFull ? 'Full' : 'Attend'}
              </button>
              <button onClick={() => handleRsvp('interested')} className="px-4 py-2 rounded font-bold border border-amber-600 text-amber-500 hover:bg-amber-900/30 transition-colors text-sm sm:text-base">
                Interested
              </button>
              <button onClick={() => handleRsvp('not_attending')} className="px-4 py-2 rounded font-bold text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors text-sm sm:text-base">
                Can't Go
              </button>
            </div>

            <div className="space-y-6">
              {attendees.length > 0 && (
                <div>
                  <h3 className="font-bold text-stone-300 mb-3 flex items-center">
                    <span className="bg-green-900/50 text-green-400 px-2 py-1 rounded text-xs uppercase mr-2">Attending</span>
                    {attendees.length} {event.max_participants && `/ ${event.max_participants}`}
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {attendees.map(rsvp => (
                      <Link to={`/profile/${rsvp.user.username}`} key={rsvp.user.id} title={rsvp.user.display_name || rsvp.user.username} className="group relative">
                        <img src={rsvp.user.avatar_url ? `${API_URL}${rsvp.user.avatar_url}` : `https://ui-avatars.com/api/?name=${rsvp.user.username}&background=292524&color=f59e0b`} alt={rsvp.user.username} className="w-10 h-10 rounded-full object-cover border-2 border-green-600 group-hover:border-green-400 transition-colors" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {interested.length > 0 && (
                <div>
                  <h3 className="font-bold text-stone-300 mb-3 flex items-center">
                    <span className="bg-amber-900/50 text-amber-400 px-2 py-1 rounded text-xs uppercase mr-2">Interested</span>
                    {interested.length}
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {interested.map(rsvp => (
                      <Link to={`/profile/${rsvp.user.username}`} key={rsvp.user.id} title={rsvp.user.display_name || rsvp.user.username} className="group relative">
                        <img src={rsvp.user.avatar_url ? `${API_URL}${rsvp.user.avatar_url}` : `https://ui-avatars.com/api/?name=${rsvp.user.username}&background=292524&color=f59e0b`} alt={rsvp.user.username} className="w-10 h-10 rounded-full object-cover border-2 border-amber-600 group-hover:border-amber-400 transition-colors" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between mt-8">
        {previous_event_id ? (
          <Link to={`/events/${previous_event_id}`} className="px-4 py-2 bg-stone-700 text-stone-300 rounded hover:bg-stone-600 transition-colors text-sm">
            &larr; Previous Event
          </Link>
        ) : <div />}
        
        {next_event_id ? (
          <Link to={`/events/${next_event_id}`} className="px-4 py-2 bg-stone-700 text-stone-300 rounded hover:bg-stone-600 transition-colors text-sm">
            Next Event &rarr;
          </Link>
        ) : <div />}
      </div>
    </div>
  );
}
