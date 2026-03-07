import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function AnnouncementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/announcements/${id}`);
        if (!res.ok) {
          throw new Error('Announcement not found');
        }
        const fetchedData = await res.json();
        setData(fetchedData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncement();
  }, [id]);

  const isAdmin = user && (user.role === 'admin' || user.role === 'super_admin');

  if (loading) return <div className="p-8 text-center text-stone-400">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!data) return null;

  const { announcement, previous_id, next_id } = data;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-stone-800 rounded-lg shadow-xl overflow-hidden">
        {announcement.image_url && (
          <img src={`${API_URL}${announcement.image_url}`} alt={announcement.title} className="w-full h-96 object-cover" />
        )}
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-bold text-amber-500">{announcement.title}</h1>
            {isAdmin && (
              <Link to={`/admin/announcements/edit/${announcement.id}`} className="bitz-btn">
                Edit
              </Link>
            )}
          </div>
          <div className="text-sm text-stone-500 mb-6">
            Posted on {new Date(announcement.created_at).toLocaleDateString()}
          </div>
          <div 
            className="prose prose-invert max-w-none" 
            dangerouslySetInnerHTML={{ __html: announcement.content }} 
          />
          <div className="flex flex-wrap gap-2 mt-8">
            {announcement.tags.map((tag, index) => (
              <span key={index} className="bg-stone-700 text-stone-300 px-3 py-1 rounded-full text-sm">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        {previous_id ? (
          <Link to={`/announcements/${previous_id}`} className="bitz-btn">&larr; Newer</Link>
        ) : <div />}
        {next_id ? (
          <Link to={`/announcements/${next_id}`} className="bitz-btn">Older &rarr;</Link>
        ) : <div />}
      </div>
    </div>
  );
}
