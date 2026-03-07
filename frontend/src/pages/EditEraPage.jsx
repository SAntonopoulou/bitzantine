import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Editor } from '@tinymce/tinymce-react';
import ConfirmationModal from '../components/ConfirmationModal';
import Notification from '../components/Notification';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const TINYMCE_API_KEY = import.meta.env.VITE_TINYMCE_API_KEY || 'no-api-key';

export default function EditEraPage() {
  const { eraId } = useParams();
  const navigate = useNavigate();
  const [era, setEra] = useState(null);
  const [newImageFile, setNewImageFile] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });

  useEffect(() => {
    fetch(`${API_URL}/lore/eras/${eraId}`)
      .then(res => res.json())
      .then(data => {
        if (data.start_date) data.start_date = new Date(data.start_date).toISOString().slice(0, 16);
        if (data.end_date) data.end_date = new Date(data.end_date).toISOString().slice(0, 16);
        setEra(data);
      })
      .catch(err => console.error("Failed to fetch era data", err));
  }, [eraId]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEra(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleEditorChange = (content) => {
    setEra(prev => ({ ...prev, description: content }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let imageUrl = era.image_url;
    if (newImageFile) {
      imageUrl = await handleImageUpload(newImageFile);
    }

    const eraUpdateData = {
      name: era.name,
      description: era.description,
      color_hex: era.color_hex,
      image_url: imageUrl,
      start_date: era.start_date ? new Date(era.start_date) : null,
      end_date: era.end_date ? new Date(era.end_date) : null,
      is_current_era: era.is_current_era,
    };

    try {
      const res = await fetch(`${API_URL}/lore/eras/${eraId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(eraUpdateData)
      });

      if (res.ok) {
        setNotification({ message: 'Era updated successfully!', type: 'success' });
        setTimeout(() => navigate('/admin/lore'), 2000);
      } else {
        const errorData = await res.json();
        setNotification({ message: `Failed to update era: ${errorData.detail || 'Unknown error'}`, type: 'error' });
      }
    } catch (error) {
      setNotification({ message: 'An unexpected error occurred.', type: 'error' });
    }
  };

  const handleDelete = async () => {
    setIsModalOpen(false);
    try {
      const res = await fetch(`${API_URL}/lore/eras/${eraId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });

      if (res.ok) {
        setNotification({ message: 'Era and all its entries deleted!', type: 'success' });
        setTimeout(() => navigate('/admin/lore'), 2000);
      } else {
        const errorData = await res.json();
        setNotification({ message: `Failed to delete era: ${errorData.detail || 'Unknown error'}`, type: 'error' });
      }
    } catch (error) {
      setNotification({ message: 'An unexpected error occurred.', type: 'error' });
    }
  };

  if (!era) return <div className="p-8 text-center text-stone-400">Loading...</div>;

  return (
    <>
      <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification({ message: '', type: '' })} />
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Era"
      >
        Are you sure you want to delete this era? <strong>This action is irreversible and will also delete all lore entries within this era.</strong>
      </ConfirmationModal>

      <div className="p-8 max-w-4xl mx-auto text-stone-200">
        <Link to="/admin/lore" className="text-amber-600 hover:underline mb-8 block">&larr; Back to Lore Management</Link>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-amber-500">Edit Era: {era.name}</h1>
          <button onClick={() => setIsModalOpen(true)} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition">
            Delete Era
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6 bg-stone-800 p-8 rounded-lg shadow-lg">
          {/* Form fields remain the same */}
          <div>
            <label className="block text-sm font-medium text-stone-300">Era Name</label>
            <input type="text" required name="name" value={era.name} onChange={handleInputChange} className="mt-1 block w-full rounded-md bg-stone-700 border-stone-600 shadow-sm"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-300">Description</label>
            <Editor apiKey={TINYMCE_API_KEY} value={era.description} onEditorChange={handleEditorChange} init={{ height: 200, menubar: false, skin: 'oxide-dark', content_css: 'dark', plugins: 'advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table paste code help wordcount', toolbar: 'undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media | removeformat | help' }}/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-stone-300">Theme Color</label>
              <input type="color" name="color_hex" value={era.color_hex} onChange={handleInputChange} className="mt-1 block w-full h-10 rounded-md border-stone-600"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-300">Start Date</label>
              <input type="datetime-local" name="start_date" value={era.start_date} onChange={handleInputChange} className="mt-1 block w-full rounded-md bg-stone-700 border-stone-600 shadow-sm"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-300">End Date</label>
              <input type="datetime-local" name="end_date" value={era.end_date || ''} onChange={handleInputChange} disabled={era.is_current_era} className="mt-1 block w-full rounded-md bg-stone-700 border-stone-600 shadow-sm disabled:bg-stone-600"/>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-300">Banner Image</label>
            {era.image_url && !newImageFile && (
              <div className="mt-2 mb-4">
                <p className="text-xs text-stone-400 mb-2">Current Image:</p>
                <img src={`${API_URL}${era.image_url}`} alt="Current banner" className="w-full h-48 object-cover rounded-md" />
              </div>
            )}
            <input type="file" accept="image/*" onChange={(e) => setNewImageFile(e.target.files[0])} className="mt-1 block w-full text-sm text-stone-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-800 file:text-amber-200 hover:file:bg-amber-700"/>
            <p className="text-xs text-stone-500 mt-1">Select a new file to replace the current image.</p>
          </div>
          <div className="flex items-center">
            <input type="checkbox" id="isCurrent" name="is_current_era" checked={era.is_current_era} onChange={handleInputChange} className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-stone-600 rounded"/>
            <label htmlFor="isCurrent" className="ml-2 block text-sm text-stone-300">Is Current Era</label>
          </div>
          <button type="submit" className="w-full bitz-btn py-3">
            Update Era
          </button>
        </form>
      </div>
    </>
  );
}
