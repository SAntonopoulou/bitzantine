import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Editor } from '@tinymce/tinymce-react';
import Notification from './Notification';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const TINYMCE_API_KEY = import.meta.env.VITE_TINYMCE_API_KEY || 'no-api-key';

export default function AnnouncementForm({ announcement, isEditing = false }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState('');
  const [notification, setNotification] = useState({ message: '', type: '' });

  useEffect(() => {
    if (isEditing && announcement) {
      setTitle(announcement.title);
      setContent(announcement.content);
      setTags(announcement.tags.join(', '));
      setExistingImageUrl(announcement.image_url);
    }
  }, [isEditing, announcement]);

  const handleImageUpload = async (file) => {
    if (!file) return null;
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch(`${API_URL}/lore/upload`, { // Re-use lore upload endpoint
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

    let imageUrl = existingImageUrl;
    if (imageFile) {
      imageUrl = await handleImageUpload(imageFile);
    }

    const payload = {
      title,
      content,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      image_url: imageUrl,
    };

    const url = isEditing ? `${API_URL}/announcements/${announcement.id}` : `${API_URL}/announcements`;
    const method = isEditing ? 'PUT' : 'POST';

    // For POST, we need to build FormData since we might have a file
    let body;
    let headers = {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    };

    if (!isEditing) {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      formData.append('tags', JSON.stringify(payload.tags));
      if (imageFile) {
        formData.append('file', imageFile);
      }
      body = formData;
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(payload);
    }

    try {
      const res = await fetch(url, { method, headers, body });

      if (res.ok) {
        setNotification({ message: `Announcement ${isEditing ? 'updated' : 'created'} successfully!`, type: 'success' });
        setTimeout(() => navigate('/admin/announcements'), 2000);
      } else {
        const errorData = await res.json();
        setNotification({ message: `Failed to ${isEditing ? 'update' : 'create'} announcement: ${errorData.detail || 'Unknown error'}`, type: 'error' });
      }
    } catch (error) {
      setNotification({ message: 'An unexpected error occurred.', type: 'error' });
    }
  };

  return (
    <>
      <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification({ message: '', type: '' })} />
      <div className="p-8 max-w-4xl mx-auto text-stone-200">
        <Link to="/admin/announcements" className="text-amber-600 hover:underline mb-8 block">&larr; Back to Announcements</Link>
        <h1 className="text-3xl font-bold mb-8 text-amber-500">{isEditing ? 'Edit Announcement' : 'Create Announcement'}</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6 bg-stone-800 p-8 rounded-lg shadow-lg">
          <div>
            <label className="block text-sm font-medium text-stone-300">Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1 block w-full rounded-md bg-stone-700 border-stone-600 shadow-sm"/>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-300">Content</label>
            <Editor
              apiKey={TINYMCE_API_KEY}
              value={content}
              onEditorChange={setContent}
              init={{ height: 400, menubar: false, skin: 'oxide-dark', content_css: 'dark', plugins: 'advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table paste code help wordcount', toolbar: 'undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media | removeformat | help' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-300">Featured Image</label>
            {existingImageUrl && !imageFile && (
              <div className="mt-2 mb-4">
                <p className="text-xs text-stone-400 mb-2">Current Image:</p>
                <img src={`${API_URL}${existingImageUrl}`} alt="Current" className="w-full h-48 object-cover rounded-md" />
              </div>
            )}
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="mt-1 block w-full text-sm text-stone-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-800 file:text-amber-200 hover:file:bg-amber-700"/>
            {isEditing && <p className="text-xs text-stone-500 mt-1">Select a new file to replace the current image.</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-300">Tags (comma separated)</label>
            <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} className="mt-1 block w-full rounded-md bg-stone-700 border-stone-600 shadow-sm"/>
          </div>

          <button type="submit" className="w-full bitz-btn py-3">
            {isEditing ? 'Update Announcement' : 'Publish Announcement'}
          </button>
        </form>
      </div>
    </>
  );
}
