import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Notification from '../components/Notification';
import ConfirmationModal from '../components/ConfirmationModal';
import { api } from '../api';

export default function AdminEvents() {
  const [view, setView] = useState('events'); // 'events' or 'templates'
  const [events, setEvents] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eventsRes, templatesRes] = await Promise.all([
        api.get('/events?limit=999'),
        api.get('/admin/events/templates')
      ]);
      setEvents(eventsRes.data);
      setTemplates(templatesRes.data);
    } catch (error) {
      console.error("Failed to fetch event data", error);
      setNotification({ message: 'Failed to fetch data.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openDeleteModal = (id, type) => {
    setItemToDelete({ id, type });
    setModalOpen(true);
  };

  const closeDeleteModal = () => {
    setItemToDelete(null);
    setModalOpen(false);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    const { id, type } = itemToDelete;

    const url = type === 'event' ? `/admin/events/${id}` : `/admin/events/templates/${id}`;
    
    try {
      await api.delete(url);
      setNotification({ message: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully.`, type: 'success' });
      fetchData(); // Refresh data
    } catch (error) {
      setNotification({ message: `Error: ${error.response?.data?.detail || 'An unexpected error occurred.'}`, type: 'error' });
    } finally {
      closeDeleteModal();
    }
  };

  if (loading) return <div className="p-8 text-center text-stone-400">Loading...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification({ message: '', type: '' })} />
      <ConfirmationModal
        isOpen={modalOpen}
        message={`Are you sure you want to delete this ${itemToDelete?.type}? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={closeDeleteModal}
      />
      <h1 className="text-4xl font-bold text-amber-500 mb-8">Manage Events</h1>
      <div className="flex gap-4 mb-8 border-b border-stone-700">
        <button onClick={() => setView('events')} className={`pb-2 px-4 font-medium ${view === 'events' ? 'border-b-2 border-amber-500 text-amber-500' : 'text-stone-400'}`}>Events</button>
        <button onClick={() => setView('templates')} className={`pb-2 px-4 font-medium ${view === 'templates' ? 'border-b-2 border-amber-500 text-amber-500' : 'text-stone-400'}`}>Templates</button>
      </div>

      {view === 'events' ? (
        <div>
          <div className="flex justify-end mb-6">
            <Link to="/admin/events/add" className="bitz-btn">Create New Event</Link>
          </div>
          <div className="bg-stone-800 shadow-lg rounded-lg p-6">
            <ul className="space-y-4">
              {events.map(event => (
                <li key={event.id} className="flex justify-between items-center p-4 bg-stone-900 rounded-md">
                  <div>
                    <p className="font-bold text-stone-200">{event.title}</p>
                    <p className="text-sm text-stone-500">{new Date(event.date).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-4">
                    <Link to={`/admin/events/edit/${event.id}`} className="text-amber-500 hover:underline">Edit</Link>
                    <button onClick={() => openDeleteModal(event.id, 'event')} className="text-red-500 hover:underline">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex justify-end mb-6">
            <Link to="/admin/events/templates/add" className="bitz-btn">Create New Template</Link>
          </div>
          <div className="bg-stone-800 shadow-lg rounded-lg p-6">
            <ul className="space-y-4">
              {templates.map(template => (
                <li key={template.id} className="flex justify-between items-center p-4 bg-stone-900 rounded-md">
                  <p className="font-bold text-stone-200">{template.name}</p>
                  <div className="flex gap-4">
                    <Link to={`/admin/events/templates/edit/${template.id}`} className="text-amber-500 hover:underline">Edit</Link>
                    <button onClick={() => openDeleteModal(template.id, 'template')} className="text-red-500 hover:underline">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
