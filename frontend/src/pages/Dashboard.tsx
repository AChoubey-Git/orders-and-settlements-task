import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { Order } from '../lib/api';

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
    <main className="w-full h-full p-4 sm:p-6 lg:p-8 xl:p-12">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard overview</h1>
          <p className="text-sm themed-text-sub mt-1">Track your orders and revenue settlements.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Orders', value: orders.length, icon: '📦' },
          { label: 'Revenue Collected', value: `$${totalRevenue.toFixed(2)}`, icon: '💰' },
          { label: 'Outstanding', value: `$${outstanding.toFixed(2)}`, icon: '⏳' },
        ].map(stat => (
          <div
            key={stat.label}
            className="themed-card relative overflow-hidden rounded-2xl p-6 shadow-sm border border-white/20 dark:border-slate-800/50 backdrop-blur-xl group hover:-translate-y-1 transition-all duration-300"
          >
            {/* Glossy gradient effect behind stats */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-lg shadow-inner">
                  {stat.icon}
                </div>
                <p className="text-xs themed-text-sub uppercase tracking-wider font-semibold">{stat.label}</p>
              </div>
              <p className="text-3xl font-extrabold themed-text-main tracking-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <button
              key={f}
              id={`filter-${f}`}
              onClick={() => setFilter(f)}
              className="px-5 py-2 rounded-full text-sm font-semibold capitalize border transition-all shadow-sm"
              style={
                filter === f
                  ? {
                      background: 'var(--accent)',
                      borderColor: 'var(--accent)',
                      color: 'var(--btn-text)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
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
        
        <button
          onClick={handleExport}
          title="Export all orders as CSV"
          className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold themed-card border transition-all hover:-translate-y-0.5 shadow-sm"
        >
          <span>📥</span> Export CSV
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl px-5 py-4 mb-8 text-sm flex items-center gap-3 font-medium">
          <span className="text-lg">⚠️</span> {error}
        </div>
      )}

      {loading ? (
        <div className="text-center themed-text-sub py-20 bg-white/30 dark:bg-slate-900/30 rounded-3xl border border-white/20 dark:border-slate-800/30 backdrop-blur-sm">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2.5 h-2.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2.5 h-2.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="mt-4 text-sm font-medium tracking-wide">Syncing latest data…</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-24 bg-white/30 dark:bg-slate-900/30 rounded-3xl border border-white/20 dark:border-slate-800/30 backdrop-blur-sm">
          <div className="text-6xl mb-6 grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all cursor-default">📋</div>
          <p className="themed-text-sub text-lg font-medium">No orders found.</p>
          <Link
            to="/orders/new"
            className="themed-link text-sm mt-3 inline-block font-semibold"
          >
            Create your first order →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-5 sm:gap-6">
          {orders.map(order => {
            const remaining = order.total - order.amountPaid;
            const progress = order.total > 0 ? (order.amountPaid / order.total) * 100 : 0;
            return (
              <Link
                key={order._id}
                to={`/orders/${order._id}`}
                className="block themed-card relative overflow-hidden rounded-3xl p-6 group flex flex-col h-full hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:hover:shadow-[0_8px_30px_rgba(255,255,255,0.05)] transition-all duration-300 border border-white/20 dark:border-slate-800/50 hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                
                <div className="relative z-10 flex justify-between items-start mb-8 gap-3">
                  <div className="overflow-hidden">
                    <h2 className="font-bold themed-text-main transition truncate text-lg tracking-tight" style={{ transition: 'color 0.2s' }}>
                      {order.customerName}
                    </h2>
                    <p className="text-xs themed-text-sub mt-1.5 font-medium flex items-center gap-1.5">
                      <span className="opacity-70">🗓</span> {new Date(order.dueDate).toLocaleDateString()}
                      <span className="opacity-30">•</span>
                      <span>{order.lineItems.length} item(s)</span>
                    </p>
                  </div>
                  <span className={`text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg font-bold whitespace-nowrap shadow-sm backdrop-blur-md ${STATUS_STYLES[order.status]}`}>
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>
                
                <div className="relative z-10 mt-auto">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <p className="text-[10px] themed-text-sub font-bold uppercase tracking-widest mb-1 opacity-70">Total</p>
                      <p className="themed-text-main font-extrabold text-2xl tracking-tight">${order.total.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] themed-text-sub font-bold uppercase tracking-widest mb-1 opacity-70">Remaining</p>
                      <p className="font-bold text-sm text-amber-600 dark:text-amber-400">${remaining.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="bg-slate-200/50 dark:bg-slate-800/50 rounded-full h-1.5 overflow-hidden shadow-inner backdrop-blur-sm">
                    <div
                      className="h-full rounded-full themed-progress-bar transition-all duration-1000 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
