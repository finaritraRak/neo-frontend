import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Bell, Shield, Palette, Save, AlertCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

type TabId = 'general' | 'notifications' | 'security' | 'appearance';

type SettingsShape = {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  timezone: string;
  language: string;
  theme: 'light' | 'dark' | 'auto';
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyReports: boolean;
  twoFactorAuth: boolean;
  sessionTimeout: number;
  passwordExpiry: number;
};

const THEME_STORAGE_KEY = 'app-theme';

// Configuration d'axios
axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [settings, setSettings] = useState<SettingsShape>({
    siteName: '',
    siteDescription: '',
    contactEmail: '',
    timezone: 'Europe/Paris',
    language: 'fr',
    theme: 'light',
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true,
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordExpiry: 90,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAllowed, setIsAllowed] = useState<boolean>(false);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const getAuthToken = () => localStorage.getItem('token');

  // 1. Charger les données utilisateur
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          setIsAllowed(false);
          setLoading(false);
          return;
        }

        const res = await axios.get(`${API_BASE_URL}/auth/me/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const user = res.data;
        setUserRole(user.role);
        setIsAllowed(user.role === 'admin');
      } catch (error: any) {
        console.error('Erreur utilisateur:', error);
        setIsAllowed(false);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [API_BASE_URL]);

  // 2. Charger les paramètres du backend
  useEffect(() => {
    if (!isAllowed) return;

    const fetchSettings = async () => {
      try {
        const token = getAuthToken();
        const res = await axios.get(`${API_BASE_URL}/settings/site/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const backendData = res.data;

        const mappedSettings: Partial<SettingsShape> = {
          siteName: backendData.siteName || '',
          siteDescription: backendData.siteDescription || '',
          contactEmail: backendData.contactEmail || '',
          timezone: backendData.timezone || 'Europe/Paris',
          language: backendData.language || 'fr',
          theme: backendData.theme || 'light',
          emailNotifications: Boolean(backendData.emailNotifications),
          pushNotifications: Boolean(backendData.pushNotifications),
          weeklyReports: Boolean(backendData.weeklyReports),
          twoFactorAuth: Boolean(backendData.twoFactorAuth),
          sessionTimeout: Number(backendData.sessionTimeout) || 30,
          passwordExpiry: Number(backendData.passwordExpiry) || 90,
        };

        // 🔥 Appliquer le thème stocké localement OU celui du backend
        const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as SettingsShape['theme'] | null;
        const finalTheme = storedTheme || mappedSettings.theme || 'light';

        // 🔥 Appliquer immédiatement
        if (typeof document !== 'undefined') {
          const root = document.documentElement;
          root.classList.remove('light', 'dark');
          root.classList.add(finalTheme === 'auto'
            ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
            : finalTheme
          );
        }

        // 🔥 Sauvegarder dans localStorage
        if (!storedTheme) {
          localStorage.setItem(THEME_STORAGE_KEY, finalTheme);
        }

        setSettings((prev) => ({ ...prev, ...mappedSettings, theme: finalTheme }));
      } catch (error: any) {
        console.error('Erreur chargement:', error);
        setSettings((prev) => ({ ...prev, theme: 'light' }));
        if (typeof document !== 'undefined') {
          document.documentElement.classList.replace('dark', 'light');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [isAllowed, API_BASE_URL]);

  // 3. Gérer les changements
  const handleSettingChange = (key: keyof SettingsShape, value: any) => {
    if (!isAllowed) return;

    setSettings((prev) => {
      const newSettings = { ...prev, [key]: value };

      if (key === 'theme') {
        try {
          localStorage.setItem(THEME_STORAGE_KEY, value);
        } catch (e) {
          console.warn('Impossible de sauvegarder le thème');
        }

        // 🔥 Appliquer immédiatement
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(value === 'auto'
          ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
          : value
        );
      }

      return newSettings;
    });
  };

  // 4. Sauvegarder
  const handleSave = async () => {
    if (!isAllowed) return;
    setSaving(true);

    try {
      const token = getAuthToken();
      const formData = new FormData();

      const fieldMapping: Record<keyof SettingsShape, string> = {
        siteName: 'site_name',
        siteDescription: 'site_description',
        contactEmail: 'contact_email',
        timezone: 'timezone',
        language: 'language',
        theme: 'theme',
        emailNotifications: 'email_notifications',
        pushNotifications: 'push_notifications',
        weeklyReports: 'weekly_reports',
        twoFactorAuth: 'two_factor_auth',
        sessionTimeout: 'session_timeout',
        passwordExpiry: 'password_expiry',
      };

      Object.keys(settings).forEach((key) => {
        const value = settings[key as keyof SettingsShape];
        const backendKey = fieldMapping[key as keyof SettingsShape];
        if (backendKey) {
          formData.append(backendKey, String(value));
        }
      });

      await axios.post(`${API_BASE_URL}/settings/site/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      alert('Paramètres enregistrés avec succès.');
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || error.message;
      alert(`Erreur : ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'Général', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Sécurité', icon: Shield },
    { id: 'appearance', label: 'Apparence', icon: Palette },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Paramètres</h1>
            <p className="text-gray-600 mt-1 dark:text-gray-300">Chargement...</p>
          </div>
        </div>
        <div className="text-center py-10 text-gray-500 dark:text-gray-400">Chargement des paramètres...</div>
      </div>
    );
  }

  if (!isAllowed) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Paramètres</h1>
            <p className="text-gray-600 mt-1 dark:text-gray-300">Accès restreint</p>
          </div>
        </div>
        <Card className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-3 text-red-800 dark:text-red-200">
            <AlertCircle className="w-6 h-6" />
            <div>
              <h3 className="font-semibold dark:text-white">Accès refusé</h3>
              <p className="text-sm dark:text-gray-300">
                Vous devez être <strong>administrateur</strong> pour accéder à cette page.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Paramètres</h1>
          <p className="text-gray-600 mt-1 dark:text-gray-300">Configurez votre dashboard et vos préférences</p>
        </div>
        <Button icon={Save} onClick={handleSave} disabled={saving}>
          {saving ? 'Enregistrement...' : 'Sauvegarder'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-200 border-l-4 border-red-700'
                        : 'text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Paramètres généraux</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom du site</label>
                    <input
                      type="text"
                      value={settings.siteName}
                      onChange={(e) => handleSettingChange('siteName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <textarea
                      value={settings.siteDescription}
                      onChange={(e) => handleSettingChange('siteDescription', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email de contact</label>
                    <input
                      type="email"
                      value={settings.contactEmail}
                      onChange={(e) => handleSettingChange('contactEmail', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fuseau horaire</label>
                      <select
                        value={settings.timezone}
                        onChange={(e) => handleSettingChange('timezone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="Europe/Paris">Europe/Paris</option>
                        <option value="Europe/London">Europe/London</option>
                        <option value="America/New_York">America/New_York</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Langue</label>
                      <select
                        value={settings.language}
                        onChange={(e) => handleSettingChange('language', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="fr">Français</option>
                        <option value="en">English</option>
                        <option value="es">Español</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Préférences de notification</h3>
                <div className="space-y-4">
                  {(['emailNotifications', 'pushNotifications', 'weeklyReports'] as (keyof SettingsShape)[]).map((key) => (
                    <div key={String(key)} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {key === 'emailNotifications' ? 'Notifications par email' : key === 'pushNotifications' ? 'Notifications push' : 'Rapports hebdomadaires'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {key === 'emailNotifications' ? 'Recevez des notifications par email' : key === 'pushNotifications' ? 'Recevez des notifications dans le navigateur' : 'Recevez un résumé chaque semaine'}
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(settings[key])}
                          onChange={(e) => handleSettingChange(key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sécurité</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Authentification à deux facteurs</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Ajoutez une couche de sécurité</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={settings.twoFactorAuth ? 'success' : 'secondary'} className="dark:bg-gray-700 dark:text-gray-300">
                        {settings.twoFactorAuth ? 'Activé' : 'Désactivé'}
                      </Badge>
                      <Button variant="outline" size="sm" onClick={() => handleSettingChange('twoFactorAuth', !settings.twoFactorAuth)}>
                        {settings.twoFactorAuth ? 'Désactiver' : 'Activer'}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiration session (min)</label>
                    <select
                      value={settings.sessionTimeout}
                      onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value={15}>15</option>
                      <option value={30}>30</option>
                      <option value={60}>60</option>
                      <option value={120}>120</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiration mot de passe (jours)</label>
                    <select
                      value={settings.passwordExpiry}
                      onChange={(e) => handleSettingChange('passwordExpiry', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value={30}>30</option>
                      <option value={60}>60</option>
                      <option value={90}>90</option>
                      <option value={180}>180</option>
                    </select>
                  </div>
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button variant="outline" className="dark:text-gray-300">Changer le mot de passe</Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Apparence</h3>
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Thème</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(['light', 'dark', 'auto'] as SettingsShape['theme'][]).map((theme) => (
                      <div
                        key={theme}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                          settings.theme === theme
                            ? 'border-red-500 bg-red-50 dark:bg-red-900/30 dark:border-red-600'
                            : 'border-gray-200 dark:border-gray-700 dark:bg-gray-800'
                        }`}
                        onClick={() => handleSettingChange('theme', theme)}
                        role="button"
                      >
                        <div
                          className={`w-full h-20 rounded mb-2 ${
                            theme === 'light'
                              ? 'bg-white border border-gray-200'
                              : theme === 'dark'
                              ? 'bg-gray-800 border border-gray-600'
                              : 'bg-gradient-to-r from-white to-gray-800 border border-gray-200'
                          }`}
                        ></div>
                        <div className="text-sm font-medium dark:text-white">
                          {theme === 'light' ? 'Clair' : theme === 'dark' ? 'Sombre' : 'Automatique'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};