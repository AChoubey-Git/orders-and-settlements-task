import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { Order, Payment } from '../lib/api';

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

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Payment form
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
      });
      setOrder(result.order);
      setPayments(prev => [result.payment, ...prev]);
      setPayAmount('');
      setPayNote('');
    } catch (err: unknown) {
      setPayError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setPayLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center text-slate-400">
        Loading…
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center text-red-300">
        {error || 'Order not found'}
      </div>
    );
  }

  const remaining = order.total - order.amountPaid;
  const progress = order.total > 0 ? (order.amountPaid / order.total) * 100 : 0;
  const isPaid = order.status === 'paid';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
      <header className="border-b border-white/10 px-6 py-4 flex items-center gap-4 bg-black/20 backdrop-blur-sm sticky top-0 z-10">
        <Link to="/" className="text-slate-400 hover:text-white transition text-sm">← Dashboard</Link>
        <h1 className="text-lg font-bold">{order.customerName}</h1>
        <span className={`ml-auto text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_STYLES[order.status]}`}>
          {STATUS_LABELS[order.status]}
        </span>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Summary Card */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex flex-wrap gap-6 mb-4">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Total</p>
              <p className="text-3xl font-bold">${order.total.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Paid</p>
              <p className="text-3xl font-bold text-green-400">${order.amountPaid.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Remaining</p>
              <p className={`text-3xl font-bold ${remaining > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                ${remaining.toFixed(2)}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-slate-400 uppercase tracking-wider">Due Date</p>
              <p className="text-sm text-white mt-1">{new Date(order.dueDate).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-green-400 rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">{progress.toFixed(0)}% paid</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Line Items */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="font-semibold text-indigo-300 text-sm uppercase tracking-wider mb-4">Line Items</h2>
            <div className="space-y-2">
              {order.lineItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-sm text-white">{item.description}</p>
                    <p className="text-xs text-slate-400">{item.quantity} × ${item.unitPrice.toFixed(2)}</p>
                  </div>
                  <p className="text-sm font-medium text-white">${(item.quantity * item.unitPrice).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 pt-3 border-t border-white/10">
              <p className="font-semibold text-slate-300">Total</p>
              <p className="font-bold text-white">${order.total.toFixed(2)}</p>
            </div>
          </div>

          {/* Payment Form */}
          <div className="space-y-4">
            {!isPaid && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="font-semibold text-indigo-300 text-sm uppercase tracking-wider mb-4">Record Payment</h2>
                <form onSubmit={handlePayment} className="space-y-3">
                  {payError && (
                    <div className="bg-red-500/20 border border-red-400/50 text-red-200 rounded-lg px-3 py-2 text-sm">
                      {payError}
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Amount (max ${remaining.toFixed(2)})</label>
                    <input
                      id="payment-amount"
                      type="number"
                      min="0.01"
                      max={remaining}
                      step="0.01"
                      required
                      value={payAmount}
                      onChange={e => setPayAmount(e.target.value)}
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Date</label>
                    <input
                      id="payment-date"
                      type="date"
                      required
                      value={payDate}
                      onChange={e => setPayDate(e.target.value)}
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Note (optional)</label>
                    <input
                      id="payment-note"
                      type="text"
                      value={payNote}
                      onChange={e => setPayNote(e.target.value)}
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm"
                      placeholder="e.g. First instalment"
                    />
                  </div>
                  <button
                    id="submit-payment"
                    type="submit"
                    disabled={payLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold py-2 rounded-lg transition text-sm"
                  >
                    {payLoading ? 'Processing…' : 'Record Payment'}
                  </button>
                </form>
              </div>
            )}

            {/* Payment History */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h2 className="font-semibold text-indigo-300 text-sm uppercase tracking-wider mb-4">Payment History</h2>
              {payments.length === 0 ? (
                <p className="text-slate-400 text-sm">No payments recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {payments.map(payment => (
                    <div key={payment._id} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                      <div>
                        <p className="text-sm text-white font-medium">${payment.amount.toFixed(2)}</p>
                        {payment.note && <p className="text-xs text-slate-400">{payment.note}</p>}
                      </div>
                      <p className="text-xs text-slate-400">{new Date(payment.date).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
