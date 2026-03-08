import { useState, useEffect } from 'react';
import { api } from '../../api';

export default function HomeEditor() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const response = await api.get('/admin/home/all');
      setSections(response.data);
    } catch (error) {
      console.error("Failed to fetch sections:", error);
      setMessage({ type: 'error', text: 'Failed to load sections.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (id, field, value) => {
    setSections(prev => prev.map(section => 
      section.id === id ? { ...section, [field]: value } : section
    ));
  };

  const handleImageUpload = async (id, file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/admin/home/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      handleInputChange(id, 'image_url', response.data.url);
    } catch (error) {
      console.error("Image upload failed:", error);
      setMessage({ type: 'error', text: 'Image upload failed.' });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await api.put('/admin/home/sections', sections);
      setMessage({ type: 'success', text: 'Homepage updated successfully!' });
    } catch (error) {
      console.error("Failed to save sections:", error);
      setMessage({ type: 'error', text: 'Failed to save changes.' });
    } finally {
      setSaving(false);
    }
  };

  const moveSection = (index, direction) => {
    const newSections = [...sections];
    if (direction === 'up' && index > 0) {
      [newSections[index], newSections[index - 1]] = [newSections[index - 1], newSections[index]];
    } else if (direction === 'down' && index < newSections.length - 1) {
      [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
    }
    
    // Reassign order_index based on new array position
    const reordered = newSections.map((s, i) => ({ ...s, order_index: i + 1 }));
    setSections(reordered);
  };

  if (loading) return <div className="p-8 text-amber-500">Loading editor...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto bg-stone-900 min-h-screen text-stone-200">
      <div className="flex justify-between items-center mb-8 border-b border-stone-700 pb-4">
        <h1 className="text-3xl font-bold text-amber-500">Homepage CMS</h1>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className={`px-6 py-2 rounded font-bold ${saving ? 'bg-stone-600' : 'bg-green-600 hover:bg-green-700'} text-white transition-colors`}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {message && (
        <div className={`p-4 mb-6 rounded ${message.type === 'success' ? 'bg-green-900/50 text-green-200 border border-green-700' : 'bg-red-900/50 text-red-200 border border-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="space-y-8">
        {sections.map((section, index) => (
          <div key={section.id} className="bg-stone-800 p-6 rounded-lg border border-stone-700 shadow-lg relative">
            <div className="absolute top-4 right-4 flex gap-2">
              <button 
                onClick={() => moveSection(index, 'up')} 
                disabled={index === 0}
                className="p-2 bg-stone-700 hover:bg-stone-600 rounded disabled:opacity-30"
              >
                ⬆️
              </button>
              <button 
                onClick={() => moveSection(index, 'down')} 
                disabled={index === sections.length - 1}
                className="p-2 bg-stone-700 hover:bg-stone-600 rounded disabled:opacity-30"
              >
                ⬇️
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <span className="bg-amber-900/50 text-amber-500 px-3 py-1 rounded text-sm font-mono border border-amber-900">
                {section.section_key}
              </span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={section.is_visible} 
                  onChange={(e) => handleInputChange(section.id, 'is_visible', e.target.checked)}
                  className="w-4 h-4 accent-amber-600"
                />
                <span className="text-sm text-stone-400">Visible</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-stone-400 mb-1">Title</label>
                  <input 
                    type="text" 
                    value={section.title} 
                    onChange={(e) => handleInputChange(section.id, 'title', e.target.value)}
                    className="w-full bg-stone-900 border border-stone-600 rounded p-2 text-stone-200 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-stone-400 mb-1">Subtitle</label>
                  <input 
                    type="text" 
                    value={section.subtitle || ''} 
                    onChange={(e) => handleInputChange(section.id, 'subtitle', e.target.value)}
                    className="w-full bg-stone-900 border border-stone-600 rounded p-2 text-stone-200 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-stone-400 mb-1">Content</label>
                  <textarea 
                    rows="5"
                    value={section.content} 
                    onChange={(e) => handleInputChange(section.id, 'content', e.target.value)}
                    className="w-full bg-stone-900 border border-stone-600 rounded p-2 text-stone-200 focus:border-amber-500 focus:outline-none font-sans"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-stone-400 mb-1">Image</label>
                  <div className="flex gap-4 items-start">
                    {section.image_url && (
                      <img src={section.image_url} alt="Preview" className="w-32 h-20 object-cover rounded border border-stone-600 bg-stone-900" />
                    )}
                    <div className="flex-1">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => e.target.files[0] && handleImageUpload(section.id, e.target.files[0])}
                        className="block w-full text-sm text-stone-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-stone-700 file:text-amber-500 hover:file:bg-stone-600"
                      />
                      <input 
                        type="text" 
                        placeholder="Or enter image URL..."
                        value={section.image_url || ''}
                        onChange={(e) => handleInputChange(section.id, 'image_url', e.target.value)}
                        className="mt-2 w-full bg-stone-900 border border-stone-600 rounded p-2 text-xs text-stone-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-stone-400 mb-1">CTA Text</label>
                    <input 
                      type="text" 
                      value={section.cta_text || ''} 
                      onChange={(e) => handleInputChange(section.id, 'cta_text', e.target.value)}
                      className="w-full bg-stone-900 border border-stone-600 rounded p-2 text-stone-200 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-stone-400 mb-1">CTA Link</label>
                    <input 
                      type="text" 
                      value={section.cta_link || ''} 
                      onChange={(e) => handleInputChange(section.id, 'cta_link', e.target.value)}
                      className="w-full bg-stone-900 border border-stone-600 rounded p-2 text-stone-200 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
