import React, { useState } from 'react';
import { apiClient } from '../apiClient';
import { useNavigate } from 'react-router-dom';

const ChangePassword = () => {
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [codeSent, setCodeSent] = useState(false);
    const navigate = useNavigate();

    const handleRequestCode = async () => {
        setError('');
        setMessage('');
        try {
            const response = await apiClient.post('/users/me/request-password-change');
            setMessage(response.data.message);
            setCodeSent(true);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to request code.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        try {
            const response = await apiClient.post('/users/me/change-password', { code, new_password: newPassword });
            setMessage(response.data.message);
            setTimeout(() => navigate('/settings'), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to change password.');
        }
    };

    return (
        <div className="container mx-auto mt-10">
            <div className="max-w-md mx-auto bg-stone-800 p-8 rounded shadow-md border border-stone-700">
                <h1 className="text-2xl font-bold text-amber-500 mb-6">Change Password</h1>
                
                {message && <p className="mb-4 text-green-500">{message}</p>}
                {error && <p className="mb-4 text-red-500">{error}</p>}

                {!codeSent ? (
                    <button onClick={handleRequestCode} className="w-full bg-amber-600 text-white p-2 rounded hover:bg-amber-700 transition-colors">
                        Request Verification Code
                    </button>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-stone-300 text-sm font-bold mb-2" htmlFor="code">
                                Verification Code
                            </label>
                            <input
                                id="code"
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                required
                                className="shadow-inner appearance-none border border-stone-700 rounded-lg w-full py-3 px-4 bg-stone-700 text-stone-200 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-stone-300 text-sm font-bold mb-2" htmlFor="newPassword">
                                New Password
                            </label>
                            <input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                className="shadow-inner appearance-none border border-stone-700 rounded-lg w-full py-3 px-4 bg-stone-700 text-stone-200 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-stone-300 text-sm font-bold mb-2" htmlFor="confirmPassword">
                                Confirm New Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="shadow-inner appearance-none border border-stone-700 rounded-lg w-full py-3 px-4 bg-stone-700 text-stone-200 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                        </div>
                        <button type="submit" className="w-full bg-amber-600 text-white p-2 rounded hover:bg-amber-700 transition-colors">
                            Change Password
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ChangePassword;
