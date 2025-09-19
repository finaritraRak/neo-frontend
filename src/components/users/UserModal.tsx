import React, { useState, useEffect, useRef } from 'react';
import { X, Save, User as UserIcon, Mail, Shield, Calendar, Key, Upload } from 'lucide-react';
import { User } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (userData: Partial<User> & { password?: string; avatar?: File | null }) => void;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  user,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'viewer' as User['role'],
    status: 'active' as User['status'],
    password: '',
    avatar: null as File | null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (user) {
        setFormData({
          firstName: user.first_name || '',
          lastName: user.last_name || '',
          email: user.email || '',
          role: user.role || 'viewer',
          status: user.status || 'active',
          password: '',
          avatar: null,
        });
      } else {
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          role: 'viewer',
          status: 'active',
          password: '',
          avatar: null,
        });
      }
      setErrors({});
    }
  }, [user, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Le nom est requis';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    if (!user && !formData.password.trim()) {
      newErrors.password = 'Le mot de passe est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const toSend: Partial<User> & { password?: string; avatar?: File | null } = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        role: formData.role,
        status: formData.status,
      };
      if (formData.password.trim()) {
        toSend.password = formData.password.trim();
      }
      if (formData.avatar) {
        toSend.avatar = formData.avatar;
      }
      onSave(toSend);
    }
  };

  const handleChange = (field: string, value: string | File | null) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleChange('avatar', file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <UserIcon className="w-5 h-5" />
            {user ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Avatar
            </label>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <div
              onClick={triggerFileInput}
              className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
            >
              <Upload className="w-8 h-8 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formData.avatar ? formData.avatar.name : 'Cliquez pour télécharger une image'}
              </p>
            </div>

            {(formData.avatar || (user && user.avatar_url)) && (
              <div className="mt-4 flex justify-center">
                <div className="relative h-20 w-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                  <img
                    src={
                      formData.avatar
                        ? URL.createObjectURL(formData.avatar)
                        : user?.avatar_url || ''
                    }
                    alt="Aperçu avatar"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Prénom */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Prénom *
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                errors.firstName ? 'border-red-300 dark:border-red-600' : ''
              }`}
              placeholder="Entrez le prénom"
            />
            {errors.firstName && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.firstName}</p>
            )}
          </div>

          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom *
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                errors.lastName ? 'border-red-300 dark:border-red-600' : ''
              }`}
              placeholder="Entrez le nom"
            />
            {errors.lastName && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.lastName}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
              <Mail className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                errors.email ? 'border-red-300 dark:border-red-600' : ''
              }`}
              placeholder="exemple@lynkevo.com"
            />
            {errors.email && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Mot de passe */}
          {!user && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                <Key className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                Mot de passe *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  errors.password ? 'border-red-300 dark:border-red-600' : ''
                }`}
                placeholder="Entrez un mot de passe"
                autoComplete="new-password"
              />
              {errors.password && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.password}</p>
              )}
            </div>
          )}

          {/* Rôle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
              <Shield className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              Rôle
            </label>
            <select
              value={formData.role}
              onChange={(e) => handleChange('role', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="viewer">Lecteur</option>
              <option value="editor">Éditeur</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>

          {/* Statut */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
              <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              Statut
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
              <option value="pending">En attente</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              type="submit"
              icon={Save}
              className="flex-1"
            >
              {user ? 'Mettre à jour' : 'Créer'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 dark:text-gray-300"
            >
              Annuler
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};