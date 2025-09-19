// src/pages/ResetPasswordPage.tsx
import React, { useState, useEffect } from 'react';
import logoImage from '../../public/logo.png';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Récupère le token depuis l'URL
  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (!tokenFromUrl) {
      setError('Lien invalide ou expiré.');
    } else {
      setToken(tokenFromUrl);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (!newPassword || !confirmPassword) {
      setError('Tous les champs sont requis.');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/reset-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Échec de réinitialisation');
      }

      const data = await res.json();
      setMessage(data.message);
      setTimeout(() => navigate('/admin-panel'), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-6 rounded shadow w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <img src={logoImage} alt="Logo" className="h-16" />
        </div>

        <h1 className="text-xl font-bold text-center">Réinitialiser le mot de passe</h1>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        {message && <p className="text-green-500 text-sm text-center">{message}</p>}

        {!message && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              placeholder="Nouveau mot de passe"
              className="w-full p-2 border rounded"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
            />
            <input
              type="password"
              placeholder="Confirmer le mot de passe"
              className="w-full p-2 border rounded"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 disabled:opacity-70"
              disabled={loading}
            >
              {loading ? 'Réinitialisation...' : 'Réinitialiser'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}