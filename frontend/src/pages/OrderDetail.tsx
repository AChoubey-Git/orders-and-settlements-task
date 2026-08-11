import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { Order, Payment } from '../lib/api';

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
    <main className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 xl:p-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-3 overflow-hidden">
          <Link to="/" className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors themed-text-main shadow-sm flex-shrink-0">
            ←
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight truncate">{order.customerName}</h1>
            <p className="text-sm themed-text-sub mt-1">Order Details &amp; History</p>
          </div>
        </div>
        <span className={`text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg font-bold whitespace-nowrap shadow-sm backdrop-blur-md ${STATUS_STYLES[order.status]}`}>
          {STATUS_LABELS[order.status]}
        </span>
      </div>

      <div className="space-y-6 sm:space-y-8">
        {/* Summary Card */}
        <div className="themed-card relative overflow-hidden rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/20 dark:border-slate-800/50 backdrop-blur-xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8">
            <div>
              <p className="text-[10px] themed-text-sub font-bold uppercase tracking-widest mb-2 opacity-70">Total Amount</p>
              <p className="text-3xl sm:text-4xl font-extrabold tracking-tight">${order.total.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[10px] themed-text-sub font-bold uppercase tracking-widest mb-2 opacity-70">Amount Paid</p>
              <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">${order.amountPaid.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[10px] themed-text-sub font-bold uppercase tracking-widest mb-2 opacity-70">Remaining Balance</p>
              <p className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${remaining > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                ${remaining.toFixed(2)}
              </p>
            </div>
            <div className="md:text-right">
              <p className="text-[10px] themed-text-sub font-bold uppercase tracking-widest mb-2 opacity-70">Due Date</p>
              <p className="text-xl font-bold tracking-tight">{new Date(order.dueDate).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="bg-slate-200/50 dark:bg-slate-800/50 rounded-full h-2.5 overflow-hidden shadow-inner backdrop-blur-sm">
            <div
              className="h-full themed-progress-bar rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs themed-text-sub mt-3 font-bold uppercase tracking-widest opacity-80 text-right">{progress.toFixed(0)}% Settled</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          {/* Left Column: Line Items */}
          <div className="lg:col-span-7">
            <div className="themed-card rounded-3xl shadow-sm p-6 sm:p-8 border border-white/20 dark:border-slate-800/50 backdrop-blur-xl h-full">
              <h2 className="font-bold themed-text-main text-sm uppercase tracking-widest mb-6">Line Items</h2>
              <div className="space-y-3">
                {order.lineItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-4 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl transition-all hover:bg-slate-50 dark:hover:bg-slate-900">
                    <div>
                      <p className="text-sm font-bold">{item.description}</p>
                      <p className="text-xs themed-text-sub mt-1 font-medium">{item.quantity} × ${item.unitPrice.toFixed(2)}</p>
                    </div>
                    <p className="text-base font-extrabold tracking-tight">${(item.quantity * item.unitPrice).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-6 pt-6 border-t border-slate-200/50 dark:border-slate-800/50">
                <p className="text-xs font-bold uppercase tracking-widest themed-text-sub mt-1">Subtotal</p>
                <p className="font-extrabold text-2xl tracking-tight">${order.total.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Right Column: Payment Form + History */}
          <div className="lg:col-span-5 space-y-6 sm:space-y-8">
            {/* Payment/Refund Form */}
            {(order.status !== 'paid' || order.amountPaid > 0) && (
              <div className="themed-card rounded-3xl p-6 sm:p-8 shadow-sm border border-white/20 dark:border-slate-800/50 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold themed-text-main text-sm uppercase tracking-widest">Transaction</h2>
                  <select
                    value={payType}
                    onChange={e => setPayType(e.target.value as 'payment' | 'refund')}
                    className="bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-wider outline-none cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    {!isPaid && <option value="payment">Record Payment</option>}
                    {order.amountPaid > 0 && <option value="refund">Issue Refund</option>}
                  </select>
                </div>
                
                <form onSubmit={handlePayment} className="space-y-5">
                  {payError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl px-4 py-3 text-sm flex items-center gap-3 font-medium">
                      <span>⚠️</span> {payError}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider themed-text-sub mb-2">
                        Amount (Max ${payType === 'refund' ? order.amountPaid.toFixed(2) : remaining.toFixed(2)})
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-sm font-bold themed-text-sub opacity-50">$</span>
                        <input
                          id="payment-amount"
                          type="number"
                          min="0.01"
                          max={payType === 'refund' ? order.amountPaid : remaining}
                          step="0.01"
                          required
                          value={payAmount}
                          onChange={e => setPayAmount(e.target.value)}
                          className="themed-input w-full rounded-2xl pl-8 pr-4 py-3 text-sm font-medium bg-white/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 transition-all border-slate-200 dark:border-slate-800 shadow-inner"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider themed-text-sub mb-2">Date</label>
                      <input
                        id="payment-date"
                        type="date"
                        required
                        value={payDate}
                        onChange={e => setPayDate(e.target.value)}
                        className="themed-input w-full rounded-2xl px-4 py-3 text-sm font-medium bg-white/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 transition-all border-slate-200 dark:border-slate-800 shadow-inner"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider themed-text-sub mb-2">Note (Optional)</label>
                    <input
                      id="payment-note"
                      type="text"
                      value={payNote}
                      onChange={e => setPayNote(e.target.value)}
                      className="themed-input w-full rounded-2xl px-4 py-3 text-sm font-medium bg-white/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 transition-all border-slate-200 dark:border-slate-800 shadow-inner"
                      placeholder="e.g. Bank transfer"
                    />
                  </div>
                  <button
                    id="submit-payment"
                    type="submit"
                    disabled={payLoading}
                    className="themed-accent-btn w-full font-bold text-base py-3.5 rounded-2xl transition-all shadow-[0_8px_20px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 hover:shadow-[0_12px_25px_rgba(0,0,0,0.15)] mt-2"
                  >
                    {payLoading ? 'Processing…' : `Submit ${payType === 'refund' ? 'Refund' : 'Payment'}`}
                  </button>
                </form>
              </div>
            )}

            {/* Payment History */}
            <div className="themed-card rounded-3xl shadow-sm p-6 sm:p-8 border border-white/20 dark:border-slate-800/50 backdrop-blur-xl">
              <h2 className="font-bold themed-text-main text-sm uppercase tracking-widest mb-6">Transactions</h2>
              {payments.length === 0 ? (
                <div className="text-center py-8 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
                  <span className="text-3xl opacity-50 grayscale block mb-3">💸</span>
                  <p className="themed-text-sub text-sm font-medium">No transactions recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map(payment => (
                    <div key={payment._id} className="flex justify-between items-center p-4 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                      <div>
                        <p className={`text-base tracking-tight font-extrabold ${payment.type === 'refund' ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {payment.type === 'refund' ? '-' : '+'}${payment.amount.toFixed(2)}
                          {payment.type === 'refund' && <span className="ml-2 text-[10px] uppercase tracking-wider bg-red-100 text-red-600 px-2 py-0.5 rounded-md font-bold">Refund</span>}
                        </p>
                        {payment.note && <p className="text-xs themed-text-sub mt-1 font-medium">{payment.note}</p>}
                      </div>
                      <p className="text-xs themed-text-sub font-bold opacity-70">{new Date(payment.date).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Audit Log (Status History) */}
            <div className="themed-card rounded-3xl shadow-sm p-6 sm:p-8 border border-white/20 dark:border-slate-800/50 backdrop-blur-xl">
              <h2 className="font-bold themed-text-main text-sm uppercase tracking-widest mb-6">Audit Log</h2>
              {order.statusHistory && order.statusHistory.length > 0 ? (
                <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-2.5 pl-6 space-y-6">
                  {order.statusHistory.map((history, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-[var(--accent)] shadow-[0_0_10px_var(--accent)]" />
                      <p className="text-sm font-medium">Status changed to <span className={`ml-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md font-bold ${STATUS_STYLES[history.status]}`}>{STATUS_LABELS[history.status]}</span></p>
                      <p className="text-xs themed-text-sub mt-1.5 font-medium opacity-70">{new Date(history.timestamp).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="themed-text-sub text-sm font-medium">No audit history available.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
