import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import type { LineItem } from '../lib/api';

interface LineItemForm {
  description: string;
  quantity: string;
  unitPrice: string;
}

export default function CreateOrder() {
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [lineItems, setLineItems] = useState<LineItemForm[]>([
    { description: '', quantity: '1', unitPrice: '' },
  ]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function addLineItem() {
    setLineItems(prev => [...prev, { description: '', quantity: '1', unitPrice: '' }]);
  }

  function removeLineItem(idx: number) {
    setLineItems(prev => prev.filter((_, i) => i !== idx));
  }

  function updateLineItem(idx: number, field: keyof LineItemForm, value: string) {
    setLineItems(prev =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)),
    );
  }

  const subtotal = lineItems.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const parsed: LineItem[] = lineItems.map(item => ({
        description: item.description,
        quantity: parseFloat(item.quantity),
        unitPrice: parseFloat(item.unitPrice),
      }));
      const order = await api.orders.create({ customerName, dueDate, lineItems: parsed });
      navigate(`/orders/${order._id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
      <header className="border-b border-white/10 px-6 py-4 flex items-center gap-4 bg-black/20 backdrop-blur-sm sticky top-0 z-10">
        <Link to="/" className="text-slate-400 hover:text-white transition text-sm">← Dashboard</Link>
        <h1 className="text-lg font-bold">Create New Order</h1>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/20 border border-red-400/50 text-red-200 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-indigo-300 text-sm uppercase tracking-wider">Order Details</h2>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Customer Name</label>
              <input
                id="customer-name"
                type="text"
                required
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                placeholder="Acme Corp"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Due Date</label>
              <input
                id="due-date"
                type="date"
                required
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-indigo-300 text-sm uppercase tracking-wider">Line Items</h2>
              <button
                type="button"
                onClick={addLineItem}
                className="text-xs text-indigo-400 hover:text-white border border-indigo-500/40 hover:border-indigo-400 px-3 py-1 rounded-lg transition"
              >
                + Add Item
              </button>
            </div>
            <div className="space-y-3">
              {lineItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-5">
                    <input
                      id={`item-desc-${idx}`}
                      type="text"
                      required
                      placeholder="Description"
                      value={item.description}
                      onChange={e => updateLineItem(idx, 'description', e.target.value)}
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      id={`item-qty-${idx}`}
                      type="number"
                      min="1"
                      required
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={e => updateLineItem(idx, 'quantity', e.target.value)}
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      id={`item-price-${idx}`}
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      placeholder="Unit Price"
                      value={item.unitPrice}
                      onChange={e => updateLineItem(idx, 'unitPrice', e.target.value)}
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    />
                  </div>
                  <div className="col-span-2 flex items-center justify-between gap-1">
                    <span className="text-sm text-slate-400 whitespace-nowrap">
                      ${((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)).toFixed(2)}
                    </span>
                    {lineItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLineItem(idx)}
                        className="text-red-400 hover:text-red-300 transition text-lg leading-none"
                        aria-label="Remove item"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end border-t border-white/10 pt-3">
              <div className="text-right">
                <p className="text-xs text-slate-400 uppercase tracking-wider">Total</p>
                <p className="text-2xl font-bold text-white">${subtotal.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <button
            id="submit-order"
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-indigo-900/30"
          >
            {loading ? 'Creating Order…' : 'Create Order'}
          </button>
        </form>
      </main>
    </div>
  );
}
