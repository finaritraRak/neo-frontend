// src/components/admin/Dashboard.tsx (ou le chemin que vous utilisez)
import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, UserPlus, BarChart3, MapPin, Calendar, Building, Zap } from 'lucide-react';
import { StatsCard } from './StatsCard';
import { UserTable } from './UserTable';
import { Card } from '../ui/Card';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line
} from 'recharts';
import api from '../../apiService';

// Types
interface Site {
  id: number;
  name: string;
  company_name: string;
  topology: string;
  location: string;
  is_active: boolean;
}

interface EnergyReading {
  id: number;
  site: number;
  site_name: string;
  timestamp: string;
  total_load_kwh: number | null;
  pv_production_kwh: number | null;
  genset_kwh: number | null;
  battery_kwh: number | null;
  pv_theoretical_kwh: number | null;
  is_valid: boolean;
}

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  newRegistrations: number;
  totalSites: number;
  activeSites: number;
  totalReadings: number;
}

export const AdminDashboard: React.FC<{ stats?: any }> = ({ stats: initialStats }) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    newRegistrations: 0,
    totalSites: 0,
    activeSites: 0,
    totalReadings: 0,
  });
  const [sites, setSites] = useState<Site[]>([]);
  const [readings, setReadings] = useState<EnergyReading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Récupérer les sites
        const sitesRes = await api.get('/sites/');
        const sitesData: Site[] = sitesRes.data;

        // 2. Récupérer les lectures énergétiques (limitées aux 100 dernières pour performance)
        const readingsRes = await api.get('/energy/readings/', {
          params: { ordering: '-timestamp', page_size: 100 }
        });
        const readingsData: EnergyReading[] = readingsRes.data.results || readingsRes.data;

        // 3. Calculer les stats
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const newRegistrations = initialStats?.newRegistrations || 0; // ou à récupérer via /users/ si besoin

        const dashboardStats: DashboardStats = {
          totalUsers: initialStats?.totalUsers || 0,
          activeUsers: initialStats?.activeUsers || 0,
          newRegistrations,
          totalSites: sitesData.length,
          activeSites: sitesData.filter(s => s.is_active).length,
          totalReadings: readingsData.length,
        };

        setStats(dashboardStats);
        setSites(sitesData);
        setReadings(readingsData);
      } catch (err) {
        console.error('Erreur chargement dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [initialStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Chargement du tableau de bord...</div>
      </div>
    );
  }

  // Préparer les données pour le graphique de production PV (10 dernières lectures)
  const pvData = readings
    .slice(0, 10)
    .map(r => ({
      name: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      'Production réelle': r.pv_production_kwh ?? 0,
      'Production théorique': r.pv_theoretical_kwh ?? 0,
    }))
    .reverse();

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
          change={{ value: 0, type: 'increase' }}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Sites actifs"
          value={`${stats.activeSites}/${stats.totalSites}`}
          icon={Building}
          color="purple"
        />
        <StatsCard
          title="Lectures énergétiques"
          value={stats.totalReadings.toLocaleString()}
          icon={Zap}
          color="green"
        />
        <StatsCard
          title="Nouveaux utilisateurs"
          value={stats.newRegistrations.toLocaleString()}
          change={{ value: 0, type: 'increase' }}
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

      {/* Graphique PV */}
      <Card title="Production solaire (10 dernières lectures)">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={pvData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="Production réelle" fill="#10b981" />
            <Bar dataKey="Production théorique" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Liste des sites */}
      <Card title="Sites">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">Nom</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">Entreprise</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">Topologie</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">Localisation</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sites.map(site => (
                <tr key={site.id}>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{site.name}</td>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{site.company_name}</td>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{site.topology}</td>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{site.location || '—'}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      site.is_active
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                    }`}>
                      {site.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};