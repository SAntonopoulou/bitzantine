import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiClient } from '../apiClient';

const VerifyCode = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (location.state?.email) {
            setEmail(location.state.email);
        }
    }, [location.state]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        try {
            const response = await apiClient.post('/verify-email', { email, code });
            setMessage(response.data.message);
            setTimeout(() => navigate('/login'), 5000);
        } catch (err) {
            setError(err.response?.data?.detail || 'An error occurred.');
        }
    };

    return (
        <div className="flex justify-center items-center h-screen bg-stone-900">
            <form onSubmit={handleSubmit} className="bg-stone-800 p-8 rounded shadow-md w-96 border border-stone-700">
                <h2 className="text-2xl mb-4 font-bold text-amber-500">Enter Verification Code</h2>
                <p className="mb-4 text-stone-400">Please enter the email address associated with your account and the 6-digit code sent to it.</p>

                {message && <p className="mb-4 text-green-500">{message}</p>}
                {error && <p className="mb-4 text-red-500">{error}</p>}

                <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full p-2 mb-4 border border-stone-600 rounded bg-stone-700 text-stone-200 focus:outline-none focus:border-amber-500"
                />

                <input
                    type="text"
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    maxLength="6"
                    required
                    className="w-full p-2 mb-4 border border-stone-600 rounded bg-stone-700 text-stone-200 focus:outline-none focus:border-amber-500 text-center text-2xl tracking-widest"
                />
                <button type="submit" className="w-full bg-amber-600 text-white p-2 rounded hover:bg-amber-700 transition-colors">Verify</button>
            </form>
        </div>
    );
};

export default VerifyCode;
