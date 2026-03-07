import React from 'react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const stripHtml = (html) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
};

export default function AnnouncementCard({ announcement }) {
  const excerpt = stripHtml(announcement.content).substring(0, 150);

  return (
    <div className="bg-stone-800 rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:-translate-y-1">
      <Link to={`/announcements/${announcement.id}`}>
        {announcement.image_url && (
          <img src={`${API_URL}${announcement.image_url}`} alt={announcement.title} className="w-full h-48 object-cover" />
        )}
        <div className="p-6">
          <h3 className="text-xl font-bold text-amber-500 mb-2">{announcement.title}</h3>
          <p className="text-stone-400 mb-4">{excerpt}...</p>
          <div className="text-xs text-stone-500 mb-4">
            {new Date(announcement.created_at).toLocaleDateString()}
          </div>
          <div className="flex flex-wrap gap-2">
            {announcement.tags.map((tag, index) => (
              <span key={index} className="bg-stone-700 text-stone-300 px-2 py-1 rounded-full text-xs">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </div>
  );
}
