import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Editor } from '@tinymce/tinymce-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const TINYMCE_API_KEY = import.meta.env.VITE_TINYMCE_API_KEY || 'no-api-key';

export default function AddEra() {
  const navigate = useNavigate();
  const [eraName, setEraName] = useState('');
  const [eraDesc, setEraDesc] = useState('');
  const [eraColor, setEraColor] = useState('#FF5733');
  const [eraImage, setEraImage] = useState(null);
  const [isCurrentEra, setIsCurrentEra] = useState(false);
  const [eraStartDate, setEraStartDate] = useState('');
  const [eraEndDate, setEraEndDate] = useState('');

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
    const imageUrl = await handleImageUpload(eraImage);

    const eraData = {
      name: eraName,
      description: eraDesc,
      color_hex: eraColor,
      image_url: imageUrl,
      start_date: eraStartDate || new Date().toISOString(),
      end_date: isCurrentEra ? null : (eraEndDate || null),
      is_current_era: isCurrentEra
    };

    try {
      const res = await fetch(`${API_URL}/lore/eras`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(eraData)
      });

      if (res.ok) {
        alert('Era created successfully!');
        navigate('/admin/lore');
      } else {
        const errorData = await res.json();
        alert(`Failed to create era: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      alert("Error creating era. Check console for details.");
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto text-stone-200">
      <Link to="/admin/lore" className="text-amber-600 hover:underline mb-8 block">&larr; Back to Lore Management</Link>
      <h1 className="text-3xl font-bold mb-8 text-amber-500">Add New Era</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6 bg-stone-800 p-8 rounded-lg shadow-lg">
        <div>
          <label className="block text-sm font-medium text-stone-300">Era Name</label>
          <input 
            type="text" 
            required 
            value={eraName} 
            onChange={(e) => setEraName(e.target.value)}
            className="mt-1 block w-full rounded-md bg-stone-700 border-stone-600 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-stone-200"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-stone-300">Description</label>
          <Editor
            apiKey={TINYMCE_API_KEY}
            value={eraDesc}
            onEditorChange={(content) => setEraDesc(content)}
            init={{
              height: 200, menubar: false, skin: 'oxide-dark', content_css: 'dark',
              plugins: 'advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table paste code help wordcount',
              toolbar: 'undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media | removeformat | help'
            }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-stone-300">Theme Color</label>
            <input 
              type="color" 
              value={eraColor} 
              onChange={(e) => setEraColor(e.target.value)}
              className="mt-1 block w-full h-10 rounded-md border-stone-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-300">Start Date</label>
            <input 
              type="datetime-local" 
              value={eraStartDate} 
              onChange={(e) => setEraStartDate(e.target.value)}
              className="mt-1 block w-full rounded-md bg-stone-700 border-stone-600 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-stone-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-300">End Date</label>
            <input 
              type="datetime-local" 
              value={eraEndDate} 
              onChange={(e) => setEraEndDate(e.target.value)}
              disabled={isCurrentEra}
              className="mt-1 block w-full rounded-md bg-stone-700 border-stone-600 shadow-sm disabled:bg-stone-600 disabled:text-stone-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-300">Banner Image</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={(e) => setEraImage(e.target.files[0])}
            className="mt-1 block w-full text-sm text-stone-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-800 file:text-amber-200 hover:file:bg-amber-700"
          />
        </div>

        <div className="flex items-center">
          <input 
            type="checkbox" 
            id="isCurrent" 
            checked={isCurrentEra} 
            onChange={(e) => {
              setIsCurrentEra(e.target.checked);
              if (e.target.checked) setEraEndDate('');
            }}
            className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-stone-600 rounded"
          />
          <label htmlFor="isCurrent" className="ml-2 block text-sm text-stone-300">
            Set as Current Era
          </label>
        </div>

        <button type="submit" className="w-full bitz-btn py-3">
          Create Era
        </button>
      </form>
    </div>
  );
}
