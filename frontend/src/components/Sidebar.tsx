import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem('access_token');
    navigate('/login');
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex flex-col h-full bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-r themed-border border-slate-200/50 dark:border-slate-800/50 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
      {/* Brand */}
      <div className="px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0"
            style={{ background: 'var(--accent)' }}
          >
            O
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-br from-slate-800 to-slate-500 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
              Orders
            </h1>
            <p className="text-[10px] uppercase tracking-widest font-bold themed-text-sub">&amp; Settlements</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
            aria-label="Close menu"
          >
            ✖
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <Link
          to="/"
          onClick={onClose}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
            isActive('/')
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md'
              : 'themed-text-sub hover:themed-text-main hover:bg-slate-100 dark:hover:bg-white/5'
          }`}
        >
          <span className="text-lg">📊</span>
          Dashboard
        </Link>
        <Link
          to="/orders/new"
          onClick={onClose}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
            isActive('/orders/new')
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md'
              : 'themed-text-sub hover:themed-text-main hover:bg-slate-100 dark:hover:bg-white/5'
          }`}
        >
          <span className="text-lg">➕</span>
          New Order
        </Link>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t themed-border border-slate-200/50 dark:border-slate-800/50">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 font-medium text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20"
        >
          <span className="text-lg">🚪</span>
          Logout
        </button>
      </div>
    </div>
  );
}
