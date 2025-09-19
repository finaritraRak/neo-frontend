import { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import type { User } from '../types';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await apiFetch(`/users/`);  // si pagination: `/users/?page=${currentPage}`
      setUsers(res.results || res); // supporte à la fois format paginé ou liste simple
      if (res.count) {
        setTotalPages(Math.ceil(res.count / 10)); // si pagination backend (10 items/page)
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: Partial<User>) => {
    const newUser = await apiFetch(`/users/`, {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    setUsers(prev => [newUser, ...prev]);
  };

  const updateUser = async (id: string, userData: Partial<User>) => {
    const updatedUser = await apiFetch(`/users/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(userData)
    });
    setUsers(prev => prev.map(u => (u.id === id ? updatedUser : u)));
  };

  const deleteUser = async (id: string) => {
    await apiFetch(`/users/${id}/`, { method: 'DELETE' });
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage]);

  return {
    users,
    loading,
    error,
    totalPages,
    currentPage,
    searchTerm,
    setSearchTerm,
    setCurrentPage,
    createUser,
    updateUser,
    deleteUser,
  };
}
