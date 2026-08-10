import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import ThemeSwitcher from '../components/ThemeSwitcher';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { access_token } = await api.auth.login(email, password);
      localStorage.setItem('access_token', access_token);
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen themed-bg flex items-center justify-center px-4">
      {/* Theme switcher - top right */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeSwitcher />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-[1.25rem] flex items-center justify-center font-bold text-3xl mx-auto mb-6 shadow-xl"
            style={{ background: 'var(--accent)', color: 'var(--btn-text)', boxShadow: '0 8px 32px var(--accent-shadow)' }}
          >
            O
          </div>
          <h1 className="text-3xl font-bold themed-text-main tracking-tight">Orders &amp; Settlements</h1>
          <p className="themed-accent-text mt-2 text-sm font-medium">Sign in to your account</p>
        </div>

        <div className="themed-card rounded-3xl p-8 sm:p-10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/15 border border-red-400/40 text-red-600 dark:text-red-300 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium themed-text-sub mb-1.5">Email</label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="themed-input w-full rounded-xl px-4 py-2.5 text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium themed-text-sub mb-1.5">Password</label>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="themed-input w-full rounded-xl px-4 py-2.5 text-sm"
                placeholder="••••••••"
              />
            </div>
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="themed-accent-btn w-full font-semibold py-3 rounded-full text-sm mt-2 shadow-lg"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
          <p className="text-center text-sm themed-text-sub mt-6">
            No account?{' '}
            <Link to="/register" className="themed-link font-medium">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
