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
    <div className="min-h-screen themed-bg themed-text-main">
      <header
        className="themed-border-b border-b px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md"
        style={{ background: 'var(--header-bg)' }}
      >
        <div className="flex items-center gap-2 sm:gap-4">
          <Link to="/" className="themed-text-sub hover:themed-text-main transition text-sm">← Dashboard</Link>
          <h1 className="text-base sm:text-lg font-bold">Create New Order</h1>
        </div>
        <ThemeSwitcher />
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/15 border border-red-400/40 text-red-600 dark:text-red-300 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="themed-card rounded-3xl shadow-sm p-4 sm:p-6 space-y-4">
            <h2 className="font-semibold themed-section-label text-sm uppercase tracking-wider">Order Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium themed-text-sub mb-1.5">Customer Name</label>
                <input
                  id="customer-name"
                  type="text"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="themed-input w-full rounded-xl px-4 py-2.5 text-sm"
                  placeholder="Acme Corp"
                />
              </div>
              <div>
                <label className="block text-sm font-medium themed-text-sub mb-1.5">Due Date</label>
                <input
                  id="due-date"
                  type="date"
                  required
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="themed-input w-full rounded-xl px-4 py-2.5 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="themed-card rounded-3xl shadow-sm p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold themed-section-label text-sm uppercase tracking-wider">Line Items</h2>
              <button
                type="button"
                onClick={addLineItem}
                className="text-xs themed-link border themed-border rounded-lg px-3 py-1.5 transition"
              >
                + Add Item
              </button>
            </div>
            
            <div className="space-y-4">
              {lineItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start p-3 sm:p-0 themed-border border rounded-lg sm:border-0">
                  <div className="sm:col-span-5">
                    <label className="block sm:hidden text-xs font-medium themed-text-sub mb-1">Description</label>
                    <input
                      id={`item-desc-${idx}`}
                      type="text"
                      required
                      placeholder="Description"
                      value={item.description}
                      onChange={e => updateLineItem(idx, 'description', e.target.value)}
                      className="themed-input w-full rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 sm:col-span-5 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block sm:hidden text-xs font-medium themed-text-sub mb-1">Qty</label>
                      <input
                        id={`item-qty-${idx}`}
                        type="number"
                        min="1"
                        required
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={e => updateLineItem(idx, 'quantity', e.target.value)}
                        className="themed-input w-full rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block sm:hidden text-xs font-medium themed-text-sub mb-1">Price</label>
                      <input
                        id={`item-price-${idx}`}
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        placeholder="Unit Price"
                        value={item.unitPrice}
                        onChange={e => updateLineItem(idx, 'unitPrice', e.target.value)}
                        className="themed-input w-full rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 sm:mt-2 border-t themed-border sm:border-t-0">
                    <span className="text-sm themed-text-sub font-medium">
                      ${((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)).toFixed(2)}
                    </span>
                    {lineItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLineItem(idx)}
                        className="text-red-500 hover:text-red-400 transition text-xl leading-none px-2"
                        aria-label="Remove item"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end border-t themed-border pt-4 mt-2">
              <div className="text-right">
                <p className="text-xs themed-text-sub uppercase tracking-wider mb-1">Total</p>
                <p className="text-2xl font-bold themed-text-main">${subtotal.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <button
            id="submit-order"
            type="submit"
            disabled={loading}
            className="themed-accent-btn w-full font-semibold py-3.5 rounded-full transition shadow-lg mt-4"
          >
            {loading ? 'Creating Order…' : 'Create Order'}
          </button>
        </form>
      </main>
    </div>
  );
}
