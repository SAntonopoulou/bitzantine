import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const Polls = () => {
  const [activePolls, setActivePolls] = useState([]);
  const [pastPolls, setPastPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const response = await api.get('/polls/');
        const allPolls = response.data;
        
        const active = allPolls.filter(poll => poll.is_active);
        const past = allPolls.filter(poll => !poll.is_active);
        
        setActivePolls(active);
        setPastPolls(past);
      } catch (err) {
        console.error("Failed to fetch polls:", err);
        setError("Failed to load polls.");
      } finally {
        setLoading(false);
      }
    };

    fetchPolls();
  }, []);

  if (loading) return <div className="text-center text-stone-300 mt-10 p-4">Loading polls...</div>;
  if (error) return <div className="text-center text-red-500 mt-10 p-4">{error}</div>;

  const PollCard = ({ poll }) => (
    <Link to={`/polls/${poll.id}`} className="block">
      <div className="bg-stone-800 p-4 sm:p-6 rounded-lg shadow-md hover:bg-stone-700 transition-colors border border-stone-700 h-full flex flex-col">
        <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg sm:text-xl font-bold text-amber-500">{poll.title}</h3>
            <span className={`flex-shrink-0 ml-2 px-2 py-1 rounded text-xs font-semibold ${poll.is_active ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                {poll.is_active ? 'Open' : 'Closed'}
            </span>
        </div>
        <p className="text-stone-300 mb-4 line-clamp-2 text-sm sm:text-base flex-grow">{poll.description}</p>
        <div className="flex justify-between items-center text-xs sm:text-sm text-stone-400 mt-auto">
          <span>{poll.total_votes} votes</span>
          {poll.end_date && (
            <span className="text-right">Ends: {new Date(poll.end_date).toLocaleDateString()}</span>
          )}
        </div>
      </div>
    </Link>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-amber-500 mb-8 text-center font-serif">Community Polls</h1>

      <div className="mb-12">
        <h2 className="text-xl sm:text-2xl font-semibold text-stone-200 mb-4 border-b border-stone-700 pb-2">Active Polls</h2>
        {activePolls.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {activePolls.map(poll => (
              <PollCard key={poll.id} poll={poll} />
            ))}
          </div>
        ) : (
          <p className="text-stone-400 italic">No active polls at the moment.</p>
        )}
      </div>

      <div>
        <h2 className="text-xl sm:text-2xl font-semibold text-stone-200 mb-4 border-b border-stone-700 pb-2">Past Results</h2>
        {pastPolls.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {pastPolls.map(poll => (
              <PollCard key={poll.id} poll={poll} />
            ))}
          </div>
        ) : (
          <p className="text-stone-400 italic">No past polls found.</p>
        )}
      </div>
    </div>
  );
};

export default Polls;
