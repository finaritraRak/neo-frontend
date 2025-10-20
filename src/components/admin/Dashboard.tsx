// src/components/admin/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Zap, TrendingUp, AlertTriangle, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../apiService';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

interface Site {
  id: number;
  name: string;
  location: string;
  is_active: boolean;
  company_name: string;
}

interface EnergyReading {
  id: number;
  timestamp: string;
  total_load_kwh: number | null;
  pv_production_kwh: number | null;
  pv_theoretical_kwh: number | null;
  battery_kwh: number | null;
  genset_kwh: number | null;
  is_valid: boolean;
}

interface Alarm {
  id: number;
  alarm_type: string;
  is_active: boolean;
  triggered_at: string;
}

export const AdminDashboard = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<number | null>(null);
  const [energyData, setEnergyData] = useState<any[]>([]);
  const [efficiencyData, setEfficiencyData] = useState<any[]>([]);
  const [alertData, setAlertData] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const loadSites = async () => {
      setLoading(true);
      try {
        const response = await api.get('/api/sites/');
        const sitesList = Array.isArray(response.data) ? response.data : [];
        setSites(sitesList);
        if (sitesList.length > 0) {
          setSelectedSite(sitesList[0].id);
        }
      } catch (error: any) {
        console.error('❌ Erreur chargement sites:', error);
        setSites([]);
      } finally {
        setLoading(false);
      }
    };
    loadSites();
  }, []);

  useEffect(() => {
    if (selectedSite === null) return;

    const loadData = async () => {
      try {
        const energyRes = await api.get('/energy/readings/', {
          params: { site: selectedSite, ordering: '-timestamp', page_size: 500 }
        });
        let energyReadings: EnergyReading[] = [];
        if (Array.isArray(energyRes.data)) {
          energyReadings = energyRes.data;
        } else if (Array.isArray(energyRes.data.results)) {
          energyReadings = energyRes.data.results;
        }

        const alarmsRes = await api.get('/alarms/', {
          params: { site: selectedSite, is_active: 'true' }
        });
        let alarms: Alarm[] = [];
        if (Array.isArray(alarmsRes.data)) {
          alarms = alarmsRes.data;
        } else if (Array.isArray(alarmsRes.data.results)) {
          alarms = alarmsRes.data.results;
        }

        processEnergyData(energyReadings);
        processEfficiencyData(energyReadings);
        processAlertData(alarms);
      } catch (error: any) {
        console.error('❌ Erreur chargement données site:', error);
        setEnergyData([]);
        setEfficiencyData([]);
        setAlertData([]);
      }
    };

    loadData();
  }, [selectedSite]);

  const safeFloat = (val: number | null): number => {
    return val ?? 0;
  };

  const processEnergyData = (readings: EnergyReading[]) => {
    if (readings.length === 0) {
      setEnergyData([]);
      return;
    }

    const grouped: Record<number, { count: number; loadSum: number; productionSum: number }> = {};

    readings.forEach((row) => {
      const hour = new Date(row.timestamp).getHours();
      if (!grouped[hour]) {
        grouped[hour] = { count: 0, loadSum: 0, productionSum: 0 };
      }
      grouped[hour].count += 1;
      grouped[hour].productionSum += safeFloat(row.pv_production_kwh);
      grouped[hour].loadSum += safeFloat(row.total_load_kwh);
    });

    const chartData = [];
    for (let h = 0; h < 24; h++) {
      if (grouped[h]) {
        chartData.push({
          name: `${h}h`,
          consommation: +(grouped[h].loadSum / grouped[h].count).toFixed(2),
          production: +(grouped[h].productionSum / grouped[h].count).toFixed(2),
        });
      } else {
        chartData.push({ name: `${h}h`, consommation: 0, production: 0 });
      }
    }
    setEnergyData(chartData);
  };

  const processEfficiencyData = (readings: EnergyReading[]) => {
    if (readings.length === 0) {
      setEfficiencyData([]);
      return;
    }

    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const daily: Record<string, { total: number; count: number }> = {};

    readings.forEach((row) => {
      const day = days[new Date(row.timestamp).getDay()];
      if (!daily[day]) daily[day] = { total: 0, count: 0 };
      const prod = safeFloat(row.pv_production_kwh);
      const load = safeFloat(row.total_load_kwh);
      const eff = load > 0 ? (prod / load) * 100 : 0;
      daily[day].total += eff;
      daily[day].count += 1;
    });

    const data = days.map((day) => ({
      name: day,
      efficacite: daily[day] ? +(daily[day].total / daily[day].count).toFixed(1) : 0,
    }));
    setEfficiencyData(data);
  };

  const processAlertData = (alarms: Alarm[]) => {
    const typeMap: Record<string, string> = {
      meter_disconnected: 'Compteur déconnecté',
      pv_cutting: 'Écrêtage PV',
      battery_fault: 'Anomalie batterie',
      low_production: 'Production basse',
      overload: 'Surcharge',
    };

    const counts: Record<string, number> = {};
    alarms.forEach((alarm) => {
      const label = typeMap[alarm.alarm_type] || alarm.alarm_type;
      counts[label] = (counts[label] || 0) + 1;
    });

    const data = Object.entries(counts).map(([name, value]) => ({ name, value }));
    setAlertData(data);
  };

  const handleCardClick = (title: string) => {
    if (title === 'Alarmes Actives') navigate('/admin/alarmes');
  };

  const totalProduction = energyData.reduce((acc, d) => acc + d.production, 0);
  const totalConsumption = energyData.reduce((acc, d) => acc + d.consommation, 0);
  const avgEfficiency = efficiencyData.length
    ? efficiencyData.reduce((acc, d) => acc + d.efficacite, 0) / efficiencyData.length
    : 0;
  const totalActiveAlarms = alertData.reduce((acc, d) => acc + d.value, 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow">
          <p className="font-medium text-gray-900 dark:text-gray-100">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-semibold">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading && sites.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-gray-900 dark:text-gray-100">
      <div className="space-y-5">
        <div
          className="relative bg-cover bg-center overflow-hidden w-full rounded-lg"
          style={{
            backgroundImage: 'url(https://images.pexels.com/photos/356049/pexels-photo-356049.jpeg)',
          }}
        >
          <div className="absolute inset-0 bg-[#131635] bg-opacity-80"></div>
          <div className="relative z-10 p-5 text-white max-w-full">
            <div className="flex flex-col md:flex-row items-center md:items-start md:justify-between">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full md:w-2/3">
                {[
                  {
                    title: 'Production Totale',
                    value: `${totalProduction.toFixed(2)} kWh`,
                    change: '+12.5%',
                    icon: Sun,
                    color: 'text-yellow-400',
                    bgColor: 'bg-yellow-500/20',
                  },
                  {
                    title: 'Consommation',
                    value: `${totalConsumption.toFixed(2)} kWh`,
                    change: '-3.2%',
                    icon: Zap,
                    color: 'text-blue-400',
                    bgColor: 'bg-blue-500/20',
                  },
                  {
                    title: 'Efficacité',
                    value: `${avgEfficiency.toFixed(1)}%`,
                    change: '+5.1%',
                    icon: TrendingUp,
                    color: 'text-green-400',
                    bgColor: 'bg-green-500/20',
                  },
                  {
                    title: 'Alarmes Actives',
                    value: totalActiveAlarms,
                    change: '-2',
                    icon: AlertTriangle,
                    color: 'text-red-400',
                    bgColor: 'bg-red-500/20',
                  },
                ].map((stat, index) => {
                  const Icon = stat.icon;
                  const clickable = stat.title === 'Alarmes Actives';
                  return (
                    <div
                      key={index}
                      onClick={() => clickable && handleCardClick(stat.title)}
                      className={`rounded-lg shadow-sm p-3 border border-gray-200 text-white text-sm
                        ${clickable ? 'cursor-pointer hover:bg-white/10 transition' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-gray-200">{stat.title}</p>
                          <p className="text-lg font-bold mt-1">{stat.value}</p>
                          <p
                            className={`text-xs mt-1 ${
                              stat.change.startsWith('+') ? 'text-green-300' : 'text-red-300'
                            }`}
                          >
                            {stat.change} vs mois dernier
                          </p>
                        </div>
                        <div className={`${stat.bgColor} ${stat.color} p-2 rounded-lg`}>
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3">Sites</h3>
            {sites.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucun site trouvé.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {sites.map((site) => (
                  <li
                    key={site.id}
                    onClick={() => setSelectedSite(site.id)}
                    className={`p-2 rounded-lg cursor-pointer transition ${
                      selectedSite === site.id
                        ? 'bg-blue-500/20 border border-blue-500 dark:border-blue-400'
                        : 'bg-gray-100 dark:bg-gray-700/50'
                    }`}
                  >
                    <p className="font-medium text-gray-900 dark:text-gray-100">{site.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{site.location || '—'}</p>
                    <span
                      className={`text-[10px] font-medium px-2 py-1 mt-1 inline-block rounded-full ${
                        site.is_active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}
                    >
                      {site.is_active ? 'En ligne' : 'Hors ligne'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Production vs Consommation (kWh)
              </h3>
              {energyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={energyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                    <XAxis
                      dataKey="name"
                      stroke="#6b7280"
                      tick={{ fill: 'currentColor' }}
                    />
                    <YAxis stroke="#6b7280" tick={{ fill: 'currentColor' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="production" fill="#3B82F6" name="Production" />
                    <Bar dataKey="consommation" fill="#F59E0B" name="Consommation" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-sm">Aucune donnée énergétique disponible.</p>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Efficacité Hebdomadaire
              </h3>
              {efficiencyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={efficiencyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                    <XAxis
                      dataKey="name"
                      stroke="#6b7280"
                      tick={{ fill: 'currentColor' }}
                    />
                    <YAxis domain={[0, 100]} stroke="#6b7280" tick={{ fill: 'currentColor' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="efficacite" stroke="#10B981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-sm">Aucune donnée d'efficacité disponible.</p>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Alertes par Type
              </h3>
              {alertData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={alertData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {alertData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-sm">Aucune alerte active.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};