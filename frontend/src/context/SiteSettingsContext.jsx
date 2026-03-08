import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '../api';

const SiteSettingsContext = createContext({
  settings: {},
  refreshSettings: () => {},
});

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/site-settings');
      setSettings(response.data);
    } catch (error) {
      console.error("Failed to fetch site settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const refreshSettings = () => {
    fetchSettings();
  };

  return (
    <SiteSettingsContext.Provider value={{ settings, refreshSettings, loading }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
