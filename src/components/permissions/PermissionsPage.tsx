import React, { useState, useEffect } from 'react';
import { Shield, Users, Lock, Key, Plus, Search, Edit, Trash2, X, AlertCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { StatsCard } from '../dashboard/StatsCard';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://dev.calm-adventure-tours.com/api';

// 🔑 Récupérer le token JWT
function getAuthToken(): string | null {
  return localStorage.getItem('token');
}

// 🛠️ Headers d'authentification
function getAuthHeaders() {
  const token = getAuthToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'Utilisateurs' | 'Contenu' | 'Analytics' | 'Autre';
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  color: 'red' | 'blue' | 'green' | 'purple' | 'yellow' | 'gray';
}

// 🔧 Modal pour créer/modifier un rôle
const RoleModal = ({
  isOpen,
  onClose,
  onSave,
  role: initialRole = null,
}) => {
  const [role, setRole] = useState<Omit<Role, 'id'> & { id?: string }>({
    name: '',
    description: '',
    permissions: [],
    color: 'blue',
    ...initialRole,
  });

  const colors = ['red', 'blue', 'green', 'purple', 'yellow', 'gray'];

  const handleTogglePermission = (perm: string) => {
    setRole(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!role.name.trim()) return alert('Le nom est requis');
    onSave(role);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          {initialRole ? 'Modifier le rôle' : 'Nouveau rôle'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom du rôle</label>
            <input
              type="text"
              value={role.name}
              onChange={e => setRole({ ...role, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              value={role.description}
              onChange={e => setRole({ ...role, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Couleur</label>
            <div className="flex gap-2">
              {colors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setRole({ ...role, color })}
                  className={`w-8 h-8 rounded-full bg-${color}-500 ${
                    role.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                  }`}
                  aria-label={`Couleur ${color}`}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Permissions</label>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700">
              {[
                'user.create', 'user.edit', 'user.delete',
                'content.create', 'content.publish', 'content.delete',
                'analytics.view', 'seo.edit', 'settings.manage'
              ].map(perm => (
                <label key={perm} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={role.permissions.includes(perm)}
                    onChange={() => handleTogglePermission(perm)}
                    className="rounded text-red-500 dark:text-red-400"
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-200">{perm}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

// 🔧 Modal pour créer/modifier une permission
const PermissionModal = ({
  isOpen,
  onClose,
  onSave,
  permission: initialPermission = null,
}) => {
  const [permission, setPermission] = useState<Omit<Permission, 'id'> & { id?: string }>({
    name: '',
    description: '',
    category: 'Autre',
    ...initialPermission,
  });

  const categories = ['Utilisateurs', 'Contenu', 'Analytics', 'Autre'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!permission.name.trim()) return alert('Le nom est requis');
    onSave(permission);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          {initialPermission ? 'Modifier la permission' : 'Nouvelle permission'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom</label>
            <input
              type="text"
              value={permission.name}
              onChange={e => setPermission({ ...permission, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
              placeholder="ex: user.create"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              value={permission.description}
              onChange={e => setPermission({ ...permission, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Catégorie</label>
            <select
              value={permission.category}
              onChange={e => setPermission({ ...permission, category: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
            >
              {categories.map(cat => (
                <option key={cat} value={cat} className="dark:bg-gray-800">{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

// 🔔 Modal de confirmation
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{title}</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button variant="danger" onClick={onConfirm}>Supprimer</Button>
        </div>
      </Card>
    </div>
  );
};

export const PermissionsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions'>('roles');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState<boolean>(false);

  // Données réelles
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  // Modales
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'role' | 'permission'; id: string } | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);

  // 🔐 Vérifie si l'utilisateur est admin
  useEffect(() => {
    const checkRole = async () => {
      try {
        const token = getAuthToken();
        if (!token) return setIsAllowed(false);

        const res = await fetch(`${API_BASE_URL}/auth/me/`, { headers: getAuthHeaders() });
        if (!res.ok) return setIsAllowed(false);

        const userData = await res.json();
        setIsAllowed(userData.role === 'admin');
      } catch (err) {
        console.error('Erreur vérification rôle:', err);
        setIsAllowed(false);
      } finally {
        setLoading(false);
      }
    };

    checkRole();
  }, []);

  // 📥 Charger les données réelles des utilisateurs → extraire les rôles uniques
  useEffect(() => {
    if (!isAllowed) return;

    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/users/`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error('Échec du chargement des utilisateurs');

        const data = await res.json();
        const users = data.results || data;

        // 🎯 Générer des "rôles" basés sur les rôles réels des utilisateurs
        const roleMap: Record<string, Role> = {
          admin: {
            id: 'admin',
            name: 'Administrateur',
            description: 'Accès complet à toutes les fonctionnalités',
            permissions: ['user.create', 'user.edit', 'user.delete', 'content.create', 'content.publish', 'analytics.view'],
            color: 'red',
          },
          editor: {
            id: 'editor',
            name: 'Éditeur',
            description: 'Gestion du contenu et consultation des analytics',
            permissions: ['content.create', 'content.publish', 'analytics.view'],
            color: 'blue',
          },
          author: {
            id: 'author',
            name: 'Auteur',
            description: 'Création de contenu',
            permissions: ['content.create', 'content.publish'],
            color: 'purple',
          },
          viewer: {
            id: 'viewer',
            name: 'Lecteur',
            description: 'Consultation uniquement',
            permissions: ['analytics.view'],
            color: 'green',
          },
        };

        // Compter les utilisateurs par rôle
        const roleCount: Record<string, number> = {};
        users.forEach((user: any) => {
          roleCount[user.role] = (roleCount[user.role] || 0) + 1;
        });

        // Créer les rôles affichés
        const realRoles = Object.values(roleMap)
          .filter(role => roleCount[role.id] !== undefined)
          .map(role => ({
            ...role,
            users: roleCount[role.id],
          }));

        // Simuler des permissions basées sur les rôles
        const realPermissions: Permission[] = [
          { id: 'user.create', name: 'user.create', description: 'Créer des utilisateurs', category: 'Utilisateurs' },
          { id: 'user.edit', name: 'user.edit', description: 'Modifier des utilisateurs', category: 'Utilisateurs' },
          { id: 'user.delete', name: 'user.delete', description: 'Supprimer des utilisateurs', category: 'Utilisateurs' },
          { id: 'content.create', name: 'content.create', description: 'Créer du contenu', category: 'Contenu' },
          { id: 'content.publish', name: 'content.publish', description: 'Publier du contenu', category: 'Contenu' },
          { id: 'analytics.view', name: 'analytics.view', description: 'Voir les analytics', category: 'Analytics' },
        ];

        setRoles(realRoles);
        setPermissions(realPermissions);
      } catch (err) {
        console.error('Erreur:', err);
        setRoles([]);
        setPermissions([]);
      }
    };

    fetchUsers();
  }, [isAllowed]);

  // 🔍 Filtres
  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPermissions = permissions.filter(permission =>
    permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 📊 Stats réelles
  const totalRoles = roles.length;
  const totalPermissions = permissions.length;
  const totalUsersWithRoles = roles.reduce((sum, role) => sum + (role as any).users, 0);
  const activePermissions = permissions.length;

  // ⏳ Chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Chargement des données utilisateur...</div>
      </div>
    );
  }

  // 🔒 Accès refusé
  if (!isAllowed) {
    return (
      <div className="space-y-6 p-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des permissions</h1>
          <p className="text-gray-600 mt-1 dark:text-gray-300">Gérez les rôles et permissions des utilisateurs</p>
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

  // ✅ Sauvegarder un rôle
  const handleSaveRole = (roleData: any) => {
    if (roleData.id) {
      setRoles(prev => prev.map(r => r.id === roleData.id ? { ...roleData } : r));
    } else {
      const newRole = { ...roleData, id: Date.now().toString() };
      setRoles(prev => [...prev, newRole]);
    }
    setIsRoleModalOpen(false);
    setEditingRole(null);
  };

  // ✅ Sauvegarder une permission
  const handleSavePermission = (permData: any) => {
    if (permData.id) {
      setPermissions(prev => prev.map(p => p.id === permData.id ? { ...permData } : p));
    } else {
      const newPerm = { ...permData, id: Date.now().toString() };
      setPermissions(prev => [...prev, newPerm]);
    }
    setIsPermissionModalOpen(false);
    setEditingPermission(null);
  };

  // 🗑️ Supprimer
  const handleDelete = () => {
    if (confirmDelete?.type === 'role') {
      setRoles(prev => prev.filter(r => r.id !== confirmDelete.id));
    } else if (confirmDelete?.type === 'permission') {
      setPermissions(prev => prev.filter(p => p.id !== confirmDelete.id));
    }
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des permissions</h1>
          <p className="text-gray-600 mt-1 dark:text-gray-300">Gérez les rôles et permissions des utilisateurs</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            icon={Plus}
            size="sm"
            onClick={() => {
              setEditingPermission(null);
              setIsPermissionModalOpen(true);
            }}
          >
            Nouvelle permission
          </Button>
          <Button
            icon={Plus}
            onClick={() => {
              setEditingRole(null);
              setIsRoleModalOpen(true);
            }}
          >
            Nouveau rôle
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Total rôles" value={totalRoles.toString()} icon={Shield} color="blue" />
        <StatsCard title="Total permissions" value={totalPermissions.toString()} icon={Key} color="green" />
        <StatsCard title="Utilisateurs avec rôles" value={totalUsersWithRoles.toString()} icon={Users} color="purple" />
        <StatsCard title="Permissions actives" value={activePermissions.toString()} icon={Lock} color="orange" />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('roles')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'roles'
                ? 'border-red-500 text-red-600 dark:text-red-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            Rôles
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'permissions'
                ? 'border-red-500 text-red-600 dark:text-red-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            Permissions
          </button>
        </nav>
      </div>

      {/* Search */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder={`Rechercher ${activeTab === 'roles' ? 'des rôles' : 'des permissions'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
      </Card>

      {/* Content */}
      {activeTab === 'roles' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoles.map((role) => (
            <Card key={role.id} className="hover:shadow-md transition-shadow bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-${role.color}-100 text-${role.color}-600 dark:bg-${role.color}-900/30 dark:text-${role.color}-400 rounded-lg flex items-center justify-center`}>
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{role.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{(role as any).users || 0} utilisateurs</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Edit}
                    onClick={() => {
                      setEditingRole(role);
                      setIsRoleModalOpen(true);
                    }}
                    className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    onClick={() => setConfirmDelete({ type: 'role', id: role.id })}
                    className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{role.description}</p>
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Permissions ({role.permissions.length})</div>
                <div className="flex flex-wrap gap-1">
                  {role.permissions.slice(0, 3).map((perm) => (
                    <Badge key={perm} variant="secondary" size="sm" className="dark:bg-gray-700 dark:text-gray-300">{perm}</Badge>
                  ))}
                  {role.permissions.length > 3 && (
                    <Badge variant="secondary" size="sm" className="dark:bg-gray-700 dark:text-gray-300">+{role.permissions.length - 3}</Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-300">Permission</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-300">Catégorie</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-300">Description</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredPermissions.map((perm) => (
                  <tr key={perm.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="py-4 px-2">
                      <div className="font-medium text-gray-900 dark:text-white">{perm.name}</div>
                    </td>
                    <td className="py-4 px-2">
                      <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-300">{perm.category}</Badge>
                    </td>
                    <td className="py-4 px-2 text-sm text-gray-500 dark:text-gray-400">{perm.description}</td>
                    <td className="py-4 px-2">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Edit}
                          onClick={() => {
                            setEditingPermission(perm);
                            setIsPermissionModalOpen(true);
                          }}
                          className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          onClick={() => setConfirmDelete({ type: 'permission', id: perm.id })}
                          className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modales */}
      <RoleModal
        isOpen={isRoleModalOpen}
        onClose={() => {
          setIsRoleModalOpen(false);
          setEditingRole(null);
        }}
        onSave={handleSaveRole}
        role={editingRole}
      />

      <PermissionModal
        isOpen={isPermissionModalOpen}
        onClose={() => {
          setIsPermissionModalOpen(false);
          setEditingPermission(null);
        }}
        onSave={handleSavePermission}
        permission={editingPermission}
      />

      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer ${confirmDelete?.type === 'role' ? 'ce rôle' : 'cette permission'} ?`}
      />
    </div>
  );
};