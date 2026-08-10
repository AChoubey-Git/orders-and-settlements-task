import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import ThemeSwitcher from '../components/ThemeSwitcher';

export default function Register() {
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
      const { access_token } = await api.auth.register(email, password);
      localStorage.setItem('access_token', access_token);
      navigate('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      // Show friendly messages
      if (msg.toLowerCase().includes('email already')) {
        setError('This email is already registered. Please sign in instead.');
      } else {
        setError(msg);
      }
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
          <p className="themed-accent-text mt-2 text-sm font-medium">Create your account</p>
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
                id="register-email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="themed-input w-full rounded-xl px-4 py-2.5 text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium themed-text-sub mb-1.5">
                Password <span className="opacity-70 text-xs">(min 6 chars)</span>
              </label>
              <input
                id="register-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="themed-input w-full rounded-xl px-4 py-2.5 text-sm"
                placeholder="••••••••"
              />
            </div>
            <button
              id="register-submit"
              type="submit"
              disabled={loading}
              className="themed-accent-btn w-full font-semibold py-3 rounded-full text-sm mt-2 shadow-lg"
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-sm themed-text-sub mt-6">
            Already have an account?{' '}
            <Link to="/login" className="themed-link font-medium">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
