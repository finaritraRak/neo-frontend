import { useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { apiService } from '../services/api';

interface UseUsersReturn {
  users: User[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  setCurrentPage: (page: number) => void;
  refreshUsers: () => void;
  createUser: (userData: Partial<User>) => Promise<void>;
  updateUser: (id: string, userData: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

export const useUsers = (): UseUsersReturn => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getUsers(currentPage, searchTerm);
      setUsers(response.results || response);
      setTotalPages(Math.ceil((response.count || response.length) / 10));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des utilisateurs');
      // Fallback avec données mock en cas d'erreur API
      const mockUsers: User[] = [
        {
          id: '1',
          email: 'admin@lynkevo.com',
          firstName: 'Admin',
          lastName: 'Lynkevo',
          role: 'admin',
          status: 'active',
          lastLogin: new Date().toISOString(),
          avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
          createdAt: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          email: 'editor@lynkevo.com',
          firstName: 'Éditeur',
          lastName: 'Lynkevo',
          role: 'editor',
          status: 'active',
          lastLogin: '2024-01-15T09:15:00Z',
          avatar: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
          createdAt: '2024-01-02T00:00:00Z'
        }
      ];
      setUsers(mockUsers);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const createUser = async (userData: Partial<User>) => {
    try {
      await apiService.createUser(userData);
      await fetchUsers();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur lors de la création');
    }
  };

  const updateUser = async (id: string, userData: Partial<User>) => {
    try {
      await apiService.updateUser(id, userData);
      await fetchUsers();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await apiService.deleteUser(id);
      await fetchUsers();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  return {
    users,
    loading,
    error,
    totalPages,
    currentPage,
    searchTerm,
    setSearchTerm,
    setCurrentPage,
    refreshUsers: fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  };
};