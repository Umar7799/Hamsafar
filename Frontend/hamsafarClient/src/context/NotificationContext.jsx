import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/conversations/unread-count');
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error('🔴 Failed to fetch unread count:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return (
    <NotificationContext.Provider value={{ unreadCount, fetchUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
