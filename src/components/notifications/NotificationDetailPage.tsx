// src/components/notifications/NotificationDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Loader2, ArrowLeft, ExternalLink } from 'lucide-react';
import { Notification } from '../../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token
    ? {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    : {};
};

export const NotificationDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔍 Extraire l'ID depuis l'URL manuellement
  const getIdFromPath = () => {
    const path = window.location.pathname; // Ex: /admin-panel/notifications/detail/6
    const match = path.match(/\/notifications\/detail\/(\d+)$/);
    return match ? match[1] : null;
  };

  useEffect(() => {
    const fetchNotification = async () => {
      const id = getIdFromPath();
      if (!id) {
        console.error('❌ ID manquant dans l’URL:', window.location.pathname);
        navigate('/notifications', { replace: true });
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        console.error('🔒 Token manquant');
        localStorage.removeItem('token');
        navigate('/login', { replace: true });
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/notifications/${id}/`, {
          method: 'GET',
          headers: getAuthHeaders(),
        });

        if (res.status === 401) {
          console.error('🔐 401: Token invalide ou expiré');
          localStorage.removeItem('token');
          navigate('/login', { replace: true });
          return;
        }

        if (res.status === 404) {
          console.warn(`🔔 Notification ${id} non trouvée`);
          navigate('/notifications', { replace: true });
          return;
        }

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        setNotification(data);
      } catch (error) {
        console.error('❌ Erreur chargement notification:', error);
        navigate('/notifications', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    fetchNotification();
  }, [navigate]); // 🔥 On ne dépend plus de `id`, car on le lit depuis l’URL

  const handleBack = () => {
    navigate(-1);
  };

  const handleRedirect = () => {
    if (notification?.target_url) {
      window.open(notification.target_url, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-3 text-gray-600">Chargement...</span>
      </div>
    );
  }

  if (!notification) {
    return (
      <div className="p-6 text-center text-gray-500">
        Notification introuvable ou déjà supprimée.
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={handleBack}>
          Retour
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <h1 className="text-2xl font-bold text-gray-900">Détail de la notification</h1>
            <Badge variant="secondary" size="sm">
              {notification.is_read ? 'Lu' : 'Non lu'}
            </Badge>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500">Expéditeur</label>
            <p className="text-lg font-medium">{notification.actor}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500">Action</label>
            <p className="text-lg">{notification.verb}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500">Type</label>
            <Badge variant="primary" size="sm">
              {notification.notification_type}
            </Badge>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500">Date</label>
            <p className="text-sm text-gray-600">
              {new Date(notification.created_at).toLocaleString('fr-FR')}
            </p>
          </div>

          {notification.target_url && (
            <div className="pt-4">
              <Button
                variant="outline"
                size="sm"
                icon={ExternalLink}
                onClick={handleRedirect}
              >
                Voir dans l’application
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};