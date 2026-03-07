import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../apiClient';

export default function Join() {
  const [formData, setFormData] = useState({
    username: '',
    discord_username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const res = await apiClient.post('/users', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        discord_username: formData.discord_username || null
      });

      if (res.status === 200 || res.status === 201) {
        navigate('/login');
      } else {
        setError('Registration failed');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred. Please try again.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12">
      <div className="w-full max-w-md">
        <form 
          onSubmit={handleSubmit} 
          className="bg-stone-800 shadow-2xl rounded-2xl px-8 pt-8 pb-8 mb-4 border border-stone-700"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-amber-500 mb-2">Join the Empire</h1>
            <p className="text-stone-400 text-sm">Begin your journey in Bitzantium</p>
          </div>
          
          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative mb-6" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-stone-300 text-sm font-bold mb-2">Character Name (In-Game)</label>
              <input 
                type="text" 
                name="username"
                required
                className="shadow-inner appearance-none border border-stone-700 rounded-lg w-full py-3 px-4 bg-stone-700 text-stone-200 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={formData.username}
                onChange={handleChange}
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-stone-300 text-sm font-bold mb-2">Discord Username (Optional)</label>
              <input 
                type="text" 
                name="discord_username"
                className="shadow-inner appearance-none border border-stone-700 rounded-lg w-full py-3 px-4 bg-stone-700 text-stone-200 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={formData.discord_username}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-stone-300 text-sm font-bold mb-2">Email Address</label>
              <input 
                type="email" 
                name="email"
                required
                className="shadow-inner appearance-none border border-stone-700 rounded-lg w-full py-3 px-4 bg-stone-700 text-stone-200 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-stone-300 text-sm font-bold mb-2">Password</label>
              <input 
                type="password" 
                name="password"
                required
                className="shadow-inner appearance-none border border-stone-700 rounded-lg w-full py-3 px-4 bg-stone-700 text-stone-200 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="block text-stone-300 text-sm font-bold mb-2">Confirm Password</label>
              <input 
                type="password" 
                name="confirmPassword"
                required
                className="shadow-inner appearance-none border border-stone-700 rounded-lg w-full py-3 px-4 bg-stone-700 text-stone-200 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </div>
          </div>

          <button type="submit" className="bitz-btn w-full mt-8 text-lg">
            Submit Application
          </button>

          <p className="text-center text-stone-500 text-sm mt-8">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-amber-600 hover:text-amber-500">
              Login here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
