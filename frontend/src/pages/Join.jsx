import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          discord_username: formData.discord_username || null
        })
      });

      if (res.ok) {
        navigate('/login');
      } else {
        const data = await res.json();
        setError(data.detail || 'Registration failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-900 bg-[url('/bg-pattern.png')] bg-repeat">
      <div className="bitz-card w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-amber-500 mb-2">Join the Empire</h1>
          <p className="text-stone-400">Begin your journey in Bitzantium</p>
        </div>
        
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-amber-200 mb-1 text-sm">Character Name (In-Game)</label>
            <input 
              type="text" 
              name="username"
              required
              className="bitz-input"
              value={formData.username}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-amber-200 mb-1 text-sm">Discord Username (Optional)</label>
            <input 
              type="text" 
              name="discord_username"
              className="bitz-input"
              value={formData.discord_username}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-amber-200 mb-1 text-sm">Email Address</label>
            <input 
              type="email" 
              name="email"
              required
              className="bitz-input"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-amber-200 mb-1 text-sm">Password</label>
            <input 
              type="password" 
              name="password"
              required
              className="bitz-input"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-amber-200 mb-1 text-sm">Confirm Password</label>
            <input 
              type="password" 
              name="confirmPassword"
              required
              className="bitz-input"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="bitz-btn w-full mt-6">
            Submit Application
          </button>
        </form>
      </div>
    </div>
  );
}
