import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Timeline from '../components/Timeline';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const stripHtml = (html) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
};

const LoreEntryCard = ({ entry, eraColor }) => (
  <div className="bg-stone-800 rounded-lg shadow-md p-6 border-l-4" style={{ borderLeftColor: eraColor }}>
    <Link to={`/lore/${entry.id}`} className="text-xl font-bold text-amber-500 hover:text-amber-400 transition-colors">
      {entry.title}
    </Link>
    <p className="text-sm text-stone-500 mt-1">
      {new Date(entry.created_at).toLocaleDateString()}
    </p>
    <p className="mt-4 text-stone-400">{stripHtml(entry.content).substring(0, 150)}...</p>
  </div>
);

export default function EraPage() {
  const { eraId } = useParams();
  const [era, setEra] = useState(null);
  const [entries, setEntries] = useState([]);
  const [allEras, setAllEras] = useState([]);
  const [eraEntries, setEraEntries] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        setLoading(true);
        
        const eraRes = await fetch(`${API_URL}/lore/eras/${eraId}`);
        if (!eraRes.ok) throw new Error('Era not found');
        const eraData = await eraRes.json();
        setEra(eraData);

        const entriesRes = await fetch(`${API_URL}/lore/entries?era_id=${eraId}&limit=999`);
        const entriesData = await entriesRes.json();
        setEntries(entriesData);

        const allErasRes = await fetch(`${API_URL}/lore/eras`);
        const allErasData = await allErasRes.json();
        setAllEras(allErasData);

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
  }, [eraId]);

  if (loading) {
    return <div className="p-8 text-center text-stone-400">Loading era...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  if (!era) {
    return <div className="p-8 text-center text-stone-500">Era not found.</div>;
  }

  return (
    <div className="flex justify-center">
      <div className="flex w-full max-w-7xl">
        <Timeline 
          eras={allEras}
          eraEntries={eraEntries}
          activeEntryId={null}
          selectedEraId={parseInt(eraId)}
          onEraClick={() => {}}
          onEntryClick={() => {}}
          sortDesc={true}
          isMainLorePage={false}
        />

        <div className="flex-1 md:ml-64 p-8">
          <div className="bg-stone-800 rounded-lg shadow-xl overflow-hidden">
            {era.image_url && (
              <img 
                src={`${API_URL}${era.image_url}`} 
                alt={era.name} 
                className="w-full h-64 object-cover"
              />
            )}
            <div className="p-8">
              <h1 className="text-4xl font-bold text-amber-500">{era.name}</h1>
              <p className="text-lg text-stone-400 mt-2">
                {new Date(era.start_date).toLocaleDateString()} - {era.end_date ? new Date(era.end_date).toLocaleDateString() : 'Present'}
              </p>
              <div className="prose prose-invert max-w-none mt-6" dangerouslySetInnerHTML={{ __html: era.description }} />
            </div>
          </div>

          <div className="mt-12">
            <h2 className="text-2xl font-bold text-amber-500 mb-6">Entries from this Era</h2>
            <div className="space-y-6">
              {entries.map(entry => (
                <LoreEntryCard key={entry.id} entry={entry} eraColor={era.color_hex} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
