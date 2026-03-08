import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const PollDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [newOptionText, setNewOptionText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPoll();
  }, [id]);

  const fetchPoll = async () => {
    try {
      const response = await api.get(`/polls/${id}`);
      setPoll(response.data);
    } catch (err) {
      console.error("Failed to fetch poll:", err);
      setError("Failed to load poll details.");
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    if (!selectedOption) return;
    setSubmitting(true);
    try {
      await api.post(`/polls/${id}/vote`, { option_id: selectedOption });
      showNotification('Vote cast successfully!', 'success');
      fetchPoll(); // Refresh to show results
    } catch (err) {
      console.error("Vote failed:", err);
      showNotification(err.response?.data?.detail || "Failed to cast vote.", 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddOption = async () => {
    if (!newOptionText.trim()) return;
    setSubmitting(true);
    try {
      const response = await api.post(`/polls/${id}/options`, { text: newOptionText });
      setNewOptionText('');
      showNotification('Option added successfully!', 'success');
      // Optionally vote for the new option immediately
      // await api.post(`/polls/${id}/vote`, { option_id: response.data.id });
      fetchPoll();
    } catch (err) {
      console.error("Add option failed:", err);
      showNotification(err.response?.data?.detail || "Failed to add option.", 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center text-stone-300 mt-10">Loading poll...</div>;
  if (error) return <div className="text-center text-red-500 mt-10">{error}</div>;
  if (!poll) return <div className="text-center text-stone-300 mt-10">Poll not found.</div>;

  const hasVoted = poll.user_vote_option_id !== null;
  const isClosed = !poll.is_active;
  const showResults = hasVoted || isClosed;

  // Prepare data for chart
  const chartData = poll.options.map(opt => ({
    name: opt.text,
    votes: opt.vote_count,
    isUserVote: opt.id === poll.user_vote_option_id
  }));

  // Find winner if closed
  let winnerId = null;
  if (isClosed && poll.options.length > 0) {
      const maxVotes = Math.max(...poll.options.map(o => o.vote_count));
      if (maxVotes > 0) {
          // Handle ties? Just picking first for now or highlighting all
          // winnerId logic can be complex with ties
      }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="bg-stone-800 rounded-lg shadow-lg p-8 border border-stone-700">
        <h1 className="text-3xl font-bold text-amber-500 mb-2 font-serif">{poll.title}</h1>
        <div className="flex items-center space-x-4 text-sm text-stone-400 mb-6">
            <span>{poll.total_votes} votes</span>
            <span>•</span>
            <span>{poll.is_active ? 'Open' : 'Closed'}</span>
            {poll.end_date && (
                <>
                    <span>•</span>
                    <span>Ends: {new Date(poll.end_date).toLocaleDateString()}</span>
                </>
            )}
        </div>
        
        <p className="text-stone-300 mb-8 text-lg">{poll.description}</p>

        {!showResults ? (
          // Voting View
          <div className="space-y-4">
            {poll.options.map(option => (
              <label key={option.id} className={`flex items-center p-4 rounded border cursor-pointer transition-colors ${selectedOption === option.id ? 'bg-stone-700 border-amber-500' : 'bg-stone-900 border-stone-700 hover:bg-stone-700'}`}>
                <input
                  type="radio"
                  name="poll-option"
                  value={option.id}
                  checked={selectedOption === option.id}
                  onChange={() => setSelectedOption(option.id)}
                  className="form-radio h-5 w-5 text-amber-500 bg-stone-800 border-stone-600 focus:ring-amber-500"
                />
                <span className="ml-3 text-stone-200">{option.text}</span>
              </label>
            ))}

            {poll.allow_user_options && (
                <div className="mt-6 pt-6 border-t border-stone-700">
                    <h4 className="text-sm font-semibold text-stone-400 mb-2">Add your own option:</h4>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newOptionText}
                            onChange={(e) => setNewOptionText(e.target.value)}
                            placeholder="New option..."
                            className="flex-1 bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200 focus:outline-none focus:border-amber-500"
                        />
                        <button
                            onClick={handleAddOption}
                            disabled={submitting || !newOptionText.trim()}
                            className="bg-stone-700 hover:bg-stone-600 text-stone-200 px-4 py-2 rounded disabled:opacity-50"
                        >
                            Add
                        </button>
                    </div>
                </div>
            )}

            <button
              onClick={handleVote}
              disabled={!selectedOption || submitting}
              className="w-full mt-6 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Voting...' : 'Vote'}
            </button>
          </div>
        ) : (
          // Results View
          <div>
            <div className="h-64 w-full mb-8">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={100} tick={{fill: '#d6d3d1', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#292524', borderColor: '#44403c', color: '#e7e5e4' }}
                    itemStyle={{ color: '#fbbf24' }}
                    cursor={{fill: 'transparent'}}
                  />
                  <Bar dataKey="votes" fill="#d97706" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.isUserVote ? '#fbbf24' : '#d97706'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
                {poll.options.sort((a, b) => b.vote_count - a.vote_count).map(option => {
                    const percentage = poll.total_votes > 0 ? Math.round((option.vote_count / poll.total_votes) * 100) : 0;
                    const isUserVote = option.id === poll.user_vote_option_id;
                    
                    return (
                        <div key={option.id} className="relative pt-1">
                            <div className="flex mb-2 items-center justify-between">
                                <div>
                                    <span className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full ${isUserVote ? 'text-amber-600 bg-amber-200' : 'text-stone-600 bg-stone-200'}`}>
                                        {option.text} {isUserVote && "(You voted)"}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-semibold inline-block text-stone-400">
                                        {percentage}% ({option.vote_count} votes)
                                    </span>
                                </div>
                            </div>
                            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-stone-700">
                                <div style={{ width: `${percentage}%` }} className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${isUserVote ? 'bg-amber-500' : 'bg-stone-500'}`}></div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {isClosed && (
                <div className="mt-8 p-4 bg-stone-900 rounded border border-stone-700 text-center">
                    <p className="text-stone-400">This poll is closed.</p>
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PollDetail;
