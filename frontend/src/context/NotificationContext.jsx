import React, { createContext, useContext, useState, useCallback } from 'react';
import Notification from '../components/Notification';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState({ message: '', type: '' });

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
  }, []);

  const dismissNotification = useCallback(() => {
    setNotification({ message: '', type: '' });
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <Notification 
        message={notification.message} 
        type={notification.type} 
        onDismiss={dismissNotification} 
      />
    </NotificationContext.Provider>
  );
};
