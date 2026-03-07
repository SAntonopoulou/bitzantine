import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Editor } from '@tinymce/tinymce-react';
import Notification from '../components/Notification';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const TINYMCE_API_KEY = import.meta.env.VITE_TINYMCE_API_KEY || 'no-api-key';

export default function AddEntry() {
  const navigate = useNavigate();
  const [eras, setEras] = useState([]);
  const [entryTitle, setEntryTitle] = useState('');
  const [entryContent, setEntryContent] = useState('');
  const [entryType, setEntryType] = useState('evolving');
  const [selectedEraId, setSelectedEraId] = useState('');
  const [entryImage, setEntryImage] = useState(null);
  const [tags, setTags] = useState('');
  const [notification, setNotification] = useState({ message: '', type: '' });

  useEffect(() => {
    fetch(`${API_URL}/lore/eras`)
      .then(res => res.json())
      .then(data => setEras(data))
      .catch(err => {
        console.error("Failed to fetch eras", err);
        setNotification({ message: 'Failed to load eras.', type: 'error' });
      });
  }, []);

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
      setNotification({ message: 'Image upload failed.', type: 'error' });
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const imageUrl = await handleImageUpload(entryImage);

    const entryData = {
      title: entryTitle,
      content: entryContent,
      entry_type: entryType,
      era_id: selectedEraId ? parseInt(selectedEraId) : null,
      image_url: imageUrl,
      tags: tags.split(',').map(t => t.trim()).filter(t => t)
    };

    try {
      const res = await fetch(`${API_URL}/lore/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(entryData)
      });

      if (res.ok) {
        setNotification({ message: 'Entry created successfully!', type: 'success' });
        setTimeout(() => navigate('/admin/lore'), 2000);
      } else {
        const errorData = await res.json();
        setNotification({ message: `Failed to create entry: ${errorData.detail || 'Unknown error'}`, type: 'error' });
      }
    } catch (error) {
      setNotification({ message: "Error creating entry. Check console for details.", type: 'error' });
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto text-stone-200">
      <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification({ message: '', type: '' })} />
      <Link to="/admin/lore" className="text-amber-600 hover:underline mb-8 block">&larr; Back to Lore Management</Link>
      <h1 className="text-3xl font-bold mb-8 text-amber-500">Add New Lore Entry</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6 bg-stone-800 p-8 rounded-lg shadow-lg">
        <div>
          <label className="block text-sm font-medium text-stone-300">Title</label>
          <input 
            type="text" 
            required 
            value={entryTitle} 
            onChange={(e) => setEntryTitle(e.target.value)}
            className="mt-1 block w-full rounded-md bg-stone-700 border-stone-600 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-stone-200"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-stone-300">Type</label>
            <select 
              value={entryType} 
              onChange={(e) => setEntryType(e.target.value)}
              className="mt-1 block w-full rounded-md bg-stone-700 border-stone-600 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-stone-200"
            >
              <option value="evolving">Evolving Lore</option>
              <option value="core">Core Lore</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-300">Era</label>
            <select 
              value={selectedEraId} 
              onChange={(e) => setSelectedEraId(e.target.value)}
              required={entryType === 'evolving'}
              className="mt-1 block w-full rounded-md bg-stone-700 border-stone-600 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-stone-200"
            >
              <option value="">Select Era...</option>
              {eras.map(era => (
                <option key={era.id} value={era.id}>{era.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-300">Content</label>
          <Editor
            apiKey={TINYMCE_API_KEY}
            value={entryContent}
            onEditorChange={(content) => setEntryContent(content)}
            init={{
              height: 400, menubar: false, skin: 'oxide-dark', content_css: 'dark',
              plugins: 'advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table paste code help wordcount',
              toolbar: 'undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media | removeformat | help'
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-300">Featured Image</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={(e) => setEntryImage(e.target.files[0])}
            className="mt-1 block w-full text-sm text-stone-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-800 file:text-amber-200 hover:file:bg-amber-700"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-300">Tags (comma separated)</label>
          <input 
            type="text" 
            value={tags} 
            onChange={(e) => setTags(e.target.value)}
            placeholder="history, war, magic"
            className="mt-1 block w-full rounded-md bg-stone-700 border-stone-600 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-stone-200"
          />
        </div>

        <button type="submit" className="w-full bitz-btn py-3">
          Publish Entry
        </button>
      </form>
    </div>
  );
}
