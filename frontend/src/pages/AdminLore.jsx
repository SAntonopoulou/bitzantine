import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Editor } from '@tinymce/tinymce-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const TINYMCE_API_KEY = import.meta.env.VITE_TINYMCE_API_KEY || 'no-api-key';

export default function AdminLore() {
  const { user } = useAuth();
  const [eras, setEras] = useState([]);
  const [activeTab, setActiveTab] = useState('entry'); // 'entry' or 'era'
  
  // Era Form State
  const [eraName, setEraName] = useState('');
  const [eraDesc, setEraDesc] = useState('');
  const [eraColor, setEraColor] = useState('#000000');
  const [eraImage, setEraImage] = useState(null);
  const [isCurrentEra, setIsCurrentEra] = useState(false);
  const [eraStartDate, setEraStartDate] = useState('');
  const [eraEndDate, setEraEndDate] = useState('');

  // Entry Form State
  const [entryTitle, setEntryTitle] = useState('');
  const [entryContent, setEntryContent] = useState('');
  const [entryType, setEntryType] = useState('core');
  const [selectedEraId, setSelectedEraId] = useState('');
  const [entryImage, setEntryImage] = useState(null);
  const [tags, setTags] = useState('');

  useEffect(() => {
    fetchEras();
  }, []);

  const fetchEras = async () => {
    try {
      const res = await fetch(`${API_URL}/lore/eras`);
      if (res.ok) {
        const data = await res.json();
        setEras(data);
      }
    } catch (error) {
      console.error("Failed to fetch eras", error);
    }
  };

  const handleImageUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch(`${API_URL}/lore/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      if (res.ok) {
        const data = await res.json();
        return data.url;
      }
    } catch (error) {
      console.error("Image upload failed", error);
    }
    return null;
  };

  const handleEraSubmit = async (e) => {
    e.preventDefault();
    let imageUrl = null;
    
    if (eraImage) {
      imageUrl = await handleImageUpload(eraImage);
    }

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
        setEraName('');
        setEraDesc('');
        setEraColor('#000000');
        setEraImage(null);
        setIsCurrentEra(false);
        setEraStartDate('');
        setEraEndDate('');
        fetchEras();
      } else {
        const errorData = await res.json();
        alert(`Failed to create era: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error creating era", error);
      alert("Error creating era. Check console for details.");
    }
  };

  const handleEntrySubmit = async (e) => {
    e.preventDefault();
    let imageUrl = null;
    
    if (entryImage) {
      imageUrl = await handleImageUpload(entryImage);
    }

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
        alert('Lore entry created successfully!');
        setEntryTitle('');
        setEntryContent('');
        setEntryType('core');
        setSelectedEraId('');
        setEntryImage(null);
        setTags('');
      } else {
        const error = await res.json();
        alert(`Failed to create entry: ${error.detail}`);
      }
    } catch (error) {
      console.error("Error creating entry", error);
    }
  };

  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return <div className="p-8 text-center text-red-600">Access Denied</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Lore Management</h1>
      
      <div className="flex gap-4 mb-8 border-b border-gray-200">
        <button 
          className={`pb-2 px-4 font-medium ${activeTab === 'entry' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('entry')}
        >
          Create Entry
        </button>
        <button 
          className={`pb-2 px-4 font-medium ${activeTab === 'era' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('era')}
        >
          Create Era
        </button>
      </div>

      {activeTab === 'era' ? (
        <form onSubmit={handleEraSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
          <div>
            <label className="block text-sm font-medium text-gray-700">Era Name</label>
            <input 
              type="text" 
              required 
              value={eraName} 
              onChange={(e) => setEraName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <Editor
              apiKey={TINYMCE_API_KEY}
              value={eraDesc}
              onEditorChange={(content) => setEraDesc(content)}
              init={{
                height: 200,
                menubar: false,
                plugins: [
                  'advlist autolink lists link image charmap print preview anchor',
                  'searchreplace visualblocks code fullscreen',
                  'insertdatetime media table paste code help wordcount'
                ],
                toolbar:
                  'undo redo | formatselect | bold italic backcolor | \
                  alignleft aligncenter alignright alignjustify | \
                  bullist numlist outdent indent | link image media | removeformat | help'
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Theme Color</label>
              <input 
                type="color" 
                value={eraColor} 
                onChange={(e) => setEraColor(e.target.value)}
                className="mt-1 block w-full h-10 rounded-md border-gray-300 shadow-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input 
                type="datetime-local" 
                value={eraStartDate} 
                onChange={(e) => setEraStartDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input 
                type="datetime-local" 
                value={eraEndDate} 
                onChange={(e) => setEraEndDate(e.target.value)}
                disabled={isCurrentEra}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 disabled:bg-gray-100 disabled:text-gray-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Banner Image</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => setEraImage(e.target.files[0])}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
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
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isCurrent" className="ml-2 block text-sm text-gray-900">
              Set as Current Era (Ends previous era automatically, disables End Date)
            </label>
          </div>

          <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Create Era
          </button>
        </form>
      ) : (
        <form onSubmit={handleEntrySubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input 
              type="text" 
              required 
              value={entryTitle} 
              onChange={(e) => setEntryTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select 
                value={entryType} 
                onChange={(e) => setEntryType(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
              >
                <option value="core">Core Lore</option>
                <option value="evolving">Evolving Lore</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Era</label>
              <select 
                value={selectedEraId} 
                onChange={(e) => setSelectedEraId(e.target.value)}
                required={entryType === 'evolving'}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
              >
                <option value="">Select Era...</option>
                {eras.map(era => (
                  <option key={era.id} value={era.id}>{era.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Content</label>
            <Editor
              apiKey={TINYMCE_API_KEY}
              value={entryContent}
              onEditorChange={(content) => setEntryContent(content)}
              init={{
                height: 400,
                menubar: false,
                plugins: [
                  'advlist autolink lists link image charmap print preview anchor',
                  'searchreplace visualblocks code fullscreen',
                  'insertdatetime media table paste code help wordcount'
                ],
                toolbar:
                  'undo redo | formatselect | bold italic backcolor | \
                  alignleft aligncenter alignright alignjustify | \
                  bullist numlist outdent indent | link image media | removeformat | help'
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Featured Image</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => setEntryImage(e.target.files[0])}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Tags (comma separated)</label>
            <input 
              type="text" 
              value={tags} 
              onChange={(e) => setTags(e.target.value)}
              placeholder="history, war, magic"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
            />
          </div>

          <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Publish Entry
          </button>
        </form>
      )}
    </div>
  );
}
