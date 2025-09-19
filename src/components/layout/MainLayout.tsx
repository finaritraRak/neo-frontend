// src/components/layout/MainLayout.tsx
import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { User } from '../../types';

interface MainLayoutProps {
  user: User;
  onLogout: () => void;
  currentPath: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ 
  user, 
  onLogout, 
  currentPath, 
  onNavigate, 
  children 
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={handleToggleSidebar}
        currentPath={currentPath}
        onNavigate={onNavigate}
      />

      <div className="flex-1 flex flex-col">
        <Header
          user={user}
          onToggleSidebar={handleToggleSidebar}
          onLogout={onLogout}
          onNavigate={onNavigate}
        />
        
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};