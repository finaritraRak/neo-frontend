// src/pages/Login.tsx
import React, { useState, useEffect } from 'react';
import logoImage from '../../public/logo.png';

export default function Login({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

  useEffect(() => {
    const applyTheme = (theme: 'light' | 'dark' | 'auto') => {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      if (theme === 'dark') {
        root.classList.add('dark');
      } else if (theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', prefersDark);
      } else {
        root.classList.add('light');
      }
    };

    const savedTheme = localStorage.getItem('app-theme') as 'light' | 'dark' | 'auto' | null;
    applyTheme(savedTheme || 'light');
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error('Échec de connexion');
      const data = await res.json();

      if (!data.token) {
        throw new Error('Token manquant dans la réponse');
      }

      localStorage.setItem('token', data.token);
      onSuccess();
    } catch (err) {
      setError('Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/forgot-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });

      if (!res.ok) throw new Error('Échec d’envoi');
      const data = await res.json();
      setMessage(data.message);
    } catch {
      setError('Impossible d’envoyer l’email.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (!token || !newPassword || !confirmPassword) {
      setError('Tous les champs sont requis.');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mots de passe non identiques.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/reset-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      if (!res.ok) throw new Error('Échec');
      const data = await res.json();
      setMessage(data.message);
      setTimeout(() => setForgotPassword(false), 2000);
    } catch {
      setError('Erreur réseau ou lien invalide.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md space-y-6 transition-colors duration-200">
        <div className="flex justify-center">
          <img src={logoImage} alt="Logo" className="h-16" />
        </div>

        {!forgotPassword ? (
          <>
            <h1 className="text-xl font-bold text-center text-gray-900 dark:text-white">Connexion</h1>
            {error && <p className="text-red-500 dark:text-red-400 text-sm text-center">{error}</p>}
            {message && <p className="text-green-500 dark:text-green-400 text-sm text-center">{message}</p>}

            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mot de passe"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  )}
                </button>
              </div>
              <button
                type="submit"
                className="w-full bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 disabled:opacity-70 transition-colors duration-200"
                disabled={loading}
              >
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
              <div className="text-center">
                <button
                  type="button"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  onClick={() => {
                    setForgotPassword(true);
                    setError('');
                    setMessage('');
                  }}
                >
                  Mot de passe oublié ?
                </button>
              </div>
            </form>
          </>
        ) : (
          <div>
            <h1 className="text-xl font-bold text-center text-gray-900 dark:text-white">Réinitialiser</h1>
            {error && <p className="text-red-500 dark:text-red-400 text-sm text-center">{error}</p>}
            {message && <p className="text-green-500 dark:text-green-400 text-sm text-center">{message}</p>}

            {!message ? (
              <form onSubmit={handleForgotSubmit} className="space-y-4 mt-4">
                <input
                  type="email"
                  placeholder="Votre email"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 disabled:opacity-70 transition-colors duration-200"
                  disabled={loading}
                >
                  {loading ? 'Envoi...' : 'Envoyer le lien'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-4 mt-4">
                <input
                  type="text"
                  placeholder="Jeton"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Nouveau mot de passe"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Confirmer"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 disabled:opacity-70 transition-colors duration-200"
                  disabled={loading}
                >
                  {loading ? 'Réinitialisation...' : 'Réinitialiser'}
                </button>
              </form>
            )}
            <div className="text-center mt-4">
              <button
                type="button"
                className="text-sm text-gray-600 dark:text-gray-400 hover:underline"
                onClick={() => {
                  setForgotPassword(false);
                  setMessage('');
                  setError('');
                }}
              >
                Retour
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}