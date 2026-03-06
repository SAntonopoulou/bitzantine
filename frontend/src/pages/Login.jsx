import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (await login(username, password)) {
      navigate('/profile/me');
    } else {
      alert('Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-900 bg-[url('/bg-pattern.png')] bg-repeat">
      <div className="bitz-card w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-amber-500 mb-2">Welcome Back</h1>
          <p className="text-stone-400">Enter your credentials, Citizen.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-amber-200 mb-1 text-sm">Username</label>
            <input 
              type="text" 
              className="bitz-input"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-amber-200 mb-1 text-sm">Password</label>
            <input 
              type="password" 
              className="bitz-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="bitz-btn w-full mt-6">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
