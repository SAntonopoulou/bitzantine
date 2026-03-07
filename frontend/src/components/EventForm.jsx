import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Editor } from '@tinymce/tinymce-react';
import Notification from './Notification';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const TINYMCE_API_KEY = import.meta.env.VITE_TINYMCE_API_KEY || 'no-api-key';

export default function EventForm({ event, templates = [], users = [], groups = [], isEditing = false, isTemplate = false }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '', description: '', date: '', end_time: '', timezone: 'UTC',
    featured_image_url: '', host_user_id: '', host_group_id: '',
    min_participants: '', max_participants: '', tags: '', category: '',
    recurrence_rule: '', is_template: false, name: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: '' });

  useEffect(() => {
    if (isEditing && event) {
      setFormData({
        ...event,
        tags: event.tags?.join(', ') || '',
        date: event.date ? new Date(event.date).toISOString().slice(0, 16) : '',
        end_time: event.end_time ? new Date(event.end_time).toISOString().slice(0, 16) : '',
        host_user_id: event.host_user_id || '',
        host_group_id: event.host_group_id || '',
      });
    }
  }, [isEditing, event]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleEditorChange = (content) => {
    setFormData(prev => ({ ...prev, description: content }));
  };

  const handleImageUpload = async (file) => {
    if (!file) return null;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API_URL}/lore/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      if (res.ok) return (await res.json()).url;
    } catch (error) {
      console.error("Image upload failed", error);
    }
    return null;
  };

  const loadFromTemplate = (templateId) => {
    const template = templates.find(t => t.id === parseInt(templateId));
    if (template) {
      setFormData(prev => ({
        ...prev,
        title: template.title,
        description: template.description,
        min_participants: template.min_participants || '',
        max_participants: template.max_participants || '',
        tags: template.tags?.join(', ') || '',
        category: template.category || '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let imageUrl = formData.featured_image_url;
    if (imageFile) {
      imageUrl = await handleImageUpload(imageFile);
    }

    const payload = {
      ...formData,
      featured_image_url: imageUrl,
      date: formData.date ? new Date(formData.date).toISOString() : null,
      end_time: formData.end_time ? new Date(formData.end_time).toISOString() : null,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      min_participants: formData.min_participants ? parseInt(formData.min_participants) : null,
      max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
      host_user_id: formData.host_user_id ? parseInt(formData.host_user_id) : null,
      host_group_id: formData.host_group_id ? parseInt(formData.host_group_id) : null,
    };

    let url, method;
    if (isTemplate) {
      url = isEditing ? `${API_URL}/admin/events/templates/${event.id}` : `${API_URL}/admin/events/templates`;
      method = isEditing ? 'PUT' : 'POST';
    } else {
      url = isEditing ? `${API_URL}/admin/events/${event.id}` : `${API_URL}/admin/events`;
      method = isEditing ? 'PUT' : 'POST';
    }

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setNotification({ message: 'Success!', type: 'success' });
        setTimeout(() => navigate('/admin/events'), 2000);
      } else {
        const err = await res.json();
        setNotification({ message: `Error: ${err.detail}`, type: 'error' });
      }
    } catch (error) {
      setNotification({ message: 'An unexpected error occurred.', type: 'error' });
    }
  };

  return (
    <>
      <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification({ message: '', type: '' })} />
      <div className="p-8 max-w-4xl mx-auto text-stone-200">
        <Link to="/admin/events" className="text-amber-600 hover:underline mb-8 block">&larr; Back to Events</Link>
        <h1 className="text-3xl font-bold mb-8 text-amber-500">
          {isEditing ? `Edit ${isTemplate ? 'Template' : 'Event'}` : `Create New ${isTemplate ? 'Template' : 'Event'}`}
        </h1>
        
        {!isTemplate && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-stone-300">Load from Template</label>
            <select onChange={(e) => loadFromTemplate(e.target.value)} className="mt-1 block w-full rounded-md bg-stone-700 border-stone-600">
              <option value="">Select a template...</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-stone-800 p-8 rounded-lg">
          {isTemplate && (
            <div>
              <label className="block text-sm font-medium text-stone-300">Template Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="mt-1 block w-full rounded-md bg-stone-700 border-stone-600"/>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-stone-300">Event Title</label>
            <input type="text" name="title" value={formData.title} onChange={handleInputChange} required className="mt-1 block w-full rounded-md bg-stone-700 border-stone-600"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-300">Description</label>
            <Editor apiKey={TINYMCE_API_KEY} value={formData.description} onEditorChange={handleEditorChange} init={{ height: 300, menubar: false, skin: 'oxide-dark', content_css: 'dark', plugins: 'advlist autolink lists link image media charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table paste code help wordcount', toolbar: 'undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media | removeformat | help' }}/>
          </div>
          {!isTemplate && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-stone-300">Start Time</label>
                  <input type="datetime-local" name="date" value={formData.date} onChange={handleInputChange} required className="mt-1 block w-full rounded-md bg-stone-700 border-stone-600"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-300">End Time</label>
                  <input type="datetime-local" name="end_time" value={formData.end_time} onChange={handleInputChange} className="mt-1 block w-full rounded-md bg-stone-700 border-stone-600"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-300">Timezone</label>
                  <input type="text" name="timezone" value={formData.timezone} onChange={handleInputChange} className="mt-1 block w-full rounded-md bg-stone-700 border-stone-600"/>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-300">Recurrence</label>
                <select name="recurrence_rule" value={formData.recurrence_rule} onChange={handleInputChange} className="mt-1 block w-full rounded-md bg-stone-700 border-stone-600">
                  <option value="">No Recurrence</option>
                  <option value="FREQ=DAILY">Daily</option>
                  <option value="FREQ=WEEKLY">Weekly</option>
                  <option value="FREQ=WEEKLY;INTERVAL=2">Bi-Weekly</option>
                  <option value="FREQ=MONTHLY">Monthly</option>
                  <option value="FREQ=MONTHLY;INTERVAL=2">Bi-Monthly</option>
                  <option value="FREQ=YEARLY">Yearly</option>
                </select>
              </div>
            </>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                  <label className="block text-sm font-medium text-stone-300">Host User</label>
                  <select name="host_user_id" value={formData.host_user_id} onChange={handleInputChange} className="mt-1 block w-full rounded-md bg-stone-700 border-stone-600">
                      <option value="">Select a user...</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                  </select>
              </div>
              <div>
                  <label className="block text-sm font-medium text-stone-300">Host Group</label>
                  <select name="host_group_id" value={formData.host_group_id} onChange={handleInputChange} className="mt-1 block w-full rounded-md bg-stone-700 border-stone-600">
                      <option value="">Select a group...</option>
                      {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
              </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                  <label className="block text-sm font-medium text-stone-300">Min Participants</label>
                  <input type="number" name="min_participants" value={formData.min_participants} onChange={handleInputChange} className="mt-1 block w-full rounded-md bg-stone-700 border-stone-600"/>
              </div>
              <div>
                  <label className="block text-sm font-medium text-stone-300">Max Participants</label>
                  <input type="number" name="max_participants" value={formData.max_participants} onChange={handleInputChange} className="mt-1 block w-full rounded-md bg-stone-700 border-stone-600"/>
              </div>
          </div>
          <div>
              <label className="block text-sm font-medium text-stone-300">Featured Image</label>
              {isEditing && formData.featured_image_url && (
                <div className="mt-2">
                  <img src={`${API_URL}${formData.featured_image_url}`} alt="Current featured" className="w-full h-auto rounded-md object-cover" style={{ maxHeight: '300px' }} />
                </div>
              )}
              <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="mt-1 block w-full text-sm text-stone-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-800 file:text-amber-200 hover:file:bg-amber-700"/>
          </div>
          <div>
              <label className="block text-sm font-medium text-stone-300">Tags (comma separated)</label>
              <input type="text" name="tags" value={formData.tags} onChange={handleInputChange} className="mt-1 block w-full rounded-md bg-stone-700 border-stone-600"/>
          </div>
          <button type="submit" className="w-full bitz-btn py-3">{isEditing ? 'Update' : 'Create'}</button>
        </form>
      </div>
    </>
  );
}
