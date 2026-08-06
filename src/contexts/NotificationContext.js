"use client";

import React, { createContext, useContext, useState } from 'react';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const markAsRead = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const addLocalToast = (title, message, type = 'info') => {
    const localId = 'local-' + Date.now();
    const newToast = { id: localId, title, message, type, read: false, createdAt: new Date().toISOString() };
    setNotifications(prev => [newToast, ...prev]);
    // Auto dismiss local toasts after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== localId));
    }, 5000);
  };

  return (
    <NotificationContext.Provider value={{ notifications, markAsRead, addLocalToast }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
