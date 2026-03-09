import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const response = await api.get('/users/me');
      setUser(response.data);
    } catch (error) {
      console.error("Failed to fetch user:", error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    try {
      const response = await api.post('/token', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      
      // Re-fetch user data
      await fetchUser();
      
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Login failed.');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
