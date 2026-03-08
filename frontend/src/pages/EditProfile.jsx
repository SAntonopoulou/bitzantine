import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, API_URL } from '../api';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { 
  Save, 
  X, 
  Upload, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2,
  Shield,
  Globe,
  Lock,
  Users,
  User as UserIcon
} from 'lucide-react';

function getCroppedImg(image, crop, fileName) {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob(blob => {
      if (!blob) {
        console.error('Canvas is empty');
        return;
      }
      blob.name = fileName;
      resolve(blob);
    }, 'image/jpeg');
  });
}

const PrivacySelector = ({ label, value, onChange }) => {
  const options = [
    { id: 'public', label: 'Public', icon: Globe, color: 'text-green-500' },
    { id: 'members_only', label: 'Members Only', icon: Users, color: 'text-blue-500' },
    { id: 'private', label: 'Private', icon: Lock, color: 'text-red-500' },
  ];

  return (
    <div className="flex flex-col space-y-2">
      <label className="text-xs font-bold uppercase tracking-wider text-stone-500">{label} Privacy</label>
      <div className="flex bg-stone-900/50 rounded-lg p-1 border border-stone-700">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isActive = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
                isActive 
                  ? 'bg-stone-700 text-amber-500 shadow-sm' 
                  : 'text-stone-500 hover:text-stone-300'
              }`}
              title={opt.label}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? opt.color : ''}`} />
              <span className="hidden sm:inline">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default function EditProfile() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    bio: '',
    real_name: '',
    gender: '',
    birthdate: '',
    location: '',
    in_game_username: '',
    in_game_activities: '',
    typical_playtime: '',
    use_in_game_name: false,
    social_links: {},
    privacy_settings: {
      bio: 'public',
      real_name: 'public',
      location: 'public',
      birthdate: 'public',
      gender: 'public',
      typical_playtime: 'public',
      social_links: 'public'
    },
    username_color: '#FFFFFF'
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [headerFile, setHeaderFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [headerPreview, setHeaderPreview] = useState(null);

  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [croppingModal, setCroppingModal] = useState({ isOpen: false, type: null, src: null });
  const imgRef = useRef(null);

  const [newSocialPlatform, setNewSocialPlatform] = useState('');
  const [newSocialUrl, setNewSocialUrl] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!user) return;
        const response = await api.get(`/users/${user.username}/profile`);
        const data = response.data;
        
        setFormData({
          bio: data.bio || '',
          real_name: data.real_name || '',
          gender: data.gender || '',
          birthdate: data.birthdate || '',
          location: data.location || '',
          in_game_username: data.in_game_username || '',
          in_game_activities: data.in_game_activities || '',
          typical_playtime: data.typical_playtime || '',
          use_in_game_name: data.use_in_game_name || false,
          social_links: data.social_links || {},
          privacy_settings: {
            ...formData.privacy_settings,
            ...(data.privacy_settings || {})
          },
          username_color: data.username_color || '#FFFFFF'
        });
        
        if (data.avatar_url) setAvatarPreview(`${API_URL}${data.avatar_url}`);
        if (data.header_image_url) setHeaderPreview(`${API_URL}${data.header_image_url}`);
        
      } catch (err) {
        console.error("Failed to load profile:", err);
        setError("Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handlePrivacyChange = (field, level) => {
    setFormData(prev => ({
      ...prev,
      privacy_settings: {
        ...prev.privacy_settings,
        [field]: level
      }
    }));
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCroppingModal({ isOpen: true, type, src: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const onImageLoad = (e) => {
    imgRef.current = e.currentTarget;
    const { width, height } = e.currentTarget;
    const aspect = croppingModal.type === 'avatar' ? 1 : 16 / 9;
    const newCrop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height),
      width,
      height
    );
    setCrop(newCrop);
  };

  const handleCropComplete = async () => {
    if (completedCrop?.width && completedCrop?.height && imgRef.current) {
      const croppedBlob = await getCroppedImg(
        imgRef.current,
        completedCrop,
        `${croppingModal.type}.jpg`
      );
      if (croppingModal.type === 'avatar') {
        setAvatarFile(croppedBlob);
        setAvatarPreview(URL.createObjectURL(croppedBlob));
      } else {
        setHeaderFile(croppedBlob);
        setHeaderPreview(URL.createObjectURL(croppedBlob));
      }
      setCroppingModal({ isOpen: false, type: null, src: null });
    }
  };

  const addSocialLink = () => {
    if (newSocialPlatform && newSocialUrl) {
      setFormData(prev => ({
        ...prev,
        social_links: {
          ...prev.social_links,
          [newSocialPlatform.toLowerCase()]: newSocialUrl
        }
      }));
      setNewSocialPlatform('');
      setNewSocialUrl('');
    }
  };

  const removeSocialLink = (platform) => {
    const newLinks = { ...formData.social_links };
    delete newLinks[platform];
    setFormData(prev => ({ ...prev, social_links: newLinks }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (avatarFile) {
        const avatarData = new FormData();
        avatarData.append('file', avatarFile);
        await api.post('/users/me/avatar', avatarData);
      }

      if (headerFile) {
        const headerData = new FormData();
        headerData.append('file', headerFile);
        await api.post('/users/me/header', headerData);
      }

      // Clean up data before sending to avoid 422 errors
      const submissionData = { ...formData };
      if (submissionData.birthdate === "") submissionData.birthdate = null;
      if (submissionData.gender === "") submissionData.gender = null;

      await api.patch('/users/me/profile', submissionData);
      
      if (refreshUser) await refreshUser();
      
      navigate(`/profile/${user.username}`);
    } catch (err) {
      console.error("Failed to update profile:", err);
      setError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-stone-400">Loading...</div>;

  return (
    <>
      {croppingModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
          <div className="bg-stone-800 p-6 rounded-lg shadow-xl max-w-2xl w-full">
            <h2 className="text-xl font-bold text-amber-500 mb-4">Crop Image</h2>
            <ReactCrop
              crop={crop}
              onChange={c => setCrop(c)}
              onComplete={c => setCompletedCrop(c)}
              aspect={croppingModal.type === 'avatar' ? 1 : 16 / 9}
              className="max-h-[60vh]"
            >
              <img ref={imgRef} src={croppingModal.src} onLoad={onImageLoad} alt="Crop preview" />
            </ReactCrop>
            <div className="flex justify-end gap-4 mt-4">
              <button onClick={() => setCroppingModal({ isOpen: false, type: null, src: null })} className="px-4 py-2 text-stone-300 hover:bg-stone-700 rounded">Cancel</button>
              <button onClick={handleCropComplete} className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700">Crop & Save</button>
            </div>
          </div>
        </div>
      )}
      <div className="min-h-screen bg-stone-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-stone-800 rounded-lg shadow-lg overflow-hidden border border-stone-700">
          <div className="px-6 py-4 border-b border-stone-700 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-amber-500" />
              <h1 className="text-2xl font-bold text-amber-500">Edit Profile</h1>
            </div>
            <button 
              onClick={() => navigate(`/profile/${user.username}`)}
              className="text-stone-400 hover:text-stone-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {error && (
              <div className="bg-red-900/50 border border-red-800 p-4 text-red-300 rounded">
                <p>{error}</p>
              </div>
            )}

            {/* Appearance Section */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-stone-300 border-b border-stone-700 pb-2">Appearance</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-stone-400 mb-2">Username Color</label>
                  <input
                    type="color"
                    name="username_color"
                    value={formData.username_color}
                    onChange={handleInputChange}
                    className="mt-1 block w-full h-10 rounded-md border-stone-600 bg-stone-700"
                  />
                </div>
                <div className="flex items-center gap-3 bg-stone-900/30 p-4 rounded-lg border border-stone-700">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-stone-200">Use In-Game Name</label>
                    <p className="text-xs text-stone-500">Display your character name instead of username</p>
                  </div>
                  <input
                    type="checkbox"
                    name="use_in_game_name"
                    checked={formData.use_in_game_name}
                    onChange={handleInputChange}
                    className="w-5 h-5 rounded border-stone-600 bg-stone-700 text-amber-500 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Images Section */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-stone-300 border-b border-stone-700 pb-2">Images</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-stone-400 mb-2">Header Image</label>
                  <div className="relative h-32 bg-stone-700 rounded-lg overflow-hidden border-2 border-dashed border-stone-600 hover:border-amber-500 transition-colors group">
                    {headerPreview && <img src={headerPreview} alt="Header Preview" className="w-full h-full object-cover" />}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-all">
                      <label className="cursor-pointer p-2 bg-stone-800 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="w-5 h-5 text-stone-300" />
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'header')} />
                      </label>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-400 mb-2">Avatar</label>
                  <div className="flex items-center space-x-4">
                    <div className="relative w-24 h-24 rounded-full bg-stone-700 overflow-hidden border-2 border-stone-600 group">
                      {avatarPreview && <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-all">
                        <label className="cursor-pointer p-2 bg-stone-800 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          <Upload className="w-4 h-4 text-stone-300" />
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'avatar')} />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Identity Section */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-stone-300 border-b border-stone-700 pb-2">Identity</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="col-span-2 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-400 mb-1">Bio</label>
                    <textarea name="bio" rows="3" value={formData.bio} onChange={handleInputChange} className="mt-1 block w-full rounded-md bg-stone-700 border-stone-600 text-stone-200 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm" placeholder="Tell us about yourself..." />
                  </div>
                  <PrivacySelector label="Bio" value={formData.privacy_settings.bio} onChange={(val) => handlePrivacyChange('bio', val)} />
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-400 mb-1">Real Name</label>
                    <input type="text" name="real_name" value={formData.real_name} onChange={handleInputChange} className="mt-1 block w-full rounded-md bg-stone-700 border-stone-600 text-stone-200 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm" />
                  </div>
                  <PrivacySelector label="Real Name" value={formData.privacy_settings.real_name} onChange={(val) => handlePrivacyChange('real_name', val)} />
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-400 mb-1">Location</label>
                    <input type="text" name="location" value={formData.location} onChange={handleInputChange} className="mt-1 block w-full rounded-md bg-stone-700 border-stone-600 text-stone-200 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm" />
                  </div>
                  <PrivacySelector label="Location" value={formData.privacy_settings.location} onChange={(val) => handlePrivacyChange('location', val)} />
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-400 mb-1">Birthdate</label>
                    <input type="date" name="birthdate" value={formData.birthdate} onChange={handleInputChange} className="mt-1 block w-full rounded-md bg-stone-700 border-stone-600 text-stone-200 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm" />
                  </div>
                  <PrivacySelector label="Birthdate" value={formData.privacy_settings.birthdate} onChange={(val) => handlePrivacyChange('birthdate', val)} />
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-400 mb-1">Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleInputChange} className="mt-1 block w-full rounded-md bg-stone-700 border-stone-600 text-stone-200 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm">
                      <option value="">Select...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Non-binary">Non-binary</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                  <PrivacySelector label="Gender" value={formData.privacy_settings.gender} onChange={(val) => handlePrivacyChange('gender', val)} />
                </div>
              </div>
            </div>

            {/* Gaming Info Section */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-stone-300 border-b border-stone-700 pb-2">Gaming Profile</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <label className="block text-sm font-medium text-stone-400 mb-1">In-Game Username</label>
                  <input type="text" name="in_game_username" value={formData.in_game_username} onChange={handleInputChange} className="mt-1 block w-full rounded-md bg-stone-700 border-stone-600 text-stone-200 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm" />
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-400 mb-1">Typical Playtime</label>
                    <input type="text" name="typical_playtime" value={formData.typical_playtime} onChange={handleInputChange} placeholder="e.g., Weeknights 8pm EST" className="mt-1 block w-full rounded-md bg-stone-700 border-stone-600 text-stone-200 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm" />
                  </div>
                  <PrivacySelector label="Playtime" value={formData.privacy_settings.typical_playtime} onChange={(val) => handlePrivacyChange('typical_playtime', val)} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-stone-400 mb-1">In-Game Activities</label>
                  <textarea name="in_game_activities" rows="2" value={formData.in_game_activities} onChange={handleInputChange} className="mt-1 block w-full rounded-md bg-stone-700 border-stone-600 text-stone-200 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm" placeholder="What do you usually do in-game?" />
                </div>
              </div>
            </div>

            {/* Social Links Section */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-stone-300 border-b border-stone-700 pb-2">Social Links</h2>
              <div className="space-y-6">
                <div className="space-y-4">
                  {Object.entries(formData.social_links).map(([platform, url]) => (
                    <div key={platform} className="flex items-center space-x-2">
                      <div className="flex-1 p-2 bg-stone-700/50 border border-stone-600 rounded-md flex justify-between items-center">
                        <span className="font-medium capitalize text-stone-300">{platform}</span>
                        <span className="text-sm text-stone-400 truncate max-w-xs">{url}</span>
                      </div>
                      <button type="button" onClick={() => removeSocialLink(platform)} className="p-2 text-red-500 hover:bg-red-900/50 rounded-full transition-colors"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  ))}
                  <div className="flex space-x-2">
                    <select value={newSocialPlatform} onChange={(e) => setNewSocialPlatform(e.target.value)} className="block w-1/3 rounded-md bg-stone-700 border-stone-600 text-stone-200 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm">
                      <option value="">Platform...</option>
                      <option value="twitter">Twitter</option>
                      <option value="twitch">Twitch</option>
                      <option value="youtube">YouTube</option>
                      <option value="instagram">Instagram</option>
                      <option value="discord">Discord Server</option>
                      <option value="website">Website</option>
                    </select>
                    <input type="text" value={newSocialUrl} onChange={(e) => setNewSocialUrl(e.target.value)} placeholder="URL" className="block w-full rounded-md bg-stone-700 border-stone-600 text-stone-200 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm" />
                    <button type="button" onClick={addSocialLink} disabled={!newSocialPlatform || !newSocialUrl} className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-stone-600 hover:bg-stone-500 disabled:opacity-50"><Plus className="w-4 h-4" /></button>
                  </div>
                </div>
                <PrivacySelector label="Social Links" value={formData.privacy_settings.social_links} onChange={(val) => handlePrivacyChange('social_links', val)} />
              </div>
            </div>

            <div className="pt-6 border-t border-stone-700 flex justify-end space-x-4">
              <button type="button" onClick={() => navigate(`/profile/${user.username}`)} className="px-4 py-2 border border-stone-600 rounded-md shadow-sm text-sm font-medium text-stone-300 bg-stone-700 hover:bg-stone-600">Cancel</button>
              <button type="submit" disabled={saving} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50">
                {saving ? 'Saving...' : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
