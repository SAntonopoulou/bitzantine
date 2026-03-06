import React from 'react';

export default function Search({ onSearchChange }) {
  return (
    <div className="w-full mb-8">
      <input
        type="text"
        placeholder="Search by title, tag, or era..."
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full px-4 py-3 bg-stone-800 border-2 border-stone-700 rounded-lg shadow-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition text-stone-200 placeholder-stone-500"
      />
    </div>
  );
}
