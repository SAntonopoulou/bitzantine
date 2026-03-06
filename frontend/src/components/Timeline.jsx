import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const TimelineEra = ({ era, entries, activeEntryId, onEraClick, onEntryClick, isSelected, isMainLorePage }) => {
  const navigate = useNavigate();

  const handleEraNameClick = () => {
    if (isMainLorePage) {
      onEraClick(era.id); // Scroll on main page
    } else {
      navigate(`/lore/eras/${era.id}`); // Navigate on other pages
    }
  };

  return (
    <div className="relative pl-6 group">
      <div 
        className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-stone-900 transition-all cursor-pointer ${isSelected ? 'scale-125 ring-2 ring-offset-1' : ''}`}
        style={{ backgroundColor: era.color_hex }}
        onClick={() => onEraClick(era.id)}
        title="Scroll to this era"
      />
      <h3 
        className="font-semibold text-sm transition-colors cursor-pointer text-stone-400 hover:text-amber-500"
        onClick={handleEraNameClick}
        title={isMainLorePage ? `Scroll to ${era.name}` : `View ${era.name} archive`}
      >
        {era.name}
      </h3>
      <span className="text-xs text-stone-500">
        {new Date(era.start_date).getFullYear()}
      </span>
      <div className="mt-2 pl-1 space-y-2">
        {entries.map(entry => (
          <Link 
            to={`/lore/${entry.id}`}
            key={entry.id} 
            className="relative flex items-center cursor-pointer group/dot"
            onClick={(e) => {
              if (isMainLorePage) {
                e.preventDefault();
                onEntryClick(entry.id);
              }
            }}
          >
            <div className={`w-2 h-2 rounded-full transition-all ${activeEntryId === entry.id ? 'bg-amber-500 scale-125' : 'bg-stone-600 group-hover/dot:bg-stone-500'}`} />
            <span className={`ml-2 text-xs transition-colors ${activeEntryId === entry.id ? 'text-amber-400 font-semibold' : 'text-stone-500 group-hover/dot:text-stone-400'}`}>
              {entry.title}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default function Timeline({ eras, eraEntries, activeEntryId, selectedEraId, onEraClick, onEntryClick, sortDesc, isMainLorePage = false }) {
  const sortedEras = useMemo(() => {
    const erasCopy = [...eras];
    return sortDesc ? erasCopy.reverse() : erasCopy;
  }, [eras, sortDesc]);

  return (
    <div className="w-64 hidden md:block fixed h-full overflow-y-auto p-6 z-10 bg-stone-900 border-r border-stone-800">
      <Link to="/lore" className="text-xl font-bold mb-6 text-amber-500 hover:text-amber-400 transition-colors">
        Guild Lore Timeline
      </Link>
      <div className="relative border-l-2 border-stone-700 ml-3 space-y-8">
        {sortedEras.map((era) => (
          <TimelineEra
            key={era.id}
            era={era}
            entries={eraEntries[era.id] || []}
            activeEntryId={activeEntryId}
            isSelected={selectedEraId === era.id}
            onEraClick={onEraClick}
            onEntryClick={onEntryClick}
            isMainLorePage={isMainLorePage}
          />
        ))}
      </div>
    </div>
  );
}
