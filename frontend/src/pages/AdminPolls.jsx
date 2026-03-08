import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { format } from 'date-fns';
import { Plus, Trash2, Lock } from 'lucide-react';

const AdminPolls = () => {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newPoll, setNewPoll] = useState({
    title: '',
    description: '',
    end_date: '',
    allow_user_options: false,
    allow_multiple_votes: false,
    max_votes: 1,
    options: ['', '']
  });
  const [submitting, setSubmitting] = useState(false);
  const { showNotification } = useNotification();

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      const response = await api.get('/polls/');
      setPolls(response.data);
    } catch (err) {
      console.error("Failed to fetch polls:", err);
      setError("Failed to load polls.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePoll = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...newPoll,
        end_date: newPoll.end_date === '' ? null : newPoll.end_date,
        options: newPoll.options.filter(o => o.trim() !== '')
      };
      await api.post('/polls/', payload);
      showNotification('Poll created successfully!', 'success');
      setShowModal(false);
      setNewPoll({ title: '', description: '', end_date: '', allow_user_options: false, allow_multiple_votes: false, max_votes: 1, options: ['', ''] });
      fetchPolls();
    } catch (err) {
      console.error("Failed to create poll:", err);
      showNotification(err.response?.data?.detail || "Failed to create poll.", 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePoll = async (id) => {
    if (!window.confirm("Are you sure you want to delete this poll?")) return;
    try {
      await api.delete(`/polls/${id}`);
      showNotification('Poll deleted successfully!', 'success');
      fetchPolls();
    } catch (err) {
      console.error("Failed to delete poll:", err);
      showNotification("Failed to delete poll.", 'error');
    }
  };

  const handleClosePoll = async (id) => {
      try {
          await api.patch(`/polls/${id}`, { is_active: false });
          showNotification('Poll closed successfully!', 'success');
          fetchPolls();
      } catch (err) {
          console.error("Failed to close poll:", err);
          showNotification("Failed to close poll.", 'error');
      }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...newPoll.options];
    newOptions[index] = value;
    setNewPoll({ ...newPoll, options: newOptions });
  };

  const addOptionField = () => {
    setNewPoll({ ...newPoll, options: [...newPoll.options, ''] });
  };

  const removeOptionField = (index) => {
    const newOptions = newPoll.options.filter((_, i) => i !== index);
    setNewPoll({ ...newPoll, options: newOptions });
  };

  if (loading) return <div className="p-4 sm:p-8 text-center text-stone-300">Loading polls...</div>;
  if (error) return <div className="p-4 sm:p-8 text-center text-red-500">{error}</div>;

  const inputStyles = "mt-1 block w-full bg-stone-900 border border-stone-600 rounded-md shadow-sm py-2 px-3 text-stone-200 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-amber-500 font-serif">Poll Management</h1>
        <button
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          <Plus size={20} /> Create New Poll
        </button>
      </div>

      <div className="bg-stone-800 rounded-lg shadow overflow-hidden border border-stone-700">
        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-stone-700">
          {polls.map(poll => (
            <div key={poll.id} className="p-4 space-y-3">
              <p className="text-stone-200 font-medium">{poll.title}</p>
              <div className="flex justify-between text-sm">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${poll.is_active ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
                  {poll.is_active ? 'Active' : 'Closed'}
                </span>
                <span className="text-stone-400">{poll.total_votes} votes</span>
              </div>
              <div className="text-xs text-stone-500">
                {poll.end_date ? `Ends: ${format(new Date(poll.end_date), 'MMM d, yyyy')}` : 'No End Date'}
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-stone-700/50">
                {poll.is_active && <button onClick={() => handleClosePoll(poll.id)} className="flex items-center gap-1 text-sm text-amber-500 hover:text-amber-400"><Lock size={14}/> Close</button>}
                <button onClick={() => handleDeletePoll(poll.id)} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-400"><Trash2 size={14}/> Delete</button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <table className="hidden md:table min-w-full divide-y divide-stone-700">
          <thead className="bg-stone-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-stone-400 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-stone-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-stone-400 uppercase tracking-wider">Votes</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-stone-400 uppercase tracking-wider">End Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-stone-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-stone-800 divide-y divide-stone-700">
            {polls.map(poll => (
              <tr key={poll.id}>
                <td className="px-6 py-4 whitespace-nowrap text-stone-200 font-medium">{poll.title}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${poll.is_active ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>{poll.is_active ? 'Active' : 'Closed'}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-stone-300">{poll.total_votes}</td>
                <td className="px-6 py-4 whitespace-nowrap text-stone-300">{poll.end_date ? format(new Date(poll.end_date), 'MMM d, yyyy') : 'No End Date'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                  {poll.is_active && <button onClick={() => handleClosePoll(poll.id)} className="text-amber-500 hover:text-amber-400">Close</button>}
                  <button onClick={() => handleDeletePoll(poll.id)} className="text-red-500 hover:text-red-400">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-stone-800 rounded-lg shadow-xl max-w-lg w-full p-6 border border-stone-600 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-amber-500 mb-4">Create New Poll</h2>
            <form onSubmit={handleCreatePoll} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-300">Title</label>
                <input type="text" required value={newPoll.title} onChange={(e) => setNewPoll({ ...newPoll, title: e.target.value })} className={inputStyles} />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-300">Description</label>
                <textarea required value={newPoll.description} onChange={(e) => setNewPoll({ ...newPoll, description: e.target.value })} rows={3} className={inputStyles} />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-300">End Date (Optional)</label>
                <input type="datetime-local" value={newPoll.end_date} onChange={(e) => setNewPoll({ ...newPoll, end_date: e.target.value })} className={inputStyles} />
              </div>
              <div className="space-y-2 pt-2">
                <div className="flex items-center"><input id="allow_user_options" type="checkbox" checked={newPoll.allow_user_options} onChange={(e) => setNewPoll({ ...newPoll, allow_user_options: e.target.checked })} className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-stone-600 rounded bg-stone-900" /><label htmlFor="allow_user_options" className="ml-2 block text-sm text-stone-300">Allow users to add options?</label></div>
                <div className="flex items-center"><input id="allow_multiple_votes" type="checkbox" checked={newPoll.allow_multiple_votes} onChange={(e) => setNewPoll({ ...newPoll, allow_multiple_votes: e.target.checked })} className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-stone-600 rounded bg-stone-900" /><label htmlFor="allow_multiple_votes" className="ml-2 block text-sm text-stone-300">Allow multiple votes?</label></div>
                {newPoll.allow_multiple_votes && (<div><label className="block text-sm font-medium text-stone-300">Max Votes Allowed</label><input type="number" min="1" value={newPoll.max_votes} onChange={(e) => setNewPoll({ ...newPoll, max_votes: parseInt(e.target.value) })} className={inputStyles} /></div>)}
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-2">Initial Options</label>
                {newPoll.options.map((option, index) => (
                  <div key={index} className="flex mb-2"><input type="text" value={option} onChange={(e) => handleOptionChange(index, e.target.value)} placeholder={`Option ${index + 1}`} className="flex-1 bg-stone-900 border border-stone-600 rounded-l-md shadow-sm py-2 px-3 text-stone-200 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm" /><button type="button" onClick={() => removeOptionField(index)} className="bg-red-900 hover:bg-red-800 text-red-200 px-3 py-2 rounded-r-md border border-l-0 border-stone-600">X</button></div>
                ))}
                <button type="button" onClick={addOptionField} className="mt-2 text-sm text-amber-500 hover:text-amber-400">+ Add another option</button>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-stone-700">
                <button type="button" onClick={() => setShowModal(false)} className="bg-stone-700 hover:bg-stone-600 text-stone-200 font-bold py-2 px-4 rounded transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50">{submitting ? 'Creating...' : 'Create Poll'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPolls;
