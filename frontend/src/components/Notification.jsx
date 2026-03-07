import React, { useState, useEffect } from 'react';

export default function Notification({ message, type, onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => {
        handleDismiss();
      }, 5000); // Auto-dismiss after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleDismiss = () => {
    setVisible(false);
    if (onDismiss) {
      // Allow for a fade-out animation before calling the parent dismiss
      setTimeout(onDismiss, 300); 
    }
  };

  const bgColor = type === 'success' ? 'bg-green-600' : 'bg-red-600';

  return (
    <div 
      className={`fixed top-20 right-8 z-50 transition-all duration-300 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}
    >
      {message && (
        <div className={`flex items-center justify-between p-4 rounded-lg shadow-lg text-white ${bgColor}`}>
          <p>{message}</p>
          <button onClick={handleDismiss} className="ml-4 font-bold text-xl">&times;</button>
        </div>
      )}
    </div>
  );
}
