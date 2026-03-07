import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_URL}/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch user'))
      .then(userData => setUser(userData))
      .catch(() => {
        localStorage.removeItem('token');
        setUser(null);
      })
      .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const response = await fetch(`${API_URL}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username, password })
    });

    if (response.ok) {
      const { access_token } = await response.json();
      localStorage.setItem('token', access_token);
      
      // This is the crucial part: we must fetch the user data *after* the token is set.
      // The original code had a race condition.
      try {
        const userResponse = await fetch(`${API_URL}/users/me`, {
          headers: { 'Authorization': `Bearer ${access_token}` }
        });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData);
        } else {
          throw new Error('Failed to fetch user data after login.');
        }
      } catch (error) {
        // If fetching user fails, logout to clear inconsistent state
        logout();
        throw error;
      }

    } else {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Login failed.');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
