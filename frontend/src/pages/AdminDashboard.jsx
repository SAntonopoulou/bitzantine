import React from 'react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold text-amber-500 mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="bg-stone-800 p-6 rounded-lg flex flex-col">
          <h2 className="text-xl font-bold text-amber-400 mb-4">User Management</h2>
          <p className="text-stone-400 mb-6 flex-grow">Approve new users, manage roles, etc. (Functionality not yet implemented).</p>
          <button className="bitz-btn w-full text-center mt-auto" disabled>Manage Users</button>
        </div>

        <div className="bg-stone-800 p-6 rounded-lg flex flex-col">
          <h2 className="text-xl font-bold text-amber-400 mb-4">Lore Management</h2>
          <p className="text-stone-400 mb-6 flex-grow">Manage the guild's historical lore, eras, and individual entries.</p>
          <Link to="/admin/lore" className="bitz-btn w-full text-center mt-auto">
            Manage Lore
          </Link>
        </div>

        <div className="bg-stone-800 p-6 rounded-lg flex flex-col">
          <h2 className="text-xl font-bold text-amber-400 mb-4">Announcements</h2>
          <p className="text-stone-400 mb-6 flex-grow">Create, edit, and delete guild-wide announcements.</p>
          <Link to="/admin/announcements" className="bitz-btn w-full text-center mt-auto">
            Manage Announcements
          </Link>
        </div>

        <div className="bg-stone-800 p-6 rounded-lg flex flex-col">
          <h2 className="text-xl font-bold text-amber-400 mb-4">Events Management</h2>
          <p className="text-stone-400 mb-6 flex-grow">Create, edit, and manage guild events and templates.</p>
          <Link to="/admin/events" className="bitz-btn w-full text-center mt-auto">
            Manage Events
          </Link>
        </div>
      </div>
    </div>
  );
}
