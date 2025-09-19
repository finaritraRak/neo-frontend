// src/components/admin/UserTable.tsx
import React, { useState } from 'react';
import { Edit, Trash2, Shield, Eye } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { UserViewModal } from './UserViewModal';
import { UserPermissionsModal } from './UserPermissionsModal';

interface User {
  id: number | string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'admin' | 'technicien' | 'client'; // ✅ Mis à jour
  status: 'active' | 'inactive' | 'pending';
  avatar?: string;
  last_login: string;
  created_at: string;
}

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (userId: string | number) => void;
}

export const UserTable: React.FC<UserTableProps> = ({ users, onEdit, onDelete }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);

  const handleView = (user: User) => {
    setSelectedUser(user);
    setIsViewOpen(true);
  };

  const handlePermissions = (user: User) => {
    setSelectedUser(user);
    setIsPermissionsOpen(true);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'danger';
      case 'technicien': return 'warning'; // ✅ Mis à jour
      case 'client': return 'secondary';   // ✅ Mis à jour
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

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'technicien': return 'Technicien'; // ✅ Mis à jour
      case 'client': return 'Client';         // ✅ Mis à jour
      default: return role;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'inactive': return 'Inactif';
      case 'pending': return 'En attente';
      default: return status;
    }
  };

  return (
    <>
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Utilisateurs ({users.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-300">Utilisateur</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-300">Rôle</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-300">Statut</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-300">Dernière connexion</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-300">Créé le</th>
                <th className="text-right py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="py-4 px-2">
                    <div className="flex items-center gap-3">
                      <Avatar src={user.avatar || ''} alt={`${user.first_name} ${user.last_name}`} />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    <Badge variant={getRoleBadgeVariant(user.role)} className="dark:bg-opacity-20 dark:text-white">
                      {getRoleLabel(user.role)}
                    </Badge>
                  </td>
                  <td className="py-4 px-2">
                    <Badge variant={getStatusBadgeVariant(user.status)} className="dark:bg-opacity-20 dark:text-white">
                      {getStatusLabel(user.status)}
                    </Badge>
                  </td>
                  <td className="py-4 px-2 text-sm text-gray-500 dark:text-gray-400">
                    {user.last_login
                      ? new Date(user.last_login).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Jamais'}
                  </td>
                  <td className="py-4 px-2 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(user.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-4 px-2">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Eye}
                        onClick={() => handleView(user)}
                        className="text-gray-500 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Edit}
                        onClick={() => onEdit(user)}
                        className="text-gray-500 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Shield}
                        onClick={() => handlePermissions(user)}
                        className="text-gray-500 hover:text-yellow-600 dark:text-gray-300 dark:hover:text-yellow-400"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Trash2}
                        onClick={() => onDelete(user.id)}
                        className="text-gray-500 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400 mb-2">Aucun utilisateur trouvé</div>
            <div className="text-sm text-gray-400 dark:text-gray-500">
              Essayez de modifier vos critères de recherche
            </div>
          </div>
        )}
      </Card>

      {/* Modals */}
      <UserViewModal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        user={selectedUser}
      />

      <UserPermissionsModal
        isOpen={isPermissionsOpen}
        onClose={() => setIsPermissionsOpen(false)}
        user={selectedUser}
        onSave={(perms) => console.log('Permissions sauvegardées :', perms)}
      />
    </>
  );
};