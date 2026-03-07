import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-amber-500 mb-8">Settings</h1>
      
      <div className="bg-stone-800 rounded-lg shadow-lg p-6 border border-stone-700">
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-6 border-b border-stone-700">
            <div>
              <h2 className="text-xl font-semibold text-stone-200">Profile Settings</h2>
              <p className="text-stone-400 text-sm mt-1">Update your personal information and profile appearance.</p>
            </div>
            <Link to="/profile/edit" className="bitz-btn">
              Edit Profile
            </Link>
          </div>

          <div className="flex items-center justify-between pb-6 border-b border-stone-700">
            <div>
              <h2 className="text-xl font-semibold text-stone-200">Account Security</h2>
              <p className="text-stone-400 text-sm mt-1">Change your password and manage account security.</p>
            </div>
            <button className="px-4 py-2 bg-stone-700 text-stone-300 rounded hover:bg-stone-600 transition-colors">
              Change Password
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-stone-200">Notifications</h2>
              <p className="text-stone-400 text-sm mt-1">Manage your email and push notification preferences.</p>
            </div>
            <button className="px-4 py-2 bg-stone-700 text-stone-300 rounded hover:bg-stone-600 transition-colors">
              Manage Notifications
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
