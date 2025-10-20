// src/components/admin/Maintenances.tsx
import React from 'react';
import { Wrench, Calendar, CheckCircle, Clock } from 'lucide-react';

export const AdminMaintenances: React.FC = () => {
  return (
    <div className="space-y-6 text-gray-900 dark:text-gray-100">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gestion de la Maintenance</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Planification et suivi des interventions</p>
        </div>
        <button className="mt-3 md:mt-0 bg-[#131635] text-white px-3 py-2 text-sm rounded-lg hover:bg-[#1a1d42] transition-colors">
          Programmer Maintenance
        </button>
      </div>

      {/* STATS COMPACTES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Programmées', count: 5, color: 'text-blue-600 dark:text-blue-400', icon: Calendar },
          { label: 'En Cours', count: 2, color: 'text-yellow-600 dark:text-yellow-400', icon: Clock },
          { label: 'Terminées', count: 12, color: 'text-green-600 dark:text-green-400', icon: CheckCircle },
          { label: 'Équipements', count: 8, color: 'text-gray-700 dark:text-gray-300', icon: Wrench },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700 flex items-center hover:shadow-md transition"
            >
              <Icon className={`w-5 h-5 mr-3 ${item.color}`} />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                <p className={`text-lg font-semibold ${item.color}`}>{item.count}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* CALENDRIER */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
        <h2 className="text-base font-semibold mb-3 text-gray-800 dark:text-gray-100">Calendrier de Maintenance</h2>
        <div className="h-56 flex items-center justify-center bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-dashed border-gray-200 dark:border-gray-600">
          <p className="text-gray-400 dark:text-gray-500 text-sm">Calendrier interactif à implémenter</p>
        </div>
      </div>

      {/* INTERVENTIONS RÉCENTES */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
        <h2 className="text-base font-semibold mb-3 text-gray-800 dark:text-gray-100">Interventions Récentes</h2>
        <div className="h-28 flex items-center justify-center bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-dashed border-gray-200 dark:border-gray-600">
          <p className="text-gray-400 dark:text-gray-500 text-sm">Liste des interventions à implémenter</p>
        </div>
      </div>
    </div>
  );
};