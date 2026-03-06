import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function LoreEntryPage() {
  const { entryId } = useParams();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/lore/entries/${entryId}`);
        if (!res.ok) {
          throw new Error('Lore entry not found');
        }
        const data = await res.json();
        setEntry(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEntry();
  }, [entryId]);

  if (loading) {
    return <div className="p-8 text-center">Loading entry...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }

  if (!entry) {
    return <div className="p-8 text-center">Entry not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <Link to="/lore" className="text-blue-600 hover:underline mb-6 block">&larr; Back to Lore</Link>
      
      <div className="bg-white rounded-lg shadow-lg p-8">
        {entry.image_url && (
          <img 
            src={`${API_URL}${entry.image_url}`} 
            alt={entry.title} 
            className="w-full h-96 object-cover rounded-t-lg mb-6"
          />
        )}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{entry.title}</h1>
        <div className="flex justify-between items-center mb-6 text-sm text-gray-500">
          <span>Posted on {new Date(entry.created_at).toLocaleDateString()}</span>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${entry.entry_type === 'core' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
            {entry.entry_type}
          </span>
        </div>
        
        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: entry.content }} />

        <div className="flex flex-wrap gap-2 mt-8">
          {entry.tags && entry.tags.map((tag, idx) => (
            <span key={idx} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
