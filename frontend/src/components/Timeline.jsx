import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';

const TimelineEra = ({ era, entries, activeEntryId, onEraClick, onEntryClick, isSelected }) => (
  <div className="relative pl-6 group">
    <div 
      className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white transition-all cursor-pointer ${isSelected ? 'scale-125 ring-2 ring-offset-1' : ''}`}
      style={{ backgroundColor: era.color_hex }}
      onClick={() => onEraClick(era.id)}
    />
    <h3 
      className={`font-semibold text-sm transition-colors cursor-pointer ${isSelected ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-700'}`}
      onClick={() => onEraClick(era.id)}
    >
      {era.name}
    </h3>
    <span className="text-xs text-gray-400">
      {new Date(era.start_date).getFullYear()}
    </span>
    <div className="mt-2 pl-1 space-y-2">
      {entries.map(entry => (
        <Link 
          to={`/lore/${entry.id}`}
          key={entry.id} 
          className="relative flex items-center cursor-pointer group/dot"
          onClick={(e) => {
            // Prevent full page reload if on the main lore page
            if (window.location.pathname === '/lore') {
              e.preventDefault();
              onEntryClick(entry.id);
            }
          }}
        >
          <div className={`w-2 h-2 rounded-full transition-all ${activeEntryId === entry.id ? 'bg-blue-500 scale-125' : 'bg-gray-300 group-hover/dot:bg-gray-400'}`} />
          <span className={`ml-2 text-xs transition-colors ${activeEntryId === entry.id ? 'text-blue-600 font-semibold' : 'text-gray-400 group-hover/dot:text-gray-600'}`}>
            {entry.title}
          </span>
        </Link>
      ))}
    </div>
  </div>
);

export default function Timeline({ eras, eraEntries, activeEntryId, selectedEraId, onEraClick, onEntryClick, sortDesc }) {
  const sortedEras = useMemo(() => {
    const erasCopy = [...eras];
    return sortDesc ? erasCopy.reverse() : erasCopy;
  }, [eras, sortDesc]);

  return (
    <div className="w-64 hidden md:block fixed h-full overflow-y-auto p-6 z-10">
      <h2 className="text-xl font-bold mb-6 text-gray-800">Guild Lore Timeline</h2>
      <div className="relative border-l-2 border-gray-200 ml-3 space-y-8">
        {sortedEras.map((era) => (
          <TimelineEra
            key={era.id}
            era={era}
            entries={eraEntries[era.id] || []}
            activeEntryId={activeEntryId}
            isSelected={selectedEraId === era.id}
            onEraClick={onEraClick}
            onEntryClick={onEntryClick}
          />
        ))}
      </div>
    </div>
  );
}
