import { useState, useEffect } from 'react';
import { api, API_URL } from '../../api';
import { useNotification } from '../../context/NotificationContext';

export default function HomeEditor() {
  const [sections, setSections] = useState([]);
  const [siteSettings, setSiteSettings] = useState({ site_name: '', site_logo: '' });
  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showNotification } = useNotification();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sectionsRes, settingsRes] = await Promise.all([
        api.get('/admin/home/all'),
        api.get('/admin/site-settings')
      ]);
      const sortedSections = sectionsRes.data.sort((a, b) => a.order_index - b.order_index);
      setSections(sortedSections);
      setSiteSettings(settingsRes.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      showNotification('Failed to load editor data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSectionInputChange = (id, field, value) => {
    setSections(prev => prev.map(section => 
      section.id === id ? { ...section, [field]: value } : section
    ));
  };
  
  const handleSettingInputChange = (key, value) => {
    setSiteSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = async (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await api.post('/admin/home/image', formData);
      handleSectionInputChange(id, 'image_url', response.data.url);
    } catch (error) {
      showNotification('Image upload failed.', 'error');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save homepage sections
      const sectionsToSave = sections.map((s, i) => ({ ...s, order_index: i + 1 }));
      await api.put('/admin/home/sections', sectionsToSave);

      // Save site settings
      await api.post(`/admin/site-settings/site_name?site_name=${encodeURIComponent(siteSettings.site_name)}`);
      
      if (logoFile) {
        const logoFormData = new FormData();
        logoFormData.append('file', logoFile);
        await api.post('/admin/site-settings/logo', logoFormData);
      }

      showNotification('Changes saved successfully!', 'success');
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Failed to save changes:", error);
      showNotification('Failed to save changes.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const moveSection = (index, direction) => {
    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newSections.length) {
      [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
      setSections(newSections);
    }
  };

  if (loading) return <div className="p-4 sm:p-8 text-amber-500 text-center">Loading editor...</div>;

  const inputStyles = "w-full bg-stone-900 border border-stone-600 rounded p-2 text-stone-200 focus:border-amber-500 focus:outline-none";

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto bg-stone-900 min-h-screen text-stone-200">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 border-b border-stone-700 pb-4 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-amber-500">Homepage & Site Editor</h1>
        <button onClick={handleSave} disabled={saving} className={`w-full sm:w-auto px-6 py-2 rounded font-bold ${saving ? 'bg-stone-600' : 'bg-green-600 hover:bg-green-700'} text-white transition-colors`}>
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      {/* Site Branding Section */}
      <div className="bg-stone-800 p-4 sm:p-6 rounded-lg border border-amber-800/50 shadow-lg mb-8">
        <h2 className="text-xl font-bold text-amber-400 mb-4">Site Branding</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-stone-400 mb-1">Site Name</label>
            <input type="text" value={siteSettings.site_name} onChange={(e) => handleSettingInputChange('site_name', e.target.value)} className={inputStyles} />
            <p className="text-xs text-stone-500 mt-1">Used if no logo is uploaded.</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-stone-400 mb-1">Site Logo</label>
            {siteSettings.site_logo && !logoFile && <img src={`${API_URL}${siteSettings.site_logo}`} alt="Logo Preview" className="h-12 w-auto bg-stone-700 p-1 rounded mb-2" />}
            <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files[0])} className="block w-full text-sm text-stone-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-stone-700 file:text-amber-500 hover:file:bg-stone-600" />
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <h2 className="text-xl font-bold text-stone-300 mt-12">Homepage Sections</h2>
        {sections.map((section, index) => (
          <div key={section.id} className="bg-stone-800 p-4 sm:p-6 rounded-lg border border-stone-700 shadow-lg relative">
            <div className="absolute top-4 right-4 flex gap-2">
              <button onClick={() => moveSection(index, 'up')} disabled={index === 0} className="p-2 bg-stone-700 hover:bg-stone-600 rounded disabled:opacity-30"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l5 5a1 1 0 01-1.414 1.414L11 6.414V16a1 1 0 11-2 0V6.414L5.707 9.707a1 1 0 01-1.414-1.414l5-5A1 1 0 0110 3z" clipRule="evenodd" /></svg></button>
              <button onClick={() => moveSection(index, 'down')} disabled={index === sections.length - 1} className="p-2 bg-stone-700 hover:bg-stone-600 rounded disabled:opacity-30"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 17a1 1 0 01-.707-.293l-5-5a1 1 0 011.414-1.414L9 13.586V4a1 1 0 112 0v9.586l3.293-3.293a1 1 0 111.414 1.414l-5 5A1 1 0 0110 17z" clipRule="evenodd" /></svg></button>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <span className="bg-amber-900/50 text-amber-500 px-3 py-1 rounded text-sm font-mono border border-amber-900">{section.section_key}</span>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={section.is_visible} onChange={(e) => handleSectionInputChange(section.id, 'is_visible', e.target.checked)} className="w-4 h-4 accent-amber-600" /><span className="text-sm text-stone-400">Visible</span></label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div><label className="block text-sm font-bold text-stone-400 mb-1">Title</label><input type="text" value={section.title} onChange={(e) => handleSectionInputChange(section.id, 'title', e.target.value)} className={inputStyles} /></div>
                <div><label className="block text-sm font-bold text-stone-400 mb-1">Subtitle</label><input type="text" value={section.subtitle || ''} onChange={(e) => handleSectionInputChange(section.id, 'subtitle', e.target.value)} className={inputStyles} /></div>
                <div><label className="block text-sm font-bold text-stone-400 mb-1">Content</label><textarea rows="5" value={section.content} onChange={(e) => handleSectionInputChange(section.id, 'content', e.target.value)} className={`${inputStyles} font-sans`} /></div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-stone-400 mb-1">Image</label>
                  <div className="flex flex-col gap-2">
                    {section.image_url && <img src={section.image_url} alt="Preview" className="w-full h-32 object-cover rounded border border-stone-600 bg-stone-900" />}
                    <div className="flex-1">
                      <input type="file" accept="image/*" onChange={(e) => e.target.files[0] && handleImageUpload(section.id, e.target.files[0])} className="block w-full text-sm text-stone-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-stone-700 file:text-amber-500 hover:file:bg-stone-600" />
                      <input type="text" placeholder="Or enter image URL..." value={section.image_url || ''} onChange={(e) => handleSectionInputChange(section.id, 'image_url', e.target.value)} className="mt-2 w-full bg-stone-900 border border-stone-600 rounded p-2 text-xs text-stone-400" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-bold text-stone-400 mb-1">CTA Text</label><input type="text" value={section.cta_text || ''} onChange={(e) => handleSectionInputChange(section.id, 'cta_text', e.target.value)} className={inputStyles} /></div>
                  <div><label className="block text-sm font-bold text-stone-400 mb-1">CTA Link</label><input type="text" value={section.cta_link || ''} onChange={(e) => handleSectionInputChange(section.id, 'cta_link', e.target.value)} className={inputStyles} /></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="sm:hidden h-20"></div>
      <div className="fixed bottom-0 left-0 right-0 bg-stone-800 p-4 border-t border-stone-700 sm:hidden">
        <button onClick={handleSave} disabled={saving} className={`w-full px-6 py-3 rounded font-bold ${saving ? 'bg-stone-600' : 'bg-green-600 hover:bg-green-700'} text-white transition-colors`}>
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
}
