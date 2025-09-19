import { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';

export function useDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch('/dashboard/stats/'),
      apiFetch('/users/').then(response => response.results)

    ])
      .then(([statsData, usersData]) => {
        setStats(statsData);
        setUsers(usersData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { stats, users, loading };
}
