import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Filter, Download, Upload, Users, UserCheck, UserX, Clock, AlertCircle } from 'lucide-react';
import { UserTable } from './UserTable';
import { UserModal } from './UserModal';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { StatsCard } from '../dashboard/StatsCard';
import { User } from '../../types';

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

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ role: '', status: '' });
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAllowed, setIsAllowed] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchCurrentUser = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setIsAllowed(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/auth/me/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        setIsAllowed(false);
        return;
      }

      const userData = await res.json();
      setUserRole(userData.role);
      setIsAllowed(userData.role === 'admin');
    } catch (err) {
      console.error('Erreur lors de la vérification du rôle:', err);
      setIsAllowed(false);
    }
  };

  const fetchUsers = async () => {
    if (!isAllowed) return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE_URL}/users/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (res.status === 401) {
        setError('Accès refusé : session expirée ou non authentifiée.');
        return;
      }
      if (!res.ok) throw new Error(`Erreur API : ${res.status}`);
      
      const data = await res.json();
      setUsers(data.results ?? data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erreur inconnue lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchCurrentUser();
      if (isAllowed) {
        await fetchUsers();
      } else {
        setLoading(false);
      }
    };
    init();
  }, [isAllowed]);

  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (userId: string | number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/users/${userId}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.');
        return;
      }
      if (!res.ok) throw new Error('Erreur lors de la suppression');
      fetchUsers();
    } catch {
      alert('Erreur lors de la suppression');
    }
  };

  const handleSaveUser = async (userData: Partial<User> & { password?: string; avatar?: File | null }) => {
    try {
      const url = selectedUser
        ? `${API_BASE_URL}/users/${selectedUser.id}/`
        : `${API_BASE_URL}/users/`;
      const method = selectedUser ? 'PUT' : 'POST';

      if (!selectedUser && (!userData.password || userData.password.trim() === '')) {
        alert("Le mot de passe est obligatoire pour créer un utilisateur");
        return;
      }
      if (!userData.first_name || userData.first_name.trim() === '') {
        alert("Le prénom est obligatoire");
        return;
      }
      if (!userData.last_name || userData.last_name.trim() === '') {
        alert("Le nom est obligatoire");
        return;
      }

      const headers = getAuthHeaders(false);
      delete headers['Content-Type'];

      const formData = new FormData();
      formData.append('first_name', userData.first_name);
      formData.append('last_name', userData.last_name);
      formData.append('email', userData.email || '');
      formData.append('role', userData.role || 'viewer');
      formData.append('status', userData.status || 'active');
      if (userData.password) {
        formData.append('password', userData.password);
      }
      if (userData.avatar instanceof File) {
        formData.append('avatar', userData.avatar);
      }

      const res = await fetch(url, {
        method,
        headers,
        body: formData,
      });

      if (res.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.');
        return;
      }
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Erreur lors de la sauvegarde : ${res.status} ${errorText}`);
      }

      setIsModalOpen(false);
      fetchUsers();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.last_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !filters.role || user.role === filters.role;
    const matchesStatus = !filters.status || user.status === filters.status;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === 'active').length;
  const pendingUsers = users.filter((u) => u.status === 'pending').length;
  const inactiveUsers = users.filter((u) => u.status === 'inactive').length;

  const handleExport = () => {
    const headers = ['Prénom', 'Nom', 'Email', 'Rôle', 'Statut'];
    const rows = filteredUsers.map(u => [
      u.first_name ?? '',
      u.last_name ?? '',
      u.email ?? '',
      u.role ?? '',
      u.status ?? '',
    ]);

    const csvContent =
      [headers, ...rows]
        .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(';'))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `utilisateurs_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
      if (lines.length < 2) {
        alert('Fichier CSV vide ou invalide');
        return;
      }
      const header = lines[0].split(';').map(h => h.trim().toLowerCase());
      const expectedHeaders = ['prénom', 'nom', 'email', 'rôle', 'statut'];
      const isValidHeader = expectedHeaders.every(h => header.includes(h));
      if (!isValidHeader) {
        alert('Le fichier CSV doit contenir les colonnes : Prénom;Nom;Email;Rôle;Statut');
        return;
      }

      setLoading(true);
      setError(null);

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(';').map(c => c.trim());
        if (cols.length < 5) continue;
        const userPayload = {
          first_name: cols[header.indexOf('prénom')] || '',
          last_name: cols[header.indexOf('nom')] || '',
          email: cols[header.indexOf('email')] || '',
          role: cols[header.indexOf('rôle')] || 'viewer',
          status: cols[header.indexOf('statut')] || 'active',
          password: 'defaultPassword123!',
        };

        const res = await fetch(`${API_BASE_URL}/users/`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(userPayload),
        });

        if (res.status === 401) {
          throw new Error('Session expirée pendant l’import.');
        }
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Erreur à la ligne ${i + 1} : ${errorText}`);
        }
      }

      alert('Import terminé avec succès');
      fetchUsers();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isAllowed) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAllowed) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des utilisateurs</h1>
            <p className="text-gray-600 mt-1 dark:text-gray-300">Gérez les comptes utilisateurs et leurs permissions</p>
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
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des utilisateurs</h1>
          <p className="text-gray-600 mt-1 dark:text-gray-300">Gérez les comptes utilisateurs et leurs permissions</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" icon={Download} size="sm" onClick={handleExport} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">Exporter</Button>
          <Button variant="outline" icon={Upload} size="sm" onClick={handleImportClick} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">Importer</Button>
          <Button icon={Plus} onClick={handleCreateUser} className="dark:bg-red-700 dark:hover:bg-red-800">Nouvel utilisateur</Button>
          <input
            type="file"
            accept=".csv,text/csv"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Total utilisateurs" value={totalUsers.toString()} icon={Users} color="blue" />
        <StatsCard title="Utilisateurs actifs" value={activeUsers.toString()} icon={UserCheck} color="green" />
        <StatsCard title="En attente" value={pendingUsers.toString()} icon={Clock} color="orange" />
        <StatsCard title="Inactifs" value={inactiveUsers.toString()} icon={UserX} color="purple" />
      </div>

      {/* Filters */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          
          <select
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">Tous les rôles</option>
            <option value="admin">Admin</option>
            <option value="editor">Éditeur</option>
            <option value="viewer">Lecteur</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
            <option value="pending">En attente</option>
          </select>

          <Button variant="outline" icon={Filter} size="sm" className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">Filtres</Button>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/30 dark:border-red-800">
          <div className="text-red-800 dark:text-red-200"><strong>Erreur:</strong> {error}</div>
        </Card>
      )}

      {/* Table */}
      <UserTable users={filteredUsers} onEdit={handleEditUser} onDelete={handleDeleteUser} />

      {/* Modal */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={selectedUser}
        onSave={handleSaveUser}
      />
    </div>
  );
};