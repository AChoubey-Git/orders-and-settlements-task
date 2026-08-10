import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { Order, Payment } from '../lib/api';
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

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Payment/Refund form
  const [payType, setPayType] = useState<'payment' | 'refund'>('payment');
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payNote, setPayNote] = useState('');
  const [payError, setPayError] = useState('');
  const [payLoading, setPayLoading] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('access_token')) { navigate('/login'); return; }
    if (id) loadAll(id);
  }, [id]);

  async function loadAll(orderId: string) {
    setLoading(true);
    try {
      const [ord, pays] = await Promise.all([
        api.orders.get(orderId),
        api.payments.list(orderId),
      ]);
      setOrder(ord);
      setPayments(pays);
      if (ord.status === 'paid') {
        setPayType('refund');
      } else {
        setPayType('payment');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setPayError('');
    setPayLoading(true);
    try {
      const result = await api.payments.create(id, {
        amount: parseFloat(payAmount),
        date: payDate,
        note: payNote || undefined,
        type: payType,
      });
      setOrder(result.order);
      setPayments(prev => [result.payment, ...prev]);
      setPayAmount('');
      setPayNote('');
      if (result.order.status === 'paid') {
        setPayType('refund');
      } else if (result.order.amountPaid === 0) {
        setPayType('payment');
      }
    } catch (err: unknown) {
      setPayError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setPayLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen themed-bg flex items-center justify-center">
        <div className="text-center themed-text-sub">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          Loading…
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen themed-bg flex items-center justify-center text-red-600 dark:text-red-400">
        <div className="themed-card p-6 rounded-3xl shadow-sm text-center">
          <span className="text-3xl block mb-2">⚠️</span>
          {error || 'Order not found'}
          <br/>
          <Link to="/" className="themed-link text-sm mt-4 inline-block">← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const remaining = order.total - order.amountPaid;
  const progress = order.total > 0 ? (order.amountPaid / order.total) * 100 : 0;
  const isPaid = order.status === 'paid';

  return (
    <div className="min-h-screen themed-bg themed-text-main">
      <header
        className="themed-border-b border-b px-4 sm:px-6 py-4 flex flex-wrap items-center gap-3 sticky top-0 z-10 backdrop-blur-md"
        style={{ background: 'var(--header-bg)' }}
      >
        <Link to="/" className="themed-text-sub hover:themed-text-main transition text-sm">← Dashboard</Link>
        <h1 className="text-lg font-bold truncate max-w-[50%]">{order.customerName}</h1>
        <span className={`ml-auto text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLES[order.status]}`}>
          {STATUS_LABELS[order.status]}
        </span>
        <ThemeSwitcher />
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Summary Card */}
        <div className="themed-card rounded-3xl shadow-sm p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div>
              <p className="text-xs themed-text-sub uppercase tracking-wider mb-1">Total</p>
              <p className="text-2xl sm:text-3xl font-bold">${order.total.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs themed-text-sub uppercase tracking-wider mb-1">Paid</p>
              <p className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">${order.amountPaid.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs themed-text-sub uppercase tracking-wider mb-1">Remaining</p>
              <p className={`text-2xl sm:text-3xl font-bold ${remaining > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                ${remaining.toFixed(2)}
              </p>
            </div>
            <div className="md:text-right">
              <p className="text-xs themed-text-sub uppercase tracking-wider mb-1">Due Date</p>
              <p className="text-sm font-medium">{new Date(order.dueDate).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="bg-slate-200 dark:bg-slate-800/50 rounded-full h-2 overflow-hidden">
            <div
              className="h-full themed-progress-bar rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs themed-text-sub mt-2 font-medium">{progress.toFixed(0)}% paid</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Line Items */}
          <div className="themed-card rounded-3xl shadow-sm p-6">
            <h2 className="font-semibold themed-section-label text-sm uppercase tracking-wider mb-4">Line Items</h2>
            <div className="space-y-2">
              {order.lineItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-3 border-b themed-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{item.description}</p>
                    <p className="text-xs themed-text-sub mt-0.5">{item.quantity} × ${item.unitPrice.toFixed(2)}</p>
                  </div>
                  <p className="text-sm font-bold">${(item.quantity * item.unitPrice).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 pt-4 border-t themed-border">
              <p className="font-bold">Total</p>
              <p className="font-bold text-lg">${order.total.toFixed(2)}</p>
            </div>
          </div>

          {/* Payment Form + History */}
          <div className="space-y-6">
            {/* Payment/Refund Form */}
            {(order.status !== 'paid' || order.amountPaid > 0) && (
              <div className="themed-card rounded-3xl p-6 sm:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold themed-section-label text-sm uppercase tracking-wider">Record Transaction</h2>
                  <select
                    value={payType}
                    onChange={e => setPayType(e.target.value as 'payment' | 'refund')}
                    className="bg-transparent border themed-border rounded-lg px-2 py-1 text-xs outline-none"
                  >
                    {!isPaid && <option value="payment">Payment</option>}
                    {order.amountPaid > 0 && <option value="refund">Refund</option>}
                  </select>
                </div>
                
                <form onSubmit={handlePayment} className="space-y-4">
                  {payError && (
                    <div className="bg-red-500/15 border border-red-400/40 text-red-600 dark:text-red-300 rounded-xl px-3 py-2 text-sm flex items-center gap-2">
                      <span>⚠️</span> {payError}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium themed-text-sub mb-1">
                        Amount (max ${payType === 'refund' ? order.amountPaid.toFixed(2) : remaining.toFixed(2)})
                      </label>
                      <input
                        id="payment-amount"
                        type="number"
                        min="0.01"
                        max={payType === 'refund' ? order.amountPaid : remaining}
                        step="0.01"
                        required
                        value={payAmount}
                        onChange={e => setPayAmount(e.target.value)}
                        className="themed-input w-full rounded-lg px-3 py-2 text-sm"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium themed-text-sub mb-1">Date</label>
                      <input
                        id="payment-date"
                        type="date"
                        required
                        value={payDate}
                        onChange={e => setPayDate(e.target.value)}
                        className="themed-input w-full rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium themed-text-sub mb-1">Note (optional)</label>
                    <input
                      id="payment-note"
                      type="text"
                      value={payNote}
                      onChange={e => setPayNote(e.target.value)}
                      className="themed-input w-full rounded-lg px-3 py-2 text-sm"
                      placeholder="e.g. First instalment"
                    />
                  </div>
                  <button
                    id="submit-payment"
                    type="submit"
                    disabled={payLoading}
                    className="themed-accent-btn w-full font-semibold py-3 rounded-full text-sm transition shadow-lg"
                  >
                    {payLoading ? 'Processing…' : `Record ${payType === 'refund' ? 'Refund' : 'Payment'}`}
                  </button>
                </form>
              </div>
            )}

            {/* Payment History */}
            <div className="themed-card rounded-3xl shadow-sm p-6">
              <h2 className="font-semibold themed-section-label text-sm uppercase tracking-wider mb-4">Transaction History</h2>
              {payments.length === 0 ? (
                <p className="themed-text-sub text-sm">No transactions recorded yet.</p>
              ) : (
                <div className="space-y-0">
                  {payments.map(payment => (
                    <div key={payment._id} className="flex justify-between items-center py-3 border-b themed-border last:border-0">
                      <div>
                        <p className={`text-sm font-bold ${payment.type === 'refund' ? 'text-red-500' : ''}`}>
                          {payment.type === 'refund' ? '-' : ''}${payment.amount.toFixed(2)}
                          {payment.type === 'refund' && <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Refund</span>}
                        </p>
                        {payment.note && <p className="text-xs themed-text-sub mt-0.5">{payment.note}</p>}
                      </div>
                      <p className="text-xs themed-text-sub font-medium">{new Date(payment.date).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Audit Log (Status History) */}
            <div className="themed-card rounded-3xl shadow-sm p-6">
              <h2 className="font-semibold themed-section-label text-sm uppercase tracking-wider mb-4">Audit Log</h2>
              {order.statusHistory && order.statusHistory.length > 0 ? (
                <div className="relative border-l-2 themed-border ml-2 pl-4 space-y-4">
                  {order.statusHistory.map((history, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[var(--accent)] border-2 border-[var(--card-bg)]" />
                      <p className="text-sm font-medium">Status changed to <span className={`px-1.5 py-0.5 rounded text-xs ${STATUS_STYLES[history.status]}`}>{STATUS_LABELS[history.status]}</span></p>
                      <p className="text-xs themed-text-sub mt-1">{new Date(history.timestamp).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="themed-text-sub text-sm">No audit history available.</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
