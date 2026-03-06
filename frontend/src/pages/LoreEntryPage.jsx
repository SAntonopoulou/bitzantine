import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Timeline from '../components/Timeline';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function LoreEntryPage() {
  const { entryId } = useParams();
  const [entry, setEntry] = useState(null);
  const [eras, setEras] = useState([]);
  const [eraEntries, setEraEntries] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        setLoading(true);
        
        const entryRes = await fetch(`${API_URL}/lore/entries/${entryId}`);
        if (!entryRes.ok) throw new Error('Lore entry not found');
        const entryData = await entryRes.json();
        setEntry(entryData);

        const erasRes = await fetch(`${API_URL}/lore/eras`);
        const erasData = await erasRes.json();
        setEras(erasData);

        const allEntriesRes = await fetch(`${API_URL}/lore/entries?limit=999`);
        const allEntriesData = await allEntriesRes.json();
        const groupedByEra = allEntriesData.reduce((acc, item) => {
          const eraId = item.era_id;
          if (!acc[eraId]) acc[eraId] = [];
          acc[eraId].push(item);
          return acc;
        }, {});
        setEraEntries(groupedByEra);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPageData();
  }, [entryId]);

  if (loading) {
    return <div className="p-8 text-center text-stone-400">Loading entry...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  if (!entry) {
    return <div className="p-8 text-center text-stone-500">Entry not found.</div>;
  }

  return (
    <div className="flex justify-center">
      <div className="flex w-full max-w-7xl">
        <Timeline 
          eras={eras}
          eraEntries={eraEntries}
          activeEntryId={parseInt(entryId)}
          selectedEraId={entry.era_id}
          onEraClick={() => {}}
          onEntryClick={() => {}}
          sortDesc={true}
          isMainLorePage={false}
        />

        <div className="flex-1 md:ml-64 p-8">
          <Link to="/lore" className="text-amber-600 hover:underline mb-6 block">&larr; Back to Lore Feed</Link>
          
          <div className="bg-stone-800 rounded-lg shadow-lg p-8">
            {entry.image_url && (
              <img 
                src={`${API_URL}${entry.image_url}`} 
                alt={entry.title} 
                className="w-full h-96 object-cover rounded-lg mb-6"
              />
            )}
            <h1 className="text-4xl font-bold text-amber-500 mb-4">{entry.title}</h1>
            <div className="flex justify-between items-center mb-6 text-sm text-stone-500">
              <span>Posted on {new Date(entry.created_at).toLocaleDateString()}</span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${entry.entry_type === 'core' ? 'bg-sky-900 text-sky-300' : 'bg-purple-900 text-purple-300'}`}>
                {entry.entry_type}
              </span>
            </div>
            
            <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: entry.content }} />

            <div className="flex flex-wrap gap-2 mt-8">
              {entry.tags && entry.tags.map((tag, idx) => (
                <span key={idx} className="bg-stone-700 text-stone-300 px-3 py-1 rounded-full text-sm">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
