import React from 'react';

export default function Search({ onSearchChange }) {
  return (
    <div className="w-full mb-8">
      <input
        type="text"
        placeholder="Search by title, tag, or era..."
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
      />
    </div>
  );
}
