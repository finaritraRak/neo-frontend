// src/hooks/useUnreadNotifications.ts
import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return token
    ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
};

export const useUnreadNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    const url = `${API_BASE_URL}/notifications/unread-count/`;
    
    try {
      const res = await fetch(url, { headers: getHeaders() });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Réponse non-JSON');
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (typeof data.count === 'number') {
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error('❌ Erreur réseau (unread):', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 5000);
    return () => clearInterval(interval);
  }, []);

  const refetch = fetchUnreadCount;

  return { unreadCount, refetch };
};