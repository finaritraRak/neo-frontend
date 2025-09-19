// src/components/notifications/NotificationsPage.tsx
import React, { useEffect, useState } from 'react';
import { Notification } from '../../types';
import { Button } from '../ui/Button';
import { Search, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatRelativeTime } from '../../utils/dateUtils';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : {};
};

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'read' | 'unread'>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Erreur réseau');
      const data = await res.json();
      const notifData = Array.isArray(data) ? data : data.results || [];
      setNotifications(notifData);
    } catch (error) {
      console.error('Erreur chargement notifications', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await fetch(`${API_BASE_URL}/notifications/${id}/read/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Erreur marquage comme lu');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch(`${API_BASE_URL}/notifications/mark-all-read/`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setSelectedIds([]);
    } catch (err) {
      console.error('Erreur marquage global');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Supprimer cette notification ?')) return;
    try {
      await fetch(`${API_BASE_URL}/notifications/${id}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
      setSelectedIds(ids => ids.filter(i => i !== id));
    } catch (err) {
      console.error('Erreur suppression');
    }
  };

  const handleDeleteSelected = async () => {
    if (!window.confirm(`Supprimer ${selectedIds.length} notification(s) ?`)) return;
    try {
      await Promise.all(
        selectedIds.map(id =>
          fetch(`${API_BASE_URL}/notifications/${id}/`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
          })
        )
      );
      setNotifications(prev => prev.filter(n => !selectedIds.includes(n.id)));
      setSelectedIds([]);
    } catch (err) {
      console.error('Erreur suppression multiple');
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // ✅ Sélectionner/désélectionner toutes les notifications affichées
  const toggleSelectAll = () => {
    if (filteredNotifications.length === 0) return;
    const allIds = filteredNotifications.map(n => n.id);
    if (selectedIds.length === allIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allIds);
    }
  };

  // 🔍 Calcul des dates pour les filtres rapides
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);

  // 🔍 Filtrage avancé
  const filteredNotifications = notifications
    .filter(n => {
      const createdAt = new Date(n.created_at);
      let dateMatch = true;

      if (dateFilter === 'today') {
        const start = new Date(today);
        start.setHours(0, 0, 0, 0);
        const end = new Date(today);
        end.setHours(23, 59, 59, 999);
        dateMatch = createdAt >= start && createdAt <= end;
      } else if (dateFilter === 'week') {
        const end = new Date(today);
        end.setHours(23, 59, 59, 999);
        dateMatch = createdAt >= startOfWeek && createdAt <= end;
      } else if (dateFilter === 'month') {
        const end = new Date(today);
        end.setHours(23, 59, 59, 999);
        dateMatch = createdAt >= startOfMonth && createdAt <= end;
      } else if (dateFilter === 'custom') {
        if (customStartDate) {
          const start = new Date(customStartDate);
          start.setHours(0, 0, 0, 0);
          if (createdAt < start) dateMatch = false;
        }
        if (customEndDate) {
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          if (createdAt > end) dateMatch = false;
        }
      }

      const matchesSearch = n.verb.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           n.actor.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' ||
                            (filterStatus === 'read' && n.is_read) ||
                            (filterStatus === 'unread' && !n.is_read);
      const matchesType = filterType === 'all' || n.notification_type === filterType;

      return matchesSearch && matchesStatus && matchesType && dateMatch;
    })
    .sort((a, b) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return sortBy === 'newest' ? timeB - timeA : timeA - timeB;
    });

  const hasSelected = selectedIds.length > 0;
  const allSelected = filteredNotifications.length > 0 && selectedIds.length === filteredNotifications.length;

  // 🔗 Redirection vers le détail
  const goToDetail = (id: number) => {
    window.location.href = `/admin-panel/notifications/detail/${id}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center text-gray-500">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <span className="mt-3">Chargement des notifications...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            icon={CheckCircle}
            onClick={handleMarkAllAsRead}
            disabled={notifications.every(n => n.is_read)}
          >
            Tout marquer lu
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={Trash2}
            onClick={handleDeleteSelected}
            disabled={selectedIds.length === 0}
          >
            Supprimer ({selectedIds.length})
          </Button>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-white p-5 rounded-lg shadow-sm border mb-6 space-y-5">
        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher dans les notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filtres principaux */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
          {/* ✅ Checkbox global à gauche */}
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleSelectAll}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              title="Sélectionner toutes les notifications affichées"
            />
            <span className="ml-2 text-sm text-gray-600">Tout</span>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Toutes</option>
            <option value="unread">Non lues</option>
            <option value="read">Lues</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les types</option>
            <option value="contact">Contact</option>
            <option value="booking">Réservation</option>
            <option value="blog_comment">Commentaire blog</option>
            <option value="user_registered">Nouvel utilisateur</option>
            <option value="custom">Personnalisé</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Plus récentes</option>
            <option value="oldest">Plus anciennes</option>
          </select>

          {/* Filtre date avancé */}
          <div className="space-y-2">
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value as any);
                if (e.target.value !== 'custom') {
                  setCustomStartDate('');
                  setCustomEndDate('');
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Toutes les dates</option>
              <option value="today">Aujourd’hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="custom">Personnalisé</option>
            </select>

            {dateFilter === 'custom' && (
              <div className="flex gap-2 mt-1">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="Début"
                />
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="Fin"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Liste des notifications */}
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <XCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>Aucune notification trouvée.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden divide-y divide-gray-200">
          {filteredNotifications.map(notif => (
            <div
              key={notif.id}
              className={`p-5 flex items-start gap-4 transition ${
                notif.is_read ? 'hover:bg-gray-50' : 'bg-blue-50 hover:bg-blue-100'
              }`}
            >
              {/* ✅ Checkbox individuelle alignée avec "Tout" */}
              <div className="flex items-start mt-1">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(notif.id)}
                  onChange={() => toggleSelect(notif.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>

              {/* Contenu */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-2">
                  {/* 🔗 Seul l'expéditeur est cliquable */}
                  <strong
                    onClick={(e) => {
                      e.stopPropagation();
                      goToDetail(notif.id);
                    }}
                    className="text-gray-900 hover:text-blue-700 hover:underline cursor-pointer"
                  >
                    {notif.actor}
                  </strong>
                  <span className="text-xs text-gray-500 whitespace-nowrap ml-3">
                    {formatRelativeTime(notif.created_at)}
                  </span>
                </div>
                <p
                  onClick={(e) => {
                    e.stopPropagation();
                    goToDetail(notif.id);
                  }}
                  className="text-sm text-gray-800 mb-2 cursor-pointer hover:text-gray-900"
                >
                  {notif.verb}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    notif.notification_type === 'contact' ? 'bg-purple-100 text-purple-800' :
                    notif.notification_type === 'booking' ? 'bg-green-100 text-green-800' :
                    notif.notification_type === 'blog_comment' ? 'bg-yellow-100 text-yellow-800' :
                    notif.notification_type === 'user_registered' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {notif.notification_type === 'contact' && 'Contact'}
                    {notif.notification_type === 'booking' && 'Réservation'}
                    {notif.notification_type === 'blog_comment' && 'Blog'}
                    {notif.notification_type === 'user_registered' && 'Utilisateur'}
                    {notif.notification_type === 'custom' && 'Personnalisé'}
                  </span>
                  {!notif.is_read && (
                    <span className="inline-flex items-center text-xs text-blue-700 font-medium">
                      <Clock className="w-3 h-3 mr-1" /> Nouveau
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col items-end gap-2 ml-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(notif.id);
                  }}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {!notif.is_read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead(notif.id);
                    }}
                    className="text-green-500 hover:text-green-700 p-1"
                    title="Marquer comme lu"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};