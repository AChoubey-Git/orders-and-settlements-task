import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import type { LineItem } from '../lib/api';
import ThemeSwitcher from '../components/ThemeSwitcher';

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
    <main className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-8">
        <Link to="/" className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors themed-text-main shadow-sm">
          ←
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create New Order</h1>
          <p className="text-sm themed-text-sub mt-1">Fill in the details to generate a new order.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl px-5 py-4 text-sm flex items-center gap-3 font-medium">
            <span className="text-lg">⚠️</span> {error}
          </div>
        )}

        <div className="themed-card relative overflow-hidden rounded-3xl p-6 sm:p-8 shadow-sm border border-white/20 dark:border-slate-800/50 backdrop-blur-xl">
          <h2 className="font-bold themed-text-main text-sm uppercase tracking-widest mb-6">Order Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider themed-text-sub mb-2">Customer Name</label>
              <input
                id="customer-name"
                type="text"
                required
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="themed-input w-full rounded-2xl px-4 py-3 text-sm font-medium bg-white/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 transition-all border-slate-200 dark:border-slate-800 shadow-inner"
                placeholder="Acme Corp"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider themed-text-sub mb-2">Due Date</label>
              <input
                id="due-date"
                type="date"
                required
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="themed-input w-full rounded-2xl px-4 py-3 text-sm font-medium bg-white/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 transition-all border-slate-200 dark:border-slate-800 shadow-inner"
              />
            </div>
          </div>
        </div>

        <div className="themed-card relative overflow-hidden rounded-3xl p-6 sm:p-8 shadow-sm border border-white/20 dark:border-slate-800/50 backdrop-blur-xl space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold themed-text-main text-sm uppercase tracking-widest">Line Items</h2>
            <button
              type="button"
              onClick={addLineItem}
              className="text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg px-4 py-2 transition-all shadow-sm"
            >
              + Add Item
            </button>
          </div>
          
          <div className="space-y-3">
            {lineItems.map((item, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start p-4 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl transition-all hover:bg-slate-50 dark:hover:bg-slate-900">
                <div className="sm:col-span-5">
                  <label className="block sm:hidden text-[10px] font-bold uppercase tracking-wider themed-text-sub mb-1.5">Description</label>
                  <input
                    id={`item-desc-${idx}`}
                    type="text"
                    required
                    placeholder="Item description"
                    value={item.description}
                    onChange={e => updateLineItem(idx, 'description', e.target.value)}
                    className="w-full bg-transparent border-0 border-b border-transparent focus:border-slate-400 dark:focus:border-slate-500 focus:ring-0 px-2 py-1.5 text-sm font-medium transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 sm:col-span-5 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block sm:hidden text-[10px] font-bold uppercase tracking-wider themed-text-sub mb-1.5">Qty</label>
                    <input
                      id={`item-qty-${idx}`}
                      type="number"
                      min="1"
                      required
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={e => updateLineItem(idx, 'quantity', e.target.value)}
                      className="w-full bg-transparent border-0 border-b border-transparent focus:border-slate-400 dark:focus:border-slate-500 focus:ring-0 px-2 py-1.5 text-sm font-medium transition-colors text-center sm:text-left"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block sm:hidden text-[10px] font-bold uppercase tracking-wider themed-text-sub mb-1.5">Price</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1.5 text-sm font-bold themed-text-sub opacity-50">$</span>
                      <input
                        id={`item-price-${idx}`}
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        placeholder="0.00"
                        value={item.unitPrice}
                        onChange={e => updateLineItem(idx, 'unitPrice', e.target.value)}
                        className="w-full bg-transparent border-0 border-b border-transparent focus:border-slate-400 dark:focus:border-slate-500 focus:ring-0 pl-6 pr-2 py-1.5 text-sm font-medium transition-colors"
                      />
                    </div>
                  </div>
                </div>
                <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 sm:mt-1 border-t sm:border-t-0 border-slate-200/50 dark:border-slate-700/50">
                  <span className="text-sm font-bold themed-text-main">
                    ${((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)).toFixed(2)}
                  </span>
                  {lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLineItem(idx)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20 text-red-500 hover:bg-red-200 dark:hover:bg-red-500/40 transition-colors flex-shrink-0"
                      aria-label="Remove item"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end pt-6">
            <div className="text-right bg-slate-50 dark:bg-slate-900 rounded-2xl px-6 py-4 border border-slate-200/50 dark:border-slate-800/50 shadow-inner">
              <p className="text-xs font-bold uppercase tracking-widest themed-text-sub mb-1 opacity-70">Total Subtotal</p>
              <p className="text-3xl font-extrabold themed-text-main tracking-tight">${subtotal.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <button
          id="submit-order"
          type="submit"
          disabled={loading}
          className="themed-accent-btn w-full font-bold text-lg py-4 rounded-2xl transition-all shadow-[0_8px_20px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 hover:shadow-[0_12px_25px_rgba(0,0,0,0.2)] mt-6"
        >
          {loading ? 'Creating Order…' : 'Create Order'}
        </button>
      </form>
    </main>
  );
}
