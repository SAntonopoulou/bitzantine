import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../apiClient';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/users', { username, email, password });
      if (res.status === 200 || res.status === 201) {
        navigate('/login');
      } else {
        alert('Registration failed');
      }
    } catch (err) {
      alert(err.response?.data?.detail || 'Registration failed');
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-stone-900">
      <form onSubmit={handleSubmit} className="bg-stone-800 p-8 rounded shadow-md w-96 border border-stone-700">
        <h2 className="text-2xl mb-4 font-bold text-amber-500">Register</h2>
        <input 
          type="text" 
          placeholder="Username" 
          className="w-full p-2 mb-4 border border-stone-600 rounded bg-stone-700 text-stone-200 focus:outline-none focus:border-amber-500"
          value={username}
          onChange={e => setUsername(e.target.value)}
          autoComplete="username"
        />
        <input 
          type="email" 
          placeholder="Email" 
          className="w-full p-2 mb-4 border border-stone-600 rounded bg-stone-700 text-stone-200 focus:outline-none focus:border-amber-500"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
        />
        <input 
          type="password" 
          placeholder="Password" 
          className="w-full p-2 mb-4 border border-stone-600 rounded bg-stone-700 text-stone-200 focus:outline-none focus:border-amber-500"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="new-password"
        />
        <button type="submit" className="w-full bg-amber-600 text-white p-2 rounded hover:bg-amber-700 transition-colors">Register</button>
      </form>
    </div>
  );
}
