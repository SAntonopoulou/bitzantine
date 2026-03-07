import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Notification from '../components/Notification';
import ConfirmationModal from '../components/ConfirmationModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/announcements?limit=999`);
      const data = await res.json();
      setAnnouncements(data);
    } catch (error) {
      console.error("Failed to fetch announcements", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const openDeleteModal = (id) => {
    setSelectedId(id);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    setIsModalOpen(false);
    try {
      const res = await fetch(`${API_URL}/announcements/${selectedId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.ok) {
        setNotification({ message: 'Announcement deleted successfully.', type: 'success' });
        fetchAnnouncements(); // Refresh list
      } else {
        setNotification({ message: 'Failed to delete announcement.', type: 'error' });
      }
    } catch (error) {
      setNotification({ message: 'An error occurred.', type: 'error' });
    }
    setSelectedId(null);
  };

  if (loading) return <div className="p-8 text-center text-stone-400">Loading...</div>;

  return (
    <>
      <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification({ message: '', type: '' })} />
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Announcement"
      >
        Are you sure you want to permanently delete this announcement? This action cannot be undone.
      </ConfirmationModal>

      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-amber-500">Manage Announcements</h1>
          <Link to="/admin/announcements/add" className="bitz-btn text-lg">
            Create New
          </Link>
        </div>
        <div className="bg-stone-800 shadow-lg rounded-lg p-6">
          <ul className="space-y-4">
            {announcements.map(announcement => (
              <li key={announcement.id} className="flex justify-between items-center p-4 bg-stone-900 rounded-md">
                <div>
                  <p className="font-bold text-stone-200">{announcement.title}</p>
                  <p className="text-sm text-stone-500">{new Date(announcement.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-4">
                  <Link to={`/admin/announcements/edit/${announcement.id}`} className="text-amber-500 hover:underline">Edit</Link>
                  <button onClick={() => openDeleteModal(announcement.id)} className="text-red-500 hover:underline">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
