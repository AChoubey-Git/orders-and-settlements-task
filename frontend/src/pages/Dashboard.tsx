import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { Order } from '../lib/api';
import ThemeSwitcher from '../components/ThemeSwitcher';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-300 border border-yellow-500/30',
  partially_paid: 'bg-blue-400/20 text-blue-600 dark:text-blue-300 border border-blue-400/30',
  paid: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30',
  overdue: 'bg-red-500/20 text-red-600 dark:text-red-300 border border-red-500/30',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  partially_paid: 'Partially Paid',
  paid: 'Paid',
  overdue: 'Overdue',
};

const FILTERS = ['all', 'pending', 'partially_paid', 'paid', 'overdue'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('access_token')) {
      navigate('/login');
      return;
    }
    loadOrders();
  }, [filter]);

  async function loadOrders() {
    setLoading(true);
    setError('');
    try {
      const data = await api.orders.list(filter !== 'all' ? filter : undefined);
      setOrders(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load orders';
      if (msg.toLowerCase().includes('unauthorized') || msg.includes('401')) {
        localStorage.removeItem('access_token');
        navigate('/login');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem('access_token');
    navigate('/login');
  }

  async function handleExport() {
    try {
      const csv = await api.orders.exportCsv(undefined, undefined, filter !== 'all' ? filter : undefined);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to export orders';
      setError(msg);
    }
  }

  const totalRevenue = orders.reduce((s, o) => s + o.amountPaid, 0);
  const outstanding = orders.reduce((s, o) => s + (o.total - o.amountPaid), 0);

  return (
    <div className="min-h-screen themed-bg themed-text-main">
      {/* Header */}
      <header
        className="themed-border-b border-b px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between sticky top-0 z-10 backdrop-blur-md gap-4 sm:gap-0"
        style={{ background: 'var(--header-bg)' }}
      >
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ background: 'var(--accent)' }}
            >
              O
            </div>
            <h1 className="text-lg font-bold tracking-tight">Orders &amp; Settlements</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <ThemeSwitcher />
          <button
            onClick={handleExport}
            title="Export all orders as CSV"
            className="themed-card text-sm font-semibold px-5 py-2.5 rounded-full ml-auto sm:ml-0 transition hover:-translate-y-0.5 border"
          >
            Export CSV
          </button>
          <Link
            to="/orders/new"
            id="create-order-btn"
            className="themed-accent-btn text-sm font-semibold px-5 py-2.5 rounded-full"
          >
            + New Order
          </Link>
          <button
            onClick={logout}
            className="text-sm themed-text-sub hover:themed-text-main transition px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Orders', value: orders.length, icon: '📦' },
            { label: 'Revenue Collected', value: `$${totalRevenue.toFixed(2)}`, icon: '💰' },
            { label: 'Outstanding', value: `$${outstanding.toFixed(2)}`, icon: '⏳' },
          ].map(stat => (
            <div
              key={stat.label}
              className="themed-card rounded-3xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{stat.icon}</span>
                <p className="text-xs themed-text-sub uppercase tracking-wider font-medium">{stat.label}</p>
              </div>
              <p className="text-2xl font-bold themed-text-main">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {FILTERS.map(f => (
            <button
              key={f}
              id={`filter-${f}`}
              onClick={() => setFilter(f)}
              className="px-5 py-2 rounded-full text-sm font-medium capitalize border transition shadow-sm"
              style={
                filter === f
                  ? {
                      background: 'var(--accent)',
                      borderColor: 'var(--accent)',
                      color: 'var(--btn-text)',
                    }
                  : {
                      background: 'var(--input-bg)',
                      borderColor: 'var(--border-light)',
                      color: 'var(--text-sub)',
                    }
              }
            >
              {f === 'partially_paid' ? 'Partially Paid' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-500/15 border border-red-400/40 text-red-600 dark:text-red-300 rounded-xl px-4 py-3 mb-6 text-sm flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {loading ? (
          <div className="text-center themed-text-sub py-20">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="mt-3 text-sm">Loading orders…</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📋</div>
            <p className="themed-text-sub text-lg">No orders found.</p>
            <Link
              to="/orders/new"
              className="themed-link text-sm mt-2 inline-block font-medium"
            >
              Create your first order →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => {
              const remaining = order.total - order.amountPaid;
              const progress = order.total > 0 ? (order.amountPaid / order.total) * 100 : 0;
              return (
                <Link
                  key={order._id}
                  to={`/orders/${order._id}`}
                  className="block themed-card rounded-3xl p-6 group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <h2 className="font-semibold themed-text-main transition" style={{ transition: 'color 0.2s' }}>
                        {order.customerName}
                      </h2>
                      <p className="text-xs themed-text-sub mt-1">
                        Due: {new Date(order.dueDate).toLocaleDateString()} · {order.lineItems.length} item(s)
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${STATUS_STYLES[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                      <div className="text-right">
                        <p className="themed-text-main font-bold">${order.total.toFixed(2)}</p>
                        <p className="text-xs themed-text-sub">${remaining.toFixed(2)} due</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 bg-slate-200 dark:bg-slate-800/50 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full themed-progress-bar transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
