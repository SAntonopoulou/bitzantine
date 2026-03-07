import React from 'react';
import { Link } from 'react-router-dom';
import { format, utcToZonedTime } from 'date-fns-tz';
import QuickRSVP from './QuickRSVP';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const stripHtml = (html) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
};

export default function EventCard({ event, onRsvpSuccess }) {
  const excerpt = stripHtml(event.description).substring(0, 150);
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const zonedStartTime = utcToZonedTime(new Date(event.date), userTimeZone);

  return (
    <div className="bg-stone-800 rounded-lg shadow-lg overflow-hidden">
      <Link to={`/events/${event.id}`}>
        {event.featured_image_url && (
          <img src={`${API_URL}${event.featured_image_url}`} alt={event.title} className="w-full h-48 object-cover" />
        )}
        <div className="p-6">
          <p className="text-sm font-semibold text-amber-500 mb-1">
            {format(zonedStartTime, 'eeee, MMMM d, yyyy')}
          </p>
          <h3 className="text-xl font-bold text-stone-200 mb-2">{event.title}</h3>
          <p className="text-stone-400 mb-4 h-12">{excerpt}...</p>
          <div className="text-xs text-stone-500">
            Starts at {format(zonedStartTime, 'h:mm a zzz')}
          </div>
        </div>
      </Link>
      <div className="px-6 pb-4">
        <QuickRSVP event={event} onRsvpSuccess={onRsvpSuccess} />
      </div>
    </div>
  );
}
