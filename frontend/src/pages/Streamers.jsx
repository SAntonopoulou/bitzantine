import React, { useState, useEffect } from 'react';
import { api, API_URL } from '../api';
import { Twitch, Youtube } from 'lucide-react';

const StreamerCard = ({ streamer }) => {
  const { display_name, avatar_url, social_links, stream_info } = streamer;
  const { is_live, game_name, stream_title, viewer_count, thumbnail_url } = stream_info;

  const liveStyles = is_live ? 'border-purple-500 shadow-purple-500/20' : 'border-stone-700';

  return (
    <div className={`bg-stone-800 rounded-lg shadow-lg border-2 transition-all duration-300 ${liveStyles}`}>
      <a href={`https://twitch.tv/${social_links.twitch}`} target="_blank" rel="noopener noreferrer" className="block">
        <div className="relative">
          {is_live ? (
            <>
              <img src={thumbnail_url} alt={stream_title} className="w-full h-auto object-cover rounded-t-md" />
              <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold uppercase px-2 py-1 rounded-md">LIVE</div>
              <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded-md">{viewer_count} viewers</div>
            </>
          ) : (
            <div className="h-48 bg-stone-700 rounded-t-md flex items-center justify-center">
              <p className="text-stone-500">Offline</p>
            </div>
          )}
        </div>
      </a>
      <div className="p-4">
        <div className="flex items-center gap-4">
          <img src={avatar_url ? `${API_URL}${avatar_url}` : `https://ui-avatars.com/api/?name=${display_name}&background=292524&color=f59e0b`} alt={display_name} className="w-12 h-12 rounded-full object-cover border-2 border-stone-600" />
          <div>
            <h3 className="font-bold text-lg text-stone-100">{display_name}</h3>
            {is_live && <p className="text-sm text-stone-400">{game_name}</p>}
          </div>
        </div>
        {is_live && <p className="text-sm text-stone-300 mt-3 truncate">{stream_title}</p>}
        <div className="flex gap-4 mt-4 border-t border-stone-700 pt-3">
          {social_links.twitch && (
            <a href={`https://twitch.tv/${social_links.twitch}`} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 flex items-center gap-1 text-sm">
              <Twitch size={16} /> Twitch
            </a>
          )}
          {social_links.youtube && (
            <a href={`https://www.youtube.com/${social_links.youtube}`} target="_blank" rel="noopener noreferrer" className="text-red-500 hover:text-red-400 flex items-center gap-1 text-sm">
              <Youtube size={16} /> YouTube
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default function Streamers() {
  const [streamers, setStreamers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStreamers = async () => {
      try {
        const response = await api.get('/streamers');
        setStreamers(response.data);
      } catch (error) {
        console.error("Failed to fetch streamers:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStreamers();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-stone-400">Loading streamers...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8">
      <h1 className="text-4xl font-bold text-amber-500 mb-8">Guild Streamers</h1>
      {streamers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {streamers.map(streamer => (
            <StreamerCard key={streamer.id} streamer={streamer} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-stone-800 rounded-xl border border-stone-700">
          <p className="text-stone-400 text-lg">No streamers are currently live or featured.</p>
          <p className="text-stone-500 mt-2">Check back later or apply to be a streamer in your profile settings!</p>
        </div>
      )}
    </div>
  );
}
