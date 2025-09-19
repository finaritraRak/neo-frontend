// src/components/admin/UserPermissionsModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Shield } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { User } from '../../types';

interface UserPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (permissions: string[]) => void;
}

export const UserPermissionsModal: React.FC<UserPermissionsModalProps> = ({
  isOpen,
  onClose,
  user,
  onSave,
}) => {
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      // ✅ Mise à jour des permissions par rôle
      if (user.role === 'admin') setPermissions(['read', 'write', 'delete', 'manage_users']);
      else if (user.role === 'technicien') setPermissions(['read', 'write', 'maintenance_access']);
      else if (user.role === 'client') setPermissions(['read', 'book_services']);
      else setPermissions(['read']);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const togglePermission = (perm: string) => {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleSave = () => {
    onSave(permissions);
    onClose();
  };

  // ✅ Labels mis à jour pour les nouveaux rôles
  const getPermissionLabel = (perm: string) => {
    switch (perm) {
      case 'read': return 'Lecture';
      case 'write': return 'Écriture';
      case 'delete': return 'Suppression';
      case 'manage_users': return 'Gestion des utilisateurs';
      case 'maintenance_access': return 'Accès maintenance';
      case 'book_services': return 'Réservation de services';
      default: return perm;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
            <Shield className="w-5 h-5" /> Permissions de {user.first_name}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Liste permissions */}
        <div className="space-y-2">
          {['read', 'write', 'delete', 'manage_users', 'maintenance_access', 'book_services'].map((perm) => (
            <label key={perm} className="flex items-center gap-2 text-gray-700">
              <input
                type="checkbox"
                checked={permissions.includes(perm)}
                onChange={() => togglePermission(perm)}
              />
              {getPermissionLabel(perm)}
            </label>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <Button className="flex-1" onClick={handleSave}>Enregistrer</Button>
          <Button variant="outline" className="flex-1" onClick={onClose}>Annuler</Button>
        </div>
      </Card>
    </div>
  );
};