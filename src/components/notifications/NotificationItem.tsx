// src/components/notifications/NotificationItem.tsx
import React from 'react';
import { Notification } from '../../types';
import { useNavigate } from 'react-router-dom';

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: number) => void; // Cette fonction est appelée quand on clique
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onRead }) => {
  const navigate = useNavigate();

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!notification.is_read) {
      onRead(notification.id); 
    }
    navigate(`/notifications/detail/${notification.id}`);
  };

  return (
    <div
      onClick={handleMarkAsRead}
      className={`p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition ${
        !notification.is_read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
      }`}
    >
      <div className="flex justify-between">
        <strong>{notification.actor}</strong>
        <span className="text-xs text-gray-500">{new Date(notification.created_at).toLocaleString()}</span>
      </div>
      <p className="text-sm text-gray-800 mt-1">{notification.verb}</p>
      {!notification.is_read && (
        <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">Nouveau</span>
      )}
    </div>
  );
};