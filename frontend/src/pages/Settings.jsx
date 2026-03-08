import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { api } from '../api';
import ConfirmationModal from '../components/ConfirmationModal';

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleDeleteAccount = async () => {
    setIsDeleteModalOpen(false);
    try {
      await api.delete('/users/me');
      showNotification('Your account has been successfully deleted.', 'success');
      logout();
      navigate('/');
    } catch (error) {
      showNotification('Failed to delete account. Please try again.', 'error');
      console.error("Failed to delete account:", error);
    }
  };

  return (
    <>
      <div className="p-4 sm:p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-amber-500 mb-8">Settings</h1>
        
        <div className="bg-stone-800 rounded-lg shadow-lg p-4 sm:p-6 border border-stone-700">
          <div className="space-y-6">
            {/* Profile Settings */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-stone-700 gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-stone-200">Profile Settings</h2>
                <p className="text-stone-400 text-sm mt-1">Update your personal information and profile appearance.</p>
              </div>
              <Link to="/profile/edit" className="w-full sm:w-auto text-center px-4 py-2 bg-stone-700 text-stone-200 rounded hover:bg-stone-600 transition-colors font-medium">
                Edit Profile
              </Link>
            </div>

            {/* Account Security */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-stone-700 gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-stone-200">Account Security</h2>
                <p className="text-stone-400 text-sm mt-1">Change your password and manage account security.</p>
              </div>
              <button className="w-full sm:w-auto px-4 py-2 bg-stone-700 text-stone-300 rounded hover:bg-stone-600 transition-colors cursor-not-allowed opacity-50">
                Change Password
              </button>
            </div>

            {/* Notifications */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-stone-700 gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-stone-200">Notifications</h2>
                <p className="text-stone-400 text-sm mt-1">Manage your email and push notification preferences.</p>
              </div>
              <button className="w-full sm:w-auto px-4 py-2 bg-stone-700 text-stone-300 rounded hover:bg-stone-600 transition-colors cursor-not-allowed opacity-50">
                Manage Notifications
              </button>
            </div>

            {/* Delete Account */}
            <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-red-400">Delete Account</h2>
                  <p className="text-red-300/70 text-sm mt-1">Permanently delete your account and all associated data. This action cannot be undone.</p>
                </div>
                <button 
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="w-full sm:w-auto px-4 py-2 bg-red-800 text-white rounded hover:bg-red-700 transition-colors font-medium"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Confirm Account Deletion"
        message="Are you absolutely sure you want to delete your account? All of your data, including profile, posts, and memberships, will be permanently removed. This action cannot be undone."
        confirmText="Yes, Delete My Account"
        isDestructive={true}
      />
    </>
  );
}
