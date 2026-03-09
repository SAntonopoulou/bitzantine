import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiClient } from '../apiClient';

const VerifyEmail = () => {
    const [message, setMessage] = useState('Verifying your email...');
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const token = new URLSearchParams(location.search).get('token');
        if (token) {
            apiClient.get(`/verify-email?token=${token}`)
                .then(response => {
                    setMessage(response.data.message);
                    setTimeout(() => navigate('/login'), 5000);
                })
                .catch(error => {
                    setMessage(error.response?.data?.detail || 'An error occurred during verification.');
                });
        } else {
            setMessage('No verification token found.');
        }
    }, [location, navigate]);

    return (
        <div className="container mx-auto mt-10 text-center">
            <h1 className="text-2xl font-bold">Email Verification</h1>
            <p className="mt-4">{message}</p>
            {message.includes("successfully") && <p>You will be redirected to the login page shortly.</p>}
        </div>
    );
};

export default VerifyEmail;
