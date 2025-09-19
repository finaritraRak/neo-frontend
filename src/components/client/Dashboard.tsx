// src/components/client/Dashboard.tsx
import React, { useState } from 'react';
import { Synoptique3D } from './Synoptique3D';

type SiteType = 'solaire_batterie' | 'solaire_ge_batterie' | 'solaire_groupe_jirama';

export function ClientDashboard() {
  const [selectedSite, setSelectedSite] = useState<SiteType>('solaire_batterie');

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Tableau de bord Client</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Visualisez l’état de votre installation en temps réel.
        </p>
      </div>

      {/* Sélecteur de site */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Choisir votre configuration :
        </label>
        <select
          value={selectedSite}
          onChange={(e) => setSelectedSite(e.target.value as SiteType)}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-red-500"
        >
          <option value="solaire_batterie">Panneau Solaire + Batterie</option>
          <option value="solaire_ge_batterie">Panneau Solaire + GE + Batterie</option>
          <option value="solaire_groupe_jirama">Panneau Solaire + Groupe + JIRAMA</option>
        </select>
      </div>

      {/* Synoptique 3D */}
      <div>
        <Synoptique3D siteType={selectedSite} />
      </div>

      {/* Infos supplémentaires */}
      <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold text-blue-800 dark:text-blue-200">ℹ️ À propos du synoptique</h3>
        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
          Ce schéma isométrique représente votre installation. Survolez les éléments pour les animer.
          Dans les prochaines versions, nous ajouterons des données en temps réel, des alertes et des
          interactions avancées.
        </p>
      </div>
    </div>
  );
}