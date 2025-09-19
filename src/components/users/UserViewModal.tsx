import React from 'react';
import { X, User as UserIcon, Mail, Shield, Calendar, Activity } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { User } from '../../types';

interface UserViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export const UserViewModal: React.FC<UserViewModalProps> = ({ isOpen, onClose, user }) => {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
            <UserIcon className="w-5 h-5" /> Détails de l'utilisateur
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Avatar et nom */}
        <div className="flex flex-col items-center mb-6">
          <Avatar src={user.avatar || ''} alt={`${user.first_name} ${user.last_name}`} size="lg" />
          <h3 className="mt-3 text-lg font-medium">{user.first_name} {user.last_name}</h3>
          <p className="text-gray-500 text-sm">{user.email}</p>
        </div>

        {/* Infos */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-gray-700">
            <Shield className="w-4 h-4" /> <span>Rôle : <strong>{user.role}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <Activity className="w-4 h-4" /> <span>Statut : <strong>{user.status}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <Calendar className="w-4 h-4" /> <span>Créé le : <strong>{new Date(user.created_at).toLocaleDateString('fr-FR')}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <Calendar className="w-4 h-4" /> <span>Dernière connexion : <strong>{user.last_login ? new Date(user.last_login).toLocaleString('fr-FR') : 'Jamais'}</strong></span>
          </div>
        </div>

        {/* Bouton fermer */}
        <div className="mt-6 text-right">
          <Button onClick={onClose}>Fermer</Button>
        </div>
      </Card>
    </div>
  );
};
