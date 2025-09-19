// src/components/layout/Header.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, Menu, LogOut, X, Loader2, BookOpen, Mountain, Users } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { User as UserType } from '../../types';
import { useUnreadNotifications } from '../../hooks/useUnreadNotifications';
import { Notification } from '../../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

interface SearchResult {
  id: number;
  title: string;
  subtitle: string;
  type: 'blog' | 'tour' | 'user';
  url: string;
}

function getAuthToken(): string | null {
  return localStorage.getItem('token');
}

function getAuthHeaders() {
  const token = getAuthToken();
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : {};
}

const formatRelativeTime = (dateString: string): string => {
  const now = new Date();
  const created = new Date(dateString);
  const diffInMs = now.getTime() - created.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return 'À l\'instant';
  if (diffInMinutes < 60) return `${diffInMinutes} min`;
  if (diffInHours < 24) return `${diffInHours} h`;
  if (diffInDays < 7) return `${diffInDays} j`;
  return created.toLocaleDateString('fr-FR');
};

export const Header: React.FC<{
  user: UserType;
  onToggleSidebar: () => void;
  onLogout: () => void;
  onNavigate: (path: string) => void;
}> = ({ user, onToggleSidebar, onLogout, onNavigate }) => {
  const { unreadCount, refetch } = useUnreadNotifications();
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const notifDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevUnreadCountRef = useRef<number>(0); // 🔁 Référence pour comparer

  const isAdmin = user.role === 'admin';

  const [allBlogs, setAllBlogs] = useState<{ id: number; title: string }[]>([]);
  const [allTours, setAllTours] = useState<{
    id: number;
    name: string;
    description?: string;
    destination?: { name: string };
  }[]>([]);
  const [allUsers, setAllUsers] = useState<UserType[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const blogRes = await fetch(`${API_BASE_URL}/blog/posts/`, { headers: getAuthHeaders() });
        const blogData = await blogRes.json();
        setAllBlogs(blogData.results || blogData);

        const toursRes = await fetch(`${API_BASE_URL}/tours/`, { headers: getAuthHeaders() });
        const toursData = await toursRes.json();
        setAllTours(toursData.results || toursData);

        if (isAdmin) {
          const usersRes = await fetch(`${API_BASE_URL}/users/`, { headers: getAuthHeaders() });
          const usersData = await usersRes.json();
          setAllUsers(usersData.results || usersData);
        }
      } catch (err) {
        console.error('❌ Erreur chargement données recherche:', err);
      }
    };

    fetchData();
  }, [isAdmin]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    const query = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    const blogResults = allBlogs
      .filter((p) => p.title && p.title.toLowerCase().includes(query))
      .map((p) => ({
        id: p.id,
        title: p.title,
        subtitle: 'Article de blog',
        type: 'blog' as const,
        url: `/blog/edit/${p.id}`,
      }));
    results.push(...blogResults);

    const tourResults = allTours
      .filter((t) =>
        (t.name && t.name.toLowerCase().includes(query)) ||
        (t.description && t.description.toLowerCase().includes(query))
      )
      .map((t) => ({
        id: t.id,
        title: t.name || 'Tour sans nom',
        subtitle: t.destination?.name || 'Tour',
        type: 'tour' as const,
        url: `/tours/edit/${t.id}`,
      }));
    results.push(...tourResults);

    if (isAdmin) {
      const userResults = allUsers
        .filter((u) =>
          (u.first_name && u.first_name.toLowerCase().includes(query)) ||
          (u.last_name && u.last_name.toLowerCase().includes(query)) ||
          (u.email && u.email.toLowerCase().includes(query))
        )
        .map((u) => ({
          id: u.id,
          title: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
          subtitle: u.email,
          type: 'user' as const,
          url: `/users/edit/${u.id}`,
        }));
      results.push(...userResults);
    }

    setSearchResults(results);
    setShowSearchResults(true);
    setIsSearching(false);
  }, [searchQuery, allBlogs, allTours, allUsers, isAdmin]);

  useEffect(() => {
    audioRef.current = new Audio('/admin-panel/sounds/notification.mp3');
  }, []);

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        console.warn('🔇 Son bloqué par le navigateur');
      });
    }
  };

  useEffect(() => {
    if (unreadCount > 0 && unreadCount > prevUnreadCountRef.current) {
      playNotificationSound();
    }
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount]);

  const loadNotifications = async () => {
    if (notifDropdownOpen) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Erreur réseau');

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Réponse non-JSON');
      }

      const data: any = await res.json();
      const notifData = Array.isArray(data) ? data : data.results || [];

      setNotifications(notifData);
    } catch (error) {
      console.error('❌ Erreur chargement notifications', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleNotifDropdown = () => {
    const newOpen = !notifDropdownOpen;
    setNotifDropdownOpen(newOpen);
    if (newOpen) loadNotifications();
  };

  // Gestion du clic en dehors des dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setNotifDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (searchResultsRef.current && !searchResultsRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/${id}/read/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      refetch();
    } catch (error) {
      console.error('❌ Erreur lecture notification', error);
    }
  };

  const handleNotificationClick = (id: number) => {
    markAsRead(id);
    onNavigate(`/notifications/detail/${id}`);
    setNotifDropdownOpen(false);
  };

  const handleResultClick = (result: SearchResult) => {
    window.location.href = `/admin-panel/search-result?type=${result.type}&id=${result.id}`;
  };

  const getAvatarDisplay = () => {
    if (user.avatar_url) {
      return (
        <img
          src={user.avatar_url}
          alt={`${user.first_name} ${user.last_name}`}
          className="h-10 w-10 rounded-full object-cover"
        />
      );
    }
    const firstLetter = user.first_name?.[0]?.toUpperCase() || user.last_name?.[0]?.toUpperCase() || '?';
    return (
      <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-sm">
        {firstLetter}
      </div>
    );
  };

  return (
    <>
      <audio ref={audioRef} preload="auto" />
      <header className="bg-white dark:bg-gray-800 dark:border-gray-700 border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onToggleSidebar}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>

            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Rechercher dans tout le site..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery && setShowSearchResults(true)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ minWidth: '300px' }}
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearchResults(false);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-400"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {showSearchResults && (
                <div ref={searchResultsRef} className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 dark:border-gray-700 border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
                  <div className="p-2 border-b dark:border-gray-700 border-gray-100 bg-gray-50 dark:bg-gray-900 text-sm text-gray-600 dark:text-gray-400">
                    {isSearching ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Recherche en cours...
                      </div>
                    ) : (
                      `${searchResults.length} résultat(s)`
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {searchResults.length === 0 && !isSearching ? (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">Aucun résultat trouvé</div>
                    ) : (
                      searchResults.map((result) => (
                        <button
                          key={`${result.type}-${result.id}`}
                          onClick={() => handleResultClick(result)}
                          className="w-full p-3 border-b dark:border-gray-700 border-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex items-start gap-3 transition text-left"
                          style={{ outline: 'none' }}
                        >
                          <div className={`p-2 rounded-full ${
                            result.type === 'blog' ? 'bg-green-100 text-green-600' :
                            result.type === 'tour' ? 'bg-blue-100 text-blue-600' :
                            'bg-purple-100 text-purple-600'
                          } dark:bg-opacity-20 dark:text-white`}>
                            {result.type === 'blog' && <BookOpen className="w-4 h-4" />}
                            {result.type === 'tour' && <Mountain className="w-4 h-4" />}
                            {result.type === 'user' && <Users className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 dark:text-gray-100 truncate">{result.title}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{result.subtitle}</div>
                            <Badge variant="secondary" size="sm" className="mt-1 dark:bg-gray-700 dark:text-gray-300">
                              {result.type === 'blog' ? 'Blog' : result.type === 'tour' ? 'Tour' : 'Utilisateur'}
                            </Badge>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 relative">
            {/* Notifications Dropdown */}
            <div className="relative" ref={notifDropdownRef}>
              <button
                onClick={toggleNotifDropdown}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 relative"
                aria-expanded={notifDropdownOpen}
              >
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 dark:border-gray-700 border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
                  <div className="p-3 border-b dark:border-gray-700 border-gray-100">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">Notifications</h3>
                  </div>

                  <div className="max-h-60 overflow-y-auto">
                    {loading ? (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">Chargement...</div>
                    ) : notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">Aucune notification</div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif.id)}
                          className={`p-3 border-b dark:border-gray-700 border-gray-100 cursor-pointer transition ${
                            notif.is_read 
                              ? 'bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700' 
                              : 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-l-blue-500 dark:border-l-blue-700'
                          }`}
                        >
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{notif.actor}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatRelativeTime(notif.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-800 dark:text-gray-200 mt-1">{notif.verb}</p>
                          {!notif.is_read && (
                            <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                              Nouveau
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2 border-t dark:border-gray-700 border-gray-100 bg-gray-50 dark:bg-gray-900">
                    <button
                      onClick={() => {
                        onNavigate('/notifications');
                        setNotifDropdownOpen(false);
                      }}
                      className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      Voir toutes les notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ✅ Profil Dropdown — CORRIGÉ : encapsulé dans un conteneur RELATIF, dropdown en ABSOLU en dessous */}
            <div className="relative" ref={profileDropdownRef}>
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => setProfileDropdownOpen(prev => !prev)}
              >
                {getAvatarDisplay()}
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {user.first_name} {user.last_name}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="primary" size="sm" className="dark:bg-blue-900 dark:text-blue-200">
                      {user.role}
                    </Badge>
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{user.email}</span>
                  </div>
                </div>
              </div>

              {profileDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 dark:border-gray-700 border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                  <button
                    onClick={() => {
                      onNavigate('/profile');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm"
                  >
                    Mon Profil
                  </button>
                  <div className="border-t dark:border-gray-700 border-gray-100"></div>
                  <button
                    onClick={onLogout}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-red-600 dark:text-red-400 text-sm flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};