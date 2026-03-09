import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(username, password);
      navigate(`/profile/${username}`);
    } catch (err) {
      setError(err.message || 'Failed to log in. Please check your credentials.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-md">
        <form 
          onSubmit={handleSubmit} 
          className="bg-stone-800 shadow-2xl rounded-2xl px-8 pt-6 pb-8 mb-4"
        >
          <h1 className="text-3xl font-bold text-amber-500 mb-8 text-center">
            Login to Bitzantium
          </h1>
          
          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative mb-6" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-stone-300 text-sm font-bold mb-2" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="shadow-inner appearance-none border border-stone-700 rounded-lg w-full py-3 px-4 bg-stone-700 text-stone-200 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="mb-8">
            <label className="block text-stone-300 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="shadow-inner appearance-none border border-stone-700 rounded-lg w-full py-3 px-4 bg-stone-700 text-stone-200 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <button className="bitz-btn w-full text-lg" type="submit">
              Sign In
            </button>
          </div>
          <p className="text-center text-stone-500 text-sm mt-8">
            Don't have an account?{' '}
            <Link to="/join" className="font-bold text-amber-600 hover:text-amber-500">
              Register here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
