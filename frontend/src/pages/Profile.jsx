import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, API_URL } from '../api';
import { 
  MapPin, 
  Calendar, 
  Mail, 
  Gamepad2, 
  Twitter, 
  Twitch, 
  Youtube, 
  Instagram, 
  Edit,
  Users
} from 'lucide-react';

export default function Profile() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const targetUsername = username || currentUser?.username;
        if (!targetUsername) return;
        
        const response = await api.get(`/users/${targetUsername}/profile`);
        setProfile(response.data);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        setError("Profile not found");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username, currentUser]);

  if (loading) return <div className="p-8 text-center text-stone-400">Loading profile...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!profile) return null;

  const isOwner = currentUser && currentUser.username === profile.username;

  const SocialIcon = ({ platform }) => {
    switch (platform.toLowerCase()) {
      case 'twitter': return <Twitter className="w-5 h-5" />;
      case 'twitch': return <Twitch className="w-5 h-5" />;
      case 'youtube': return <Youtube className="w-5 h-5" />;
      case 'instagram': return <Instagram className="w-5 h-5" />;
      default: return <Link className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-200 pb-12">
      {/* Header Section */}
      <div className="relative h-64 w-full bg-stone-700">
        {profile.header_image_url ? (
          <img 
            src={`${API_URL}${profile.header_image_url}`} 
            alt="Header" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-stone-800 to-stone-700" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Main Content Wrapper */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Avatar and Name Section */}
        <div className="relative -mt-20">
          <div className="flex flex-col sm:flex-row items-end">
            <div className="relative flex-shrink-0">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-stone-900 bg-stone-800 overflow-hidden shadow-lg">
                {profile.avatar_url ? (
                  <img 
                    src={`${API_URL}${profile.avatar_url}`} 
                    alt={profile.username} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-500 text-4xl font-bold">
                    {(profile.display_name || profile.username).charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            <div className="ml-0 sm:ml-6 mt-4 sm:mt-0 flex-grow flex flex-col sm:flex-row justify-between items-baseline">
              <div className="text-center sm:text-left">
                <h1 
                  className="text-3xl font-bold text-white drop-shadow-md"
                  style={{ color: profile.username_color || '#FFFFFF' }}
                >
                  {profile.display_name || profile.username}
                </h1>
                {profile.display_name && profile.display_name !== profile.username && (
                  <p className="text-stone-500 text-sm font-medium">@{profile.username}</p>
                )}
                {profile.real_name && (
                  <p className="text-stone-300 font-medium drop-shadow-sm mt-1">{profile.real_name}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Box */}
        <div className="bg-stone-800 border border-stone-700 rounded-lg shadow-lg p-6 sm:p-8 mt-8">
          <div className="flex justify-end -mt-4 -mr-4">
            {isOwner && (
              <Link 
                to="/profile/edit" 
                className="flex items-center px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors shadow-sm"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
            {/* Left Column: Details */}
            <div className="space-y-6">
              {profile.in_game_activities && (
                <div className="bg-amber-900/30 text-amber-200 p-4 rounded-lg border border-amber-800">
                  <h3 className="text-lg font-semibold text-amber-400 mb-2 flex items-center">
                    <Gamepad2 className="w-5 h-5 mr-2" /> In-Game Focus
                  </h3>
                  <p>{profile.in_game_activities}</p>
                </div>
              )}
              {profile.bio && (
                <div className="bg-stone-900/50 p-4 rounded-lg border border-stone-700">
                  <h3 className="text-lg font-semibold text-stone-300 mb-2">About</h3>
                  <p className="text-stone-400 whitespace-pre-wrap">{profile.bio}</p>
                </div>
              )}

              <div className="bg-stone-900/50 border border-stone-700 rounded-lg p-4 space-y-3">
                <h3 className="text-lg font-semibold text-stone-300 mb-2">Details</h3>
                
                {profile.location && (
                  <div className="flex items-center text-stone-400">
                    <MapPin className="w-5 h-5 mr-3 text-stone-500" />
                    <span>{profile.location}</span>
                  </div>
                )}
                
                {profile.birthdate && (
                  <div className="flex items-center text-stone-400">
                    <Calendar className="w-5 h-5 mr-3 text-stone-500" />
                    <span>{new Date(profile.birthdate).toLocaleDateString()}</span>
                  </div>
                )}
                
                {profile.email && (
                  <div className="flex items-center text-stone-400">
                    <Mail className="w-5 h-5 mr-3 text-stone-500" />
                    <span>{profile.email}</span>
                  </div>
                )}

                {profile.discord_username && (
                  <div className="flex items-center text-stone-400">
                    <span className="w-5 h-5 mr-3 flex items-center justify-center text-stone-500 font-bold text-xs border border-stone-500 rounded-full">D</span>
                    <span>{profile.discord_username}</span>
                  </div>
                )}
              </div>

              {profile.social_links && Object.keys(profile.social_links).length > 0 && (
                <div className="bg-stone-900/50 border border-stone-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-stone-300 mb-3">Socials</h3>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(profile.social_links).map(([platform, url]) => (
                      <a 
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-3 py-2 bg-stone-700 text-stone-300 rounded hover:bg-stone-600 transition-colors"
                      >
                        <SocialIcon platform={platform} />
                        <span className="ml-2 capitalize">{platform}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Groups & Activity */}
            <div className="lg:col-span-2 space-y-6">
              {/* Led Groups */}
              {profile.led_groups && profile.led_groups.length > 0 && (
                <div className="bg-stone-900/50 border border-amber-800 rounded-lg overflow-hidden">
                  <div className="bg-amber-900/30 px-4 py-3 border-b border-amber-800 flex items-center">
                    <Users className="w-5 h-5 text-amber-400 mr-2" />
                    <h3 className="font-bold text-amber-400">Groups Led</h3>
                  </div>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {profile.led_groups.map(group => (
                      <Link 
                        key={group.id} 
                        to={`/groups/${group.id}`}
                        className="block p-3 border border-stone-700 rounded hover:border-amber-600 hover:shadow-lg transition-all"
                      >
                        <div className="font-semibold text-stone-300">{group.name}</div>
                        <div className="text-xs text-stone-500 uppercase mt-1">{group.type}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Member Groups */}
              {profile.groups && profile.groups.length > 0 && (
                <div className="bg-stone-900/50 border border-stone-700 rounded-lg overflow-hidden">
                  <div className="bg-stone-700/50 px-4 py-3 border-b border-stone-700 flex items-center">
                    <Users className="w-5 h-5 text-stone-400 mr-2" />
                    <h3 className="font-bold text-stone-300">Group Memberships</h3>
                  </div>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {profile.groups.map(group => (
                      <Link 
                        key={group.id} 
                        to={`/groups/${group.id}`}
                        className="block p-3 border border-stone-700 rounded hover:border-stone-600 hover:shadow-lg transition-all"
                      >
                        <div className="font-semibold text-stone-300">{group.name}</div>
                        <div className="text-xs text-stone-500 uppercase mt-1">{group.type}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              
              {(!profile.led_groups?.length && !profile.groups?.length) && (
                <div className="text-center py-12 bg-stone-900/50 rounded-lg border border-stone-700 border-dashed">
                  <p className="text-stone-500">No group memberships yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
