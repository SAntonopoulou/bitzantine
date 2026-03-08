import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Notification from '../components/Notification';
import ConfirmationModal from '../components/ConfirmationModal';
import { api } from '../api'; // Using the centralized api instance
import { useNotification } from '../context/NotificationContext';
import { format } from 'date-fns';
import { Edit, Trash2, Plus } from 'lucide-react';

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const { showNotification } = useNotification();

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.get('/announcements?limit=999');
      setAnnouncements(res.data);
    } catch (error) {
      console.error("Failed to fetch announcements", error);
      showNotification('Failed to fetch announcements.', 'error');
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
    try {
      await api.delete(`/announcements/${selectedId}`);
      showNotification('Announcement deleted successfully.', 'success');
      fetchAnnouncements(); // Refresh list
    } catch (error) {
      showNotification('Failed to delete announcement.', 'error');
    } finally {
      setIsModalOpen(false);
      setSelectedId(null);
    }
  };

  if (loading) return <div className="p-4 sm:p-8 text-center text-stone-400">Loading...</div>;

  return (
    <>
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Announcement"
        message="Are you sure you want to permanently delete this announcement? This action cannot be undone."
      />

      <div className="p-4 sm:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-amber-500">Manage Announcements</h1>
          <Link to="/admin/announcements/add" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700 font-medium">
            <Plus size={20} /> Create New
          </Link>
        </div>
        <div className="bg-stone-800 shadow-lg rounded-lg">
          <ul className="divide-y divide-stone-700">
            {announcements.map(announcement => (
              <li key={announcement.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 gap-4">
                <div className="flex-grow">
                  <Link to={`/announcements/${announcement.id}`} className="font-bold text-stone-200 hover:text-amber-500 transition-colors">{announcement.title}</Link>
                  <p className="text-sm text-stone-500 mt-1">
                    Posted by {announcement.author?.username || 'Unknown'} on {format(new Date(announcement.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="flex gap-3 self-end sm:self-center flex-shrink-0">
                  <Link to={`/admin/announcements/edit/${announcement.id}`} className="flex items-center gap-2 text-sm px-3 py-1 rounded-md bg-stone-700 text-amber-400 hover:bg-stone-600">
                    <Edit size={14} /> Edit
                  </Link>
                  <button onClick={() => openDeleteModal(announcement.id)} className="flex items-center gap-2 text-sm px-3 py-1 rounded-md bg-red-900/50 text-red-300 hover:bg-red-900">
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </li>
            ))}
             {announcements.length === 0 && (
                <li className="p-8 text-center text-stone-500">No announcements found.</li>
            )}
          </ul>
        </div>
      </div>
    </>
  );
}
