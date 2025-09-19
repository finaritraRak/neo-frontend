// UserTable.tsx
import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Shield, X } from 'lucide-react';
import { User } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { apiService } from '../../services/api';

interface UserTableProps {
  users: User[];
  onRefresh: () => void;
}

export const UserTable: React.FC<UserTableProps> = ({ users, onRefresh }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isPermissions, setIsPermissions] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: '',
    status: '',
  });

  useEffect(() => {
    if (selectedUser) {
      setFormData({
        first_name: selectedUser.firstName || '',
        last_name: selectedUser.lastName || '',
        email: selectedUser.email || '',
        role: selectedUser.role || '',
        status: selectedUser.status || '',
      });
    }
  }, [selectedUser]);

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setIsEditing(true);
  };

  const openPermissionsModal = (user: User) => {
    setSelectedUser(user);
    setIsPermissions(true);
  };

  const closeModal = () => {
    setIsEditing(false);
    setIsPermissions(false);
    setSelectedUser(null);
  };

  const handleUpdate = async () => {
    if (!selectedUser) return;
    try {
      await apiService.updateUser(selectedUser.id, formData);
      closeModal();
      onRefresh();
    } catch (error) {
      console.error('Erreur de mise à jour:', error);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Confirmer la suppression ?')) return;
    try {
      await apiService.deleteUser(userId);
      onRefresh();
    } catch (error) {
      console.error('Erreur de suppression:', error);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'danger';
      case 'editor': return 'warning';
      case 'viewer': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'secondary';
      case 'pending': return 'warning';
      default: return 'secondary';
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Utilisateurs récents</h3>
        <Button variant="outline" size="sm" onClick={onRefresh}>Actualiser</Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-300">Utilisateur</th>
              <th className="text-left py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-300">Rôle</th>
              <th className="text-left py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-300">Statut</th>
              <th className="text-left py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-300">Dernière connexion</th>
              <th className="text-right py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <td className="py-4 px-2">
                  <div className="flex items-center gap-3">
                    <Avatar src={user.avatar} alt={`${user.firstName} ${user.lastName}`} />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-2">
                  <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                </td>
                <td className="py-4 px-2">
                  <Badge variant={getStatusBadgeVariant(user.status)}>{user.status}</Badge>
                </td>
                <td className="py-4 px-2 text-sm text-gray-500 dark:text-gray-400">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('fr-FR') : '-'}
                </td>
                <td className="py-4 px-2">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" icon={Edit} onClick={() => openEditModal(user)} className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400" />
                    <Button variant="ghost" size="sm" icon={Shield} onClick={() => openPermissionsModal(user)} className="text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400" />
                    <Button variant="ghost" size="sm" icon={Trash2} onClick={() => handleDelete(user.id)} className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(isEditing || isPermissions) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md relative border border-gray-200 dark:border-gray-700">
            <button onClick={closeModal} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {isEditing ? 'Modifier utilisateur' : 'Gérer les permissions'}
            </h2>

            <div className="space-y-3">
              {isEditing && (
                <>
                  <input
                    type="text"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Prénom"
                    value={formData.first_name || ''}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  />
                  <input
                    type="text"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nom"
                    value={formData.last_name || ''}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  />
                  <input
                    type="email"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                  <select
                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.status || ''}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                    <option value="pending">En attente</option>
                  </select>
                </>
              )}

              {isPermissions && (
                <select
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.role || ''}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="admin">Admin</option>
                  <option value="editor">Éditeur</option>
                  <option value="viewer">Lecteur</option>
                </select>
              )}

              <Button onClick={handleUpdate} className="w-full">Enregistrer</Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};