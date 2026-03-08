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
      // Ensure sections are sorted by order_index initially
      const sortedSections = response.data.sort((a, b) => a.order_index - b.order_index);
      setSections(sortedSections);
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
      // Ensure order_index is correctly set before saving
      const sectionsToSave = sections.map((section, index) => ({
        ...section,
        order_index: index + 1,
      }));
      await api.put('/admin/home/sections', sectionsToSave);
      setMessage({ type: 'success', text: 'Homepage updated successfully!' });
      // Refetch to ensure data consistency, especially order
      fetchSections();
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
    setSections(newSections);
  };

  if (loading) return <div className="p-4 sm:p-8 text-amber-500 text-center">Loading editor...</div>;

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto bg-stone-900 min-h-screen text-stone-200">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 border-b border-stone-700 pb-4 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-amber-500">Homepage CMS</h1>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className={`w-full sm:w-auto px-6 py-2 rounded font-bold ${saving ? 'bg-stone-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} text-white transition-colors`}
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
          <div key={section.id} className="bg-stone-800 p-4 sm:p-6 rounded-lg border border-stone-700 shadow-lg relative">
            <div className="absolute top-4 right-4 flex gap-2">
              <button 
                onClick={() => moveSection(index, 'up')} 
                disabled={index === 0}
                className="p-2 bg-stone-700 hover:bg-stone-600 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Move up"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l5 5a1 1 0 01-1.414 1.414L11 6.414V16a1 1 0 11-2 0V6.414L5.707 9.707a1 1 0 01-1.414-1.414l5-5A1 1 0 0110 3z" clipRule="evenodd" /></svg>
              </button>
              <button 
                onClick={() => moveSection(index, 'down')} 
                disabled={index === sections.length - 1}
                className="p-2 bg-stone-700 hover:bg-stone-600 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Move down"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 17a1 1 0 01-.707-.293l-5-5a1 1 0 011.414-1.414L9 13.586V4a1 1 0 112 0v9.586l3.293-3.293a1 1 0 111.414 1.414l-5 5A1 1 0 0110 17z" clipRule="evenodd" /></svg>
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
                  <div className="flex flex-col gap-2">
                    {section.image_url && (
                      <img src={section.image_url} alt="Preview" className="w-full h-32 object-cover rounded border border-stone-600 bg-stone-900" />
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
      
      {/* Sticky Save Button for Mobile */}
      <div className="sm:hidden h-20"></div> {/* Spacer */}
      <div className="fixed bottom-0 left-0 right-0 bg-stone-800 p-4 border-t border-stone-700 sm:hidden">
        <button 
          onClick={handleSave} 
          disabled={saving}
          className={`w-full px-6 py-3 rounded font-bold ${saving ? 'bg-stone-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} text-white transition-colors`}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
