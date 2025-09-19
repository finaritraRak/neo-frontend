// src/App.tsx
import React, { useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useDashboard } from './hooks/useDashboard';
import { MainLayout } from './components/layout/MainLayout';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import Login from './pages/Login';

// ✅ IMPORT DIRECT DE CHAQUE FICHIER — PAS DE DOSSIER, PAS D'INDEX
// Admin
import { AdminDashboard } from './components/admin/Dashboard';
import { AdminPerformances } from './components/admin/Performances';
import { AdminAlarmes } from './components/admin/Alarmes';
import { AdminMaintenances } from './components/admin/Maintenances';
import { AdminRapports } from './components/admin/Rapports';
import { AdminUtilisateurs } from './components/admin/Utilisateurs';
import { AdminParametres } from './components/admin/Parametres';

// Technicien
import { TechnicienDashboard } from './components/technicien/Dashboard';
import { TechnicienPerformances } from './components/technicien/Performances';
import { TechnicienAlarmes } from './components/technicien/Alarmes';
import { TechnicienMaintenances } from './components/technicien/Maintenances';
import { TechnicienRapports } from './components/technicien/Rapports';
import { TechnicienUtilisateurs } from './components/technicien/Utilisateurs';
import { TechnicienParametres } from './components/technicien/Parametres';

// Client
import { ClientDashboard } from './components/client/Dashboard';
import { ClientPerformances } from './components/client/Performances';
import { ClientAlarmes } from './components/client/Alarmes';
import { ClientMaintenances } from './components/client/Maintenances';
import { ClientRapports } from './components/client/Rapports';
import { ClientUtilisateurs } from './components/client/Utilisateurs';
import { ClientParametres } from './components/client/Parametres';

function applyTheme(theme: 'light' | 'dark' | 'auto') {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');

  if (theme === 'light') {
    root.classList.add('light');
  } else if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.add(prefersDark ? 'dark' : 'light');
  }
}

async function fetchAppSettings(token: string): Promise<{ theme: 'light' | 'dark' | 'auto' } | null> {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/settings/site/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    return { theme: data.theme || 'light' };
  } catch {
    return null;
  }
}

function App() {
  const { user, loading: authLoading, logout } = useAuth();
  const { stats, loading: dashboardLoading } = useDashboard();

  const getRelativePath = () => {
    const path = window.location.pathname;
    return path.startsWith('/admin-panel') ? path.slice('/admin-panel'.length) : path;
  };

  const [currentPath, setCurrentPath] = React.useState(getRelativePath());

  const handleNavigate = (path: string) => {
    const fullPath = `/admin-panel${path}`;
    setCurrentPath(path);
    window.history.pushState({}, '', fullPath);
    window.dispatchEvent(new Event('locationchange'));
  };

  useEffect(() => {
    const initTheme = async () => {
      if (!user) return;
      const token = localStorage.getItem('token');
      if (!token) return;

      const savedTheme = localStorage.getItem('app-theme') as 'light' | 'dark' | 'auto' | null;
      if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
        applyTheme(savedTheme);
        return;
      }

      const backendSettings = await fetchAppSettings(token);
      if (backendSettings?.theme) {
        localStorage.setItem('app-theme', backendSettings.theme);
        applyTheme(backendSettings.theme);
        return;
      }

      applyTheme('light');
    };

    initTheme();
  }, [user]);

  React.useEffect(() => {
    const handlePop = () => setCurrentPath(getRelativePath());
    const handleCustom = () => setCurrentPath(getRelativePath());

    window.addEventListener('popstate', handlePop);
    window.addEventListener('locationchange', handleCustom);

    return () => {
      window.removeEventListener('popstate', handlePop);
      window.removeEventListener('locationchange', handleCustom);
    };
  }, []);

  if (authLoading || dashboardLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Login onSuccess={() => window.location.reload()} />;
  }

  // 🧭 ROUTEUR INTELLIGENT — Charge le composant spécifique au rôle
  const renderContent = () => {
    const role = user.role;

    switch (currentPath) {
      case '/dashboard':
      case '/':
        if (role === 'admin') return <AdminDashboard stats={stats} />;
        if (role === 'technicien') return <TechnicienDashboard />;
        if (role === 'client') return <ClientDashboard />;
        break;

      case '/performances':
        if (role === 'admin') return <AdminPerformances />;
        if (role === 'technicien') return <TechnicienPerformances />;
        if (role === 'client') return <ClientPerformances />;
        break;

      case '/alarmes':
        if (role === 'admin') return <AdminAlarmes />;
        if (role === 'technicien') return <TechnicienAlarmes />;
        if (role === 'client') return <ClientAlarmes />;
        break;

      case '/maintenances':
        if (role === 'admin') return <AdminMaintenances />;
        if (role === 'technicien') return <TechnicienMaintenances />;
        if (role === 'client') return <ClientMaintenances />;
        break;

      case '/rapports':
        if (role === 'admin') return <AdminRapports />;
        if (role === 'technicien') return <TechnicienRapports />;
        if (role === 'client') return <ClientRapports />;
        break;

      case '/utilisateurs':
        if (role === 'admin') return <AdminUtilisateurs />;
        if (role === 'technicien') return <TechnicienUtilisateurs />;
        if (role === 'client') return <ClientUtilisateurs />;
        break;

      case '/parametres':
        if (role === 'admin') return <AdminParametres />;
        if (role === 'technicien') return <TechnicienParametres />;
        if (role === 'client') return <ClientParametres />;
        break;
    }

    // Fallback
    if (role === 'admin') return <AdminDashboard stats={stats} />;
    if (role === 'technicien') return <TechnicienDashboard />;
    if (role === 'client') return <ClientDashboard />;

    return <div>Rôle non supporté</div>;
  };

  return (
    <MainLayout
      key={currentPath}
      user={user}
      onLogout={logout}
      currentPath={currentPath}
      onNavigate={handleNavigate}
    >
      {renderContent()}
    </MainLayout>
  );
}

export default App;