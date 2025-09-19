// src/components/layout/Sidebar.tsx
import React from 'react';
import {
  Home,
  Users,
  Settings,
  Gauge,
  Bell,
  Wrench,
  FileText,
  ChevronLeft,
  ChevronRight,
  Globe
} from 'lucide-react';

import logoImage from '../../../public/logo.png';
import faviconImage from '../../../public/favicon.png';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggle,
  currentPath,
  onNavigate
}) => {
  // ✅ Navigation simplifiée — 7 menus unifiés pour tous les rôles
  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: 'Home', href: '/dashboard' },
    { id: 'performances', label: 'Performances', icon: 'Gauge', href: '/performances' },
    { id: 'alarmes', label: 'Alarmes', icon: 'Bell', href: '/alarmes' },
    { id: 'maintenances', label: 'Maintenances', icon: 'Wrench', href: '/maintenances' },
    { id: 'rapports', label: 'Rapports', icon: 'FileText', href: '/rapports' },
    { id: 'utilisateurs', label: 'Utilisateurs', icon: 'Users', href: '/utilisateurs' },
    { id: 'parametres', label: 'Paramètres', icon: 'Settings', href: '/parametres' },
    { id: 'mainSite', label: 'Website', icon: 'Globe', href: '/' }
  ];

  const getIcon = (iconName: string) => {
    const icons = {
      Home,
      Users,
      Settings,
      Gauge,
      Bell,
      Wrench,
      FileText,
      Globe
    };
    return icons[iconName as keyof typeof icons] || Home;
  };

  return (
    <div className={`dark:bg-gray-900 dark:border-gray-700 transition-all duration-300 flex flex-col ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Header */}
      <div className="p-4 border-b dark:border-gray-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <img src={logoImage} alt="Neo Platform" className="h-8 w-auto" />
            </div>
          )}
          {isCollapsed && (
            <img src={faviconImage} alt="Neo Platform" className="h-8 w-8" />
          )}
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5 dark:text-gray-300" />
            ) : (
              <ChevronLeft className="w-5 h-5 dark:text-gray-300" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-0 space-y-2">
        {navigation.map((item) => {
          const Icon = getIcon(item.icon);
          const isActive = currentPath === item.href;
          const buttonStyle = isCollapsed ? { width: '4rem', height: '4rem' } : {};

          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.href === '/') {
                  window.location.href = '/';
                } else {
                  onNavigate(item.href);
                }
              }}
              style={buttonStyle}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                ${isActive
                  ? 'bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-200 border-l-4 border-red-700'
                  : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                }
              `}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-red-700 dark:text-red-200' : 'text-gray-500 dark:text-gray-400'}`} />
              {!isCollapsed && (
                <span className="font-medium">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {!isCollapsed && (
            <>
              <div className="font-medium text-gray-700 dark:text-gray-300">Neo Platform</div>
              <div className="mt-1">© 2025 - Tous droits réservés</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};