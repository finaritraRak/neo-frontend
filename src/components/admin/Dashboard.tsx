// src/components/admin/Dashboard.tsx
import React from 'react';

export const AdminDashboard = ({ stats }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">📈 Tableau de bord Administrateur</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">Utilisateurs: {stats?.totalUsers || 0}</div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">Actifs: {stats?.activeUsers || 0}</div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">Performances: 98%</div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">Alarmes: 0</div>
      </div>
      <p>Bienvenue, administrateur. Vous avez un accès complet à tous les modules.</p>
    </div>
  );
};