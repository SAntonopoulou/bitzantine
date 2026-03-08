import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api'; // Use the centralized api instance
import { format } from 'date-fns';
import { Edit } from 'lucide-react';

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
        const res = await api.get(`/announcements/${id}`);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Announcement not found');
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncement();
  }, [id]);

  const isAdmin = user && (user.role === 'admin' || user.role === 'super_admin');

  if (loading) return <div className="p-4 sm:p-8 text-center text-stone-400">Loading...</div>;
  if (error) return <div className="p-4 sm:p-8 text-center text-red-500">{error}</div>;
  if (!data) return null;

  const { announcement, previous_id, next_id } = data;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-stone-800 rounded-lg shadow-xl overflow-hidden">
        {announcement.image_url && (
          <img src={`${API_URL}${announcement.image_url}`} alt={announcement.title} className="w-full h-64 sm:h-96 object-cover" />
        )}
        <div className="p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 gap-4">
            <div className="flex-grow">
              <h1 className="text-3xl sm:text-4xl font-bold text-amber-500">{announcement.title}</h1>
              <div className="text-sm text-stone-500 mt-2">
                Posted by {announcement.author?.username || 'Unknown'} on {format(new Date(announcement.created_at), 'MMMM d, yyyy')}
              </div>
            </div>
            {isAdmin && (
              <Link to={`/admin/announcements/edit/${announcement.id}`} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-stone-700 text-stone-200 rounded hover:bg-stone-600 transition-colors text-sm flex-shrink-0">
                <Edit size={16} /> Edit
              </Link>
            )}
          </div>
          
          <div 
            className="prose prose-invert max-w-none text-stone-300" 
            dangerouslySetInnerHTML={{ __html: announcement.content }} 
          />

          <div className="flex flex-wrap gap-2 mt-8">
            {announcement.tags?.map((tag, index) => (
              <span key={index} className="bg-stone-700 text-stone-300 px-3 py-1 rounded-full text-sm">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        {previous_id ? (
          <Link to={`/announcements/${previous_id}`} className="px-4 py-2 bg-stone-700 text-stone-300 rounded hover:bg-stone-600 transition-colors text-sm">&larr; Newer</Link>
        ) : <div />}
        {next_id ? (
          <Link to={`/announcements/${next_id}`} className="px-4 py-2 bg-stone-700 text-stone-300 rounded hover:bg-stone-600 transition-colors text-sm">Older &rarr;</Link>
        ) : <div />}
      </div>
    </div>
  );
}
