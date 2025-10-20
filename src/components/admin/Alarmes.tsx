// src/components/admin/Alarmes.tsx
import React from 'react';
import { AlertTriangle, CheckCircle, Clock, Bot, Activity } from 'lucide-react';

export const AdminAlarmes: React.FC = () => {
  const alarmes = [
    {
      id: 1,
      niveau: 'Élevée',
      titre: 'Surtension détectée',
      site: 'Somacou — Antananarivo',
      date: '15/06/2025 12:15:00',
      description: 'Le site a enregistré une surtension dépassant les seuils de sécurité.',
      recommandation: 'Vérifiez les convertisseurs de tension et redémarrez le système si nécessaire.',
      severite: 'critique',
    },
    {
      id: 2,
      niveau: 'Moyenne',
      titre: "Arrêt d'urgence",
      site: '67ha — Antananarivo',
      date: '14/06/2025 17:45:00',
      description: "Intervention nécessaire pour désactiver l'arrêt d'urgence et vérification de l'installation.",
      recommandation: 'Envisagez une recharge ou un remplacement de la batterie.',
      severite: 'moyen',
    },
    {
      id: 3,
      niveau: 'Critique',
      titre: 'Température anormale',
      site: 'Station Antsapanana — Antsapanana',
      date: '13/06/2025 15:30:00',
      description: 'Le capteur a détecté une température interne de 85°C.',
      recommandation: 'Arrêtez immédiatement le système et contrôlez la ventilation.',
      severite: 'critique',
    },
    {
      id: 4,
      niveau: 'Faible',
      titre: 'Signal réseau faible',
      site: '67ha — Antananarivo',
      date: '12/06/2025 14:00:00',
      description: 'Le système a détecté une instabilité de connexion sur le réseau GSM.',
      recommandation: 'Redémarrez le routeur ou vérifiez la carte SIM.',
      severite: 'faible',
    },
  ];

  const getSeveriteColor = (severite: string) => {
    switch (severite) {
      case 'critique':
        return 'bg-red-500/20 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      case 'moyen':
        return 'bg-yellow-400/20 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'faible':
        return 'bg-blue-400/20 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6 text-gray-900 dark:text-gray-100">
      {/* HEADER */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Alertes & Diagnostics</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Suivi des événements critiques</p>
      </div>

      {/* STATS COMPACTES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Toutes', count: alarmes.length, color: 'text-gray-700 dark:text-gray-300', icon: Activity },
          { label: 'Élevées', count: alarmes.filter(a => a.severite === 'critique').length, color: 'text-red-600 dark:text-red-400', icon: AlertTriangle },
          { label: 'Moyennes', count: alarmes.filter(a => a.severite === 'moyen').length, color: 'text-yellow-600 dark:text-yellow-400', icon: Clock },
          { label: 'Faibles', count: alarmes.filter(a => a.severite === 'faible').length, color: 'text-blue-600 dark:text-blue-400', icon: CheckCircle },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700 text-center hover:shadow-md transition"
            >
              <Icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
              <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
              <p className={`text-lg font-semibold ${stat.color}`}>{stat.count}</p>
            </div>
          );
        })}
      </div>

      {/* LISTE COMPACTE */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">Aperçu des alertes</h2>
        <div className="space-y-3">
          {alarmes.map((alarme) => (
            <div
              key={alarme.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-md transition cursor-pointer bg-white dark:bg-gray-800"
            >
              {/* HEADER */}
              <div className="flex items-center justify-between mb-1">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getSeveriteColor(alarme.severite)}`}>
                  {alarme.niveau}
                </span>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">{alarme.date}</p>
              </div>

              {/* TITRE + SITE */}
              <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100">{alarme.titre}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{alarme.site}</p>

              {/* DESCRIPTION COURTE */}
              <p className="mt-1 text-gray-700 dark:text-gray-300 text-xs line-clamp-2">
                {alarme.description}
              </p>

              {/* RECOMMANDATION */}
              <div className="mt-2 flex items-start bg-gray-50 dark:bg-gray-700/50 rounded p-2 text-xs text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-600">
                <Bot className="w-4 h-4 text-[#131635] dark:text-[#60A5FA] mr-1 mt-0.5" />
                <p className="line-clamp-2">
                  <strong className="dark:text-white">IA :</strong> {alarme.recommandation}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};