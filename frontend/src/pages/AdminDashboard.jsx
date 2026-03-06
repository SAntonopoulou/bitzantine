import React from 'react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold text-amber-500 mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Placeholder for other admin sections */}
        <div className="bg-stone-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold text-amber-400 mb-4">User Management</h2>
          <p className="text-stone-400">Approve new users, manage roles, etc. (Functionality not yet implemented).</p>
        </div>

        <div className="bg-stone-800 p-6 rounded-lg flex flex-col">
          <h2 className="text-xl font-bold text-amber-400 mb-4">Content Management</h2>
          <p className="text-stone-400 mb-6 flex-grow">Manage the guild's historical lore, eras, and individual entries.</p>
          <Link to="/admin/lore" className="bitz-btn w-full text-center mt-auto">
            Manage Lore
          </Link>
        </div>

        <div className="bg-stone-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold text-amber-400 mb-4">Announcements</h2>
          <p className="text-stone-400">Create and manage guild-wide announcements. (Functionality not yet implemented).</p>
        </div>
      </div>
    </div>
  );
}
