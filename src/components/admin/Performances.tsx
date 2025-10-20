// src/components/admin/Performances.tsx
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
} from 'recharts';
import { BarChart3, TrendingUp, Zap } from 'lucide-react';
import api from '../../apiService';

interface PerformanceData {
  production: number;
  consommation: number;
  autoconsommation: number;
  importReseau: number;
  efficacite: number;
}

// Tooltip personnalisé compatible sombre
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

export const AdminPerformances: React.FC = () => {
  const [data, setData] = useState<PerformanceData>({
    production: 0,
    consommation: 0,
    autoconsommation: 0,
    importReseau: 0,
    efficacite: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);

  const convertToKWh = (values: number[]) => values.reduce((acc, val) => acc + val, 0) / 6;

  useEffect(() => {
    const loadData = async () => {
      try {
        const siteId = 1;
        const response = await api.get(`/sites/${siteId}/`);
        const details = response.data;

        const rawData = details.data || [];
        const productionValues = rawData.map((r: any) => parseFloat(r.pv_production || 0));
        const consommationValues = rawData.map((r: any) => parseFloat(r.load || 0));

        const productionKWh = convertToKWh(productionValues);
        const consommationKWh = convertToKWh(consommationValues);

        const autoconsommation = Math.min(productionKWh, consommationKWh);
        const importReseau = consommationKWh - autoconsommation;
        const efficacite = consommationKWh > 0 ? (autoconsommation / consommationKWh) * 100 : 0;

        const grouped: Record<number, { prod: number; cons: number; count: number }> = {};
        rawData.forEach((r: any) => {
          const hour = new Date(r.time).getHours();
          if (!grouped[hour]) grouped[hour] = { prod: 0, cons: 0, count: 0 };
          grouped[hour].prod += parseFloat(r.pv_production || 0);
          grouped[hour].cons += parseFloat(r.load || 0);
          grouped[hour].count += 1;
        });

        const hourlyData = Object.entries(grouped).map(([hour, val]) => ({
          name: `${hour}h`,
          production: +(val.prod / val.count).toFixed(2),
          consommation: +(val.cons / val.count).toFixed(2),
        }));

        setData({
          production: productionKWh,
          consommation: consommationKWh,
          autoconsommation,
          importReseau,
          efficacite,
        });
        setChartData(hourlyData);
      } catch (error) {
        console.error('Erreur chargement performances:', error);
      }
    };

    loadData();
  }, []);

  return (
    <div className="space-y-6 text-gray-900 dark:text-gray-100">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Performances Énergétiques</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Suivi en temps réel de la production et de la consommation
          </p>
        </div>
        <button className="mt-3 md:mt-0 bg-gradient-to-r from-[#131635] to-[#1a1d42] text-white px-4 py-2 text-sm rounded-lg hover:opacity-90 transition">
          Exporter les données
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { title: 'Production', value: `${data.production.toFixed(1)} kWh`, icon: BarChart3, color: 'from-blue-500 to-blue-700' },
          { title: 'Consommation', value: `${data.consommation.toFixed(1)} kWh`, icon: Zap, color: 'from-yellow-400 to-yellow-600' },
          { title: 'Autoconsommation', value: `${data.autoconsommation.toFixed(1)} kWh`, icon: TrendingUp, color: 'from-green-400 to-green-600' },
          { title: 'Import Réseau', value: `${data.importReseau.toFixed(1)} kWh`, icon: Zap, color: 'from-red-400 to-red-600' },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div
              key={i}
              className={`bg-gradient-to-r ${kpi.color} rounded-xl p-4 flex items-center shadow-md hover:scale-105 transition-transform`}
            >
              <div className="bg-white bg-opacity-20 dark:bg-black/20 p-2 rounded-lg">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-3 text-white">
                <p className="text-xs opacity-90">{kpi.title}</p>
                <p className="text-lg font-bold">{kpi.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production vs Consommation */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Production vs Consommation</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                <XAxis
                  dataKey="name"
                  stroke="#6b7280"
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis stroke="#6b7280" tick={{ fill: 'currentColor' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="production" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="consommation" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Efficacité */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Efficacité (%)</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[{ name: 'Aujourd’hui', efficacite: data.efficacite }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                <XAxis
                  dataKey="name"
                  stroke="#6b7280"
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis domain={[0, 100]} stroke="#6b7280" tick={{ fill: 'currentColor' }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="efficacite" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};