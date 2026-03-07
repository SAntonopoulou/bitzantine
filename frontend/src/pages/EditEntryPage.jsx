import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Editor } from '@tinymce/tinymce-react';
import ConfirmationModal from '../components/ConfirmationModal';
import Notification from '../components/Notification';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const TINYMCE_API_KEY = import.meta.env.VITE_TINYMCE_API_KEY || 'no-api-key';

export default function EditEntryPage() {
  const { entryId } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState(null);
  const [eras, setEras] = useState([]);
  const [newImageFile, setNewImageFile] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [entryRes, erasRes] = await Promise.all([
          fetch(`${API_URL}/lore/entries/${entryId}`),
          fetch(`${API_URL}/lore/eras`)
        ]);
        const entryData = await entryRes.json();
        const erasData = await erasRes.json();
        
        if (entryData.tags && Array.isArray(entryData.tags)) {
          entryData.tags = entryData.tags.join(', ');
        }
        
        setEntry(entryData);
        setEras(erasData);
      } catch (error) {
        console.error("Failed to fetch data for editing", error);
      }
    };
    fetchData();
  }, [entryId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEntry(prev => ({ ...prev, [name]: value }));
  };

  const handleEditorChange = (content) => {
    setEntry(prev => ({ ...prev, content: content }));
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

    let imageUrl = entry.image_url;
    if (newImageFile) {
      imageUrl = await handleImageUpload(newImageFile);
    }

    const entryUpdateData = {
      title: entry.title,
      content: entry.content,
      entry_type: entry.entry_type,
      image_url: imageUrl,
      era_id: entry.era_id ? parseInt(entry.era_id, 10) : null,
      tags: typeof entry.tags === 'string' ? entry.tags.split(',').map(t => t.trim()).filter(t => t) : [],
    };

    try {
      const res = await fetch(`${API_URL}/lore/entries/${entryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(entryUpdateData)
      });

      if (res.ok) {
        setNotification({ message: 'Entry updated successfully!', type: 'success' });
        setTimeout(() => navigate('/admin/lore'), 2000);
      } else {
        const errorData = await res.json();
        setNotification({ message: `Failed to update entry: ${errorData.detail || 'Unknown error'}`, type: 'error' });
      }
    } catch (error) {
      setNotification({ message: 'An unexpected error occurred.', type: 'error' });
    }
  };

  const handleDelete = async () => {
    setIsModalOpen(false);
    try {
      const res = await fetch(`${API_URL}/lore/entries/${entryId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });

      if (res.ok) {
        setNotification({ message: 'Entry deleted successfully!', type: 'success' });
        setTimeout(() => navigate('/admin/lore'), 2000);
      } else {
        const errorData = await res.json();
        setNotification({ message: `Failed to delete entry: ${errorData.detail || 'Unknown error'}`, type: 'error' });
      }
    } catch (error) {
      setNotification({ message: 'An unexpected error occurred.', type: 'error' });
    }
  };

  if (!entry) return <div className="p-8 text-center text-stone-400">Loading...</div>;

  return (
    <>
      <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification({ message: '', type: '' })} />
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Entry"
      >
        Are you sure you want to permanently delete this lore entry? This action is irreversible.
      </ConfirmationModal>

      <div className="p-8 max-w-4xl mx-auto text-stone-200">
        <Link to="/admin/lore" className="text-amber-600 hover:underline mb-8 block">&larr; Back to Lore Management</Link>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-amber-500">Edit Entry: {entry.title}</h1>
          <button onClick={() => setIsModalOpen(true)} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition">
            Delete Entry
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-stone-800 p-8 rounded-lg shadow-lg">
          {/* Form fields remain the same */}
          <div>
            <label className="block text-sm font-medium text-stone-300">Title</label>
            <input type="text" required name="title" value={entry.title} onChange={handleInputChange} className="mt-1 block w-full rounded-md bg-stone-700 border-stone-600 shadow-sm"/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-stone-300">Type</label>
              <select name="entry_type" value={entry.entry_type} onChange={handleInputChange} className="mt-1 block w-full rounded-md bg-stone-700 border-stone-600 shadow-sm">
                <option value="evolving">Evolving Lore</option>
                <option value="core">Core Lore</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-300">Era</label>
              <select name="era_id" value={entry.era_id || ''} onChange={handleInputChange} required={entry.entry_type === 'evolving'} className="mt-1 block w-full rounded-md bg-stone-700 border-stone-600 shadow-sm">
                <option value="">Select Era...</option>
                {eras.map(era => (<option key={era.id} value={era.id}>{era.name}</option>))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-300">Content</label>
            <Editor apiKey={TINYMCE_API_KEY} value={entry.content} onEditorChange={handleEditorChange} init={{ height: 400, menubar: false, skin: 'oxide-dark', content_css: 'dark', plugins: 'advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table paste code help wordcount', toolbar: 'undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media | removeformat | help' }}/>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-300">Featured Image</label>
            {entry.image_url && !newImageFile && (
              <div className="mt-2 mb-4">
                <p className="text-xs text-stone-400 mb-2">Current Image:</p>
                <img src={`${API_URL}${entry.image_url}`} alt="Current featured" className="w-full h-64 object-cover rounded-md" />
              </div>
            )}
            <input type="file" accept="image/*" onChange={(e) => setNewImageFile(e.target.files[0])} className="mt-1 block w-full text-sm text-stone-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-800 file:text-amber-200 hover:file:bg-amber-700"/>
            <p className="text-xs text-stone-500 mt-1">Select a new file to replace the current image.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-300">Tags (comma separated)</label>
            <input type="text" name="tags" value={entry.tags} onChange={handleInputChange} className="mt-1 block w-full rounded-md bg-stone-700 border-stone-600 shadow-sm"/>
          </div>
          <button type="submit" className="w-full bitz-btn py-3">
            Update Entry
          </button>
        </form>
      </div>
    </>
  );
}
