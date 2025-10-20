// src/components/admin/Rapports.tsx
import React from 'react';
import { FileText, Download, Calendar, BarChart } from 'lucide-react';

export const AdminRapports: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 font-sans space-y-10 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight mb-1">
          Rapports et Analyses
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm max-w-xl">
          Génération et exportez facilement des rapports détaillés pour vos analyses.
        </p>
      </header>

      {/* Statistiques compactes */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
        {[
          { label: 'Rapports générés', icon: FileText, count: 24, color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Téléchargements', icon: Download, count: 156, color: 'text-green-600 dark:text-green-400' },
          { label: 'Ce mois', icon: Calendar, count: 8, color: 'text-purple-600 dark:text-purple-400' },
          { label: 'Analyses', icon: BarChart, count: 12, color: 'text-orange-600 dark:text-orange-400' },
        ].map(({ label, icon: Icon, count, color }, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 flex items-center space-x-4
            hover:shadow-md transition-shadow cursor-default"
            style={{ minHeight: 90, maxWidth: 150 }}
          >
            <div className={`p-2 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center ${color}`}>
              <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">{label}</p>
              <p className={`text-xl font-semibold ${color}`}>{count}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Section Générer et Récents */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Générer un rapport */}
        <article className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-5 text-gray-900 dark:text-gray-100">Générer un Rapport</h2>
          <form className="space-y-5">
            {[
              {
                label: 'Type de rapport',
                options: [
                  'Rapport de performance',
                  "Rapport d'alarmes",
                  'Rapport de maintenance',
                  'Rapport utilisateurs',
                ],
              },
              {
                label: 'Période',
                options: ['Dernière semaine', 'Dernier mois', 'Dernier trimestre', 'Personnalisée'],
              },
              {
                label: 'Format',
                options: ['PDF', 'Excel', 'CSV'],
              },
            ].map(({ label, options }, idx) => (
              <div key={idx}>
                <label
                  htmlFor={label.replace(/\s+/g, '').toLowerCase()}
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  {label}
                </label>
                <select
                  id={label.replace(/\s+/g, '').toLowerCase()}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                    focus:outline-none focus:ring-2 focus:ring-[#131635] focus:border-transparent"
                >
                  {options.map((opt, i) => (
                    <option key={i} className="dark:bg-gray-700 dark:text-gray-100">{opt}</option>
                  ))}
                </select>
              </div>
            ))}

            <button
              type="submit"
              className="w-full bg-[#131635] text-white py-2 rounded-md font-semibold text-sm
                hover:bg-[#1a1d42] transition-colors shadow-sm"
            >
              Générer le rapport
            </button>
          </form>
        </article>

        {/* Rapports récents */}
        <article className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-5 text-gray-900 dark:text-gray-100">Rapports Récents</h2>
          <div className="space-y-4">
            {[
              {
                title: 'Performance Janvier',
                date: '15/01/2024',
                color: 'text-blue-600 dark:text-blue-400',
              },
              {
                title: 'Alarmes Décembre',
                date: '31/12/2023',
                color: 'text-green-600 dark:text-green-400',
              },
              {
                title: 'Maintenance Q4',
                date: '28/12/2023',
                color: 'text-purple-600 dark:text-purple-400',
              },
            ].map(({ title, date, color }, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <div className="flex items-center space-x-3">
                  <FileText className={`w-5 h-5 ${color}`} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{date}</p>
                  </div>
                </div>
                <button
                  aria-label={`Télécharger ${title}`}
                  className="text-[#131635] hover:text-[#1a1d42] dark:text-[#60A5FA] dark:hover:text-[#93C5FD] transition"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
};