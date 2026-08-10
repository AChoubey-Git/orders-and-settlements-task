const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function getToken(): string | null {
  return localStorage.getItem('access_token');
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || 'Request failed');
  }
  return res.json();
}

async function requestText(
  path: string,
  options: RequestInit = {},
): Promise<string> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const error = await res.text().catch(() => res.statusText);
    throw new Error(error || 'Request failed');
  }
  return res.text();
}

export const api = {
  auth: {
    register: (email: string, password: string) =>
      request<{ access_token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    login: (email: string, password: string) =>
      request<{ access_token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
  },
  orders: {
    list: (status?: string) =>
      request<Order[]>(`/orders${status ? `?status=${status}` : ''}`),
    get: (id: string) => request<Order>(`/orders/${id}`),
    create: (data: CreateOrderPayload) =>
      request<Order>('/orders', { method: 'POST', body: JSON.stringify(data) }),
    exportCsv: (startDate?: string, endDate?: string, status?: string) => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (status) params.append('status', status);
      const query = params.toString();
      return requestText(`/orders/export${query ? `?${query}` : ''}`);
    },
  },
  payments: {
    list: (orderId: string) =>
      request<Payment[]>(`/orders/${orderId}/payments`),
    create: (orderId: string, data: CreatePaymentPayload) =>
      request<{ payment: Payment; order: Order }>(
        `/orders/${orderId}/payments`,
        { method: 'POST', body: JSON.stringify(data) },
      ),
  },
};

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  _id: string;
  customerName: string;
  dueDate: string;
  lineItems: LineItem[];
  subtotal: number;
  total: number;
  amountPaid: number;
  status: 'pending' | 'partially_paid' | 'paid' | 'overdue';
  statusHistory: { status: string; timestamp: string }[];
  createdAt: string;
}

export interface Payment {
  _id: string;
  orderId: string;
  amount: number;
  date: string;
  note?: string;
  type: 'payment' | 'refund';
  createdAt: string;
}

export interface CreateOrderPayload {
  customerName: string;
  dueDate: string;
  lineItems: LineItem[];
}

export interface CreatePaymentPayload {
  amount: number;
  date: string;
  note?: string;
  type?: 'payment' | 'refund';
}
