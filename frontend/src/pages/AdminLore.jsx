import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function AdminLore() {
  const [eras, setEras] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [erasRes, entriesRes] = await Promise.all([
          fetch(`${API_URL}/lore/eras`),
          fetch(`${API_URL}/lore/entries?limit=999&sort_desc=true`), // Fetch all sorted
        ]);
        const erasData = await erasRes.json();
        const entriesData = await entriesRes.json();
        setEras(erasData);
        setEntries(entriesData);
      } catch (error) {
        console.error("Failed to fetch lore data for admin", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const erasWithEntries = useMemo(() => {
    // Create a map of eraId to era object
    const eraMap = new Map(eras.map(era => [era.id, { ...era, entries: [] }]));
    
    // Add a placeholder for entries without an era (Core Lore)
    const coreLore = { id: 'core', name: 'Core Lore', start_date: '0', entries: [] };
    eraMap.set('core', coreLore);

    // Group entries into their respective eras
    entries.forEach(entry => {
      const eraId = entry.era_id || 'core';
      if (eraMap.has(eraId)) {
        eraMap.get(eraId).entries.push(entry);
      }
    });

    // Sort eras by start date (desc) and return as an array
    return Array.from(eraMap.values()).sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
  }, [eras, entries]);

  if (loading) {
    return <div className="p-8 text-center text-stone-400">Loading Lore Management...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold text-amber-500 mb-8">Lore Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <Link to="/admin/lore/add-era" className="bitz-btn text-center p-6 text-xl">
          Add New Era
        </Link>
        <Link to="/admin/lore/add-entry" className="bitz-btn text-center p-6 text-xl">
          Add New Entry
        </Link>
      </div>

      <div>
        <h2 className="text-3xl font-bold text-amber-400 mb-6">Existing Content</h2>
        <div className="space-y-8">
          {erasWithEntries.map(era => (
            <div key={era.id} className="bg-stone-800/50 p-6 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-stone-200">{era.name}</h3>
                {era.id !== 'core' && (
                  <Link to={`/admin/lore/edit-era/${era.id}`} className="border border-stone-600 px-4 py-2 rounded text-stone-300 hover:bg-stone-700 hover:text-white transition">
                    Edit Era
                  </Link>
                )}
              </div>
              <div className="space-y-3 pl-4 border-l-2 border-stone-700">
                {era.entries.length > 0 ? (
                  era.entries.map(entry => (
                    <div key={entry.id} className="flex justify-between items-center bg-stone-800 p-3 rounded-md">
                      <div>
                        <p className="font-semibold text-stone-300">{entry.title}</p>
                        <p className="text-xs text-stone-500">
                          {new Date(entry.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Link to={`/admin/lore/edit-entry/${entry.id}`} className="text-sm border border-stone-700 px-3 py-1 rounded text-stone-400 hover:bg-stone-700 hover:text-white transition">
                        Edit
                      </Link>
                    </div>
                  ))
                ) : (
                  <p className="text-stone-500 italic pl-3">No entries in this era.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
