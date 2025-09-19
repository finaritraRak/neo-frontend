import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, UserPlus, BarChart3, MapPin, Calendar } from 'lucide-react';
import { StatsCard } from './StatsCard';
import { UserTable } from './UserTable';
import { DashboardStats, User } from '../../types';
import { Card } from '../ui/Card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from 'recharts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://dev.calm-adventure-tours.com/api';

// 🔑 Récupérer le token JWT
function getAuthToken(): string | null {
  return localStorage.getItem('token');
}

// 🛠️ Headers d'authentification
function getAuthHeaders() {
  const token = getAuthToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// 🔐 Vérifie si l'utilisateur est admin
const isAdmin = async (): Promise<boolean> => {
  try {
    const token = getAuthToken();
    if (!token) return false;

    const res = await fetch(`${API_BASE_URL}/auth/me/`, { headers: getAuthHeaders() });
    if (!res.ok) return false;

    const userData = await res.json();
    return userData.role === 'admin';
  } catch (err) {
    console.error('Erreur vérification rôle:', err);
    return false;
  }
};

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    newRegistrations: 0,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [tours, setTours] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);

  // 🔐 Charger toutes les données réelles
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Vérifier rôle admin
      const isUserAdmin = await isAdmin();
      setCanEdit(isUserAdmin);

      try {
        // 🔽 Utilisateurs
        const usersRes = await fetch(`${API_BASE_URL}/users/`, { headers: getAuthHeaders() });
        const usersData = await usersRes.json();
        const userList: User[] = usersData.results || usersData;

        // 🔽 Tours
        const toursRes = await fetch(`${API_BASE_URL}/tours/`, { headers: getAuthHeaders() });
        const toursData = await toursRes.json();
        const tourList = toursData.results || toursData;

        // 🔽 Articles de blog
        const postsRes = await fetch(`${API_BASE_URL}/blog/posts/`, { headers: getAuthHeaders() });
        const postsData = await postsRes.json();
        const postList = postsData.results || postsData;

        // 📊 Calculer stats utilisateurs
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const statsData = {
          totalUsers: userList.length,
          activeUsers: userList.filter(u => u.status === 'active').length,
          newRegistrations: userList.filter(u => new Date(u.created_at) >= thirtyDaysAgo).length,
        };

        // 🎯 Répartition des tours par destination
        const destinationCount: Record<string, number> = {};
        tourList.forEach((tour: any) => {
          const dest = tour.destination?.name || 'Inconnue';
          destinationCount[dest] = (destinationCount[dest] || 0) + 1;
        });

        const tourByDestination = Object.entries(destinationCount).map(([name, value]) => ({
          name,
          tours: value,
        }));

        // 📈 Articles de blog par date (30 derniers jours)
        const monthlyPosts: Record<string, number> = {};
        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

        postList.forEach((post: any) => {
          const date = new Date(post.created_at);
          const month = monthNames[date.getMonth()];
          monthlyPosts[month] = (monthlyPosts[month] || 0) + 1;
        });

        const blogGrowthData = monthNames
          .slice(0, new Date().getMonth() + 1)
          .map(month => ({ month, articles: monthlyPosts[month] || 0 }));

        // ✅ Stocker toutes les données
        setStats(statsData);
        setUsers(userList);
        setTours(tourList);
        setPosts(postList);
        (window as any).__dashboard__ = { tourByDestination, blogGrowthData };
      } catch (err) {
        console.error('Erreur chargement dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Chargement du tableau de bord...</div>
      </div>
    );
  }

  const { tourByDestination = [], blogGrowthData = [] } = (window as any).__dashboard__;

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tableau de bord</h1>
        <p className="text-gray-600 mt-1 dark:text-gray-300">Vue d'ensemble de votre activité</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatsCard
          title="Utilisateurs totaux"
          value={stats.totalUsers.toLocaleString()}
          change={{ value: 12.5, type: 'increase' }}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Tours disponibles"
          value={tours.length.toString()}
          icon={MapPin}
          color="purple"
        />
        <StatsCard
          title="Articles de blog"
          value={posts.length.toString()}
          icon={Calendar}
          color="green"
        />
        <StatsCard
          title="Nouveaux utilisateurs"
          value={stats.newRegistrations.toLocaleString()}
          change={{ value: 3.1, type: 'decrease' }}
          icon={UserPlus}
          color="orange"
        />
        <StatsCard
          title="Visites estimées"
          value="1.2k"
          icon={BarChart3}
          color="red"
        />
      </div>

      {/* Tableau utilisateurs */}
      <UserTable users={users} canEdit={canEdit} onRefresh={() => window.location.reload()} />
    </div>
  );
};