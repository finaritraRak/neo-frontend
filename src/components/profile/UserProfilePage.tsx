// src/components/profile/UserProfilePage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { User, UserUpdatePayload } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { AlertCircle, Upload, Save, Eye, EyeOff, User as UserIcon } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

function getAuthToken(): string | null {
  return localStorage.getItem('token');
}

function getAuthHeaders(includeContentType = true) {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

export const UserProfilePage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error('Impossible de charger les informations utilisateur.');

      const userData = await res.json();
      setUser(userData);
      if (userData.avatar_url) {
        setAvatarPreview(userData.avatar_url);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur inconnue lors du chargement du profil.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();

      const form = e.target as HTMLFormElement;
      const firstName = (form.elements.namedItem('first_name') as HTMLInputElement)?.value;
      const lastName = (form.elements.namedItem('last_name') as HTMLInputElement)?.value;
      const email = (form.elements.namedItem('email') as HTMLInputElement)?.value;
      const currentPassword = (form.elements.namedItem('current_password') as HTMLInputElement)?.value;
      const newPassword = (form.elements.namedItem('new_password') as HTMLInputElement)?.value;

      if (!firstName.trim()) {
        throw new Error('Le prénom est obligatoire.');
      }
      if (!lastName.trim()) {
        throw new Error('Le nom est obligatoire.');
      }

      formData.append('first_name', firstName);
      formData.append('last_name', lastName);
      formData.append('email', email);

      if (newPassword && newPassword.trim()) {
        if (!currentPassword.trim()) {
          throw new Error('Le mot de passe actuel est requis pour en définir un nouveau.');
        }
        formData.append('current_password', currentPassword);
        formData.append('new_password', newPassword);
      }

      const fileInput = fileInputRef.current;
      if (fileInput?.files?.[0]) {
        formData.append('avatar', fileInput.files[0]);
      }

      const headers = getAuthHeaders(false); // Pas de Content-Type pour FormData
      delete headers['Content-Type'];

      const res = await fetch(`${API_BASE_URL}/auth/me/`, {
        method: 'PUT',
        headers,
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Erreur lors de la mise à jour : ${res.status} ${errorText}`);
      }

      const updatedUser = await res.json();
      setUser(updatedUser);
      if (updatedUser.avatar_url) {
        setAvatarPreview(updatedUser.avatar_url);
      }
      setSuccess('Profil mis à jour avec succès !');
      if (fileInput) fileInput.value = '';
    } catch (err: any) {
      setError(err.message || 'Erreur inconnue lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <Card className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-6">
        <div className="flex items-center gap-3 text-red-800 dark:text-red-200">
          <AlertCircle className="w-6 h-6" />
          <div>
            <h3 className="font-semibold dark:text-white">Erreur de chargement</h3>
            <p className="text-sm dark:text-gray-300">Impossible de charger votre profil. Veuillez réessayer plus tard.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6 p-4 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mon Profil</h1>
        <p className="text-gray-600 mt-1 dark:text-gray-300">Gérez vos informations personnelles et votre photo de profil.</p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/30 dark:border-red-800">
          <div className="text-red-800 dark:text-red-200 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <strong>Erreur :</strong> {error}
          </div>
        </Card>
      )}

      {success && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/30 dark:border-green-800">
          <div className="text-green-800 dark:text-green-200 flex items-center gap-2">
            <UserIcon className="w-5 h-5" />
            <strong>Succès :</strong> {success}
          </div>
        </Card>
      )}

      <Card className="dark:bg-gray-800 dark:border-gray-700 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="h-24 w-24 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-lg">
                  {user.first_name?.[0]?.toUpperCase() || user.last_name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <button
                type="button"
                onClick={handleUploadClick}
                className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-md transition"
              >
                <Upload className="w-4 h-4" />
              </button>
            </div>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">Cliquez sur l’icône pour changer votre photo</p>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prénom *
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                defaultValue={user.first_name || ''}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom *
              </label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                defaultValue={user.last_name || ''}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={user.email || ''}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="border-t dark:border-gray-700 pt-6 mt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Changer le mot de passe</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mot de passe actuel
                </label>
                <div className="relative">
                  <input
                    id="current_password"
                    name="current_password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nouveau mot de passe
                </label>
                <input
                  id="new_password"
                  name="new_password"
                  type="password"
                  autoComplete="new-password"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Laissez vide pour ne pas changer"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              icon={Save}
              disabled={saving}
              className="dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};