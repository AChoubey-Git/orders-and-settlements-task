import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { Order } from '../lib/api';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  partially_paid: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  paid: 'bg-green-500/20 text-green-300 border-green-500/30',
  overdue: 'bg-red-500/20 text-red-300 border-red-500/30',
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
      if (err instanceof Error && err.message.includes('401')) navigate('/login');
      else setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem('access_token');
    navigate('/login');
  }

  const totalRevenue = orders.reduce((s, o) => s + o.amountPaid, 0);
  const outstanding = orders.reduce((s, o) => s + (o.total - o.amountPaid), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between bg-black/20 backdrop-blur-sm sticky top-0 z-10">
        <h1 className="text-xl font-bold text-white tracking-tight">Orders & Settlements</h1>
        <div className="flex items-center gap-3">
          <Link
            to="/orders/new"
            id="create-order-btn"
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition shadow-lg shadow-indigo-900/30"
          >
            + New Order
          </Link>
          <button
            onClick={logout}
            className="text-sm text-slate-400 hover:text-white transition px-3 py-2 rounded-lg hover:bg-white/5"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Orders', value: orders.length, color: 'indigo' },
            { label: 'Revenue Collected', value: `$${totalRevenue.toFixed(2)}`, color: 'green' },
            { label: 'Outstanding', value: `$${outstanding.toFixed(2)}`, color: 'yellow' },
          ].map(stat => (
            <div
              key={stat.label}
              className="bg-white/5 border border-white/10 rounded-xl px-5 py-4 hover:bg-white/10 transition"
            >
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
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
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize border transition ${
                filter === f
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {f === 'partially_paid' ? 'Partially Paid' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-400/50 text-red-200 rounded-lg px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center text-slate-400 py-20">Loading orders…</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400 text-lg">No orders found.</p>
            <Link to="/orders/new" className="text-indigo-400 hover:text-white text-sm mt-2 inline-block transition">
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
                  className="block bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 hover:border-indigo-500/40 transition group"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-white group-hover:text-indigo-300 transition">
                        {order.customerName}
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Due: {new Date(order.dueDate).toLocaleDateString()} · {order.lineItems.length} item(s)
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_STYLES[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                      <div className="text-right">
                        <p className="text-white font-bold">${order.total.toFixed(2)}</p>
                        <p className="text-xs text-slate-400">${remaining.toFixed(2)} due</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500"
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
