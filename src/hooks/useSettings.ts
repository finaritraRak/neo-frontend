// src/hooks/useSettings.ts
import { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';

export interface SettingsData {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  timezone: string;
  language: string;
  theme: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyReports: boolean;
  twoFactorAuth: boolean;
  sessionTimeout: number;
  passwordExpiry: number;
}

export function useSettings() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSettings = async () => {
    try {
      const res = await apiFetch('/settings/');
      setSettings(res);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (data: SettingsData) => {
    const res = await apiFetch('/settings/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    setSettings(res);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    error,
    setSettings,
    saveSettings,
  };
}
