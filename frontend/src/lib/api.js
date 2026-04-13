const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
const TOKEN_STORAGE_KEY = 'expense-tracker-token';

export class APIError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'APIError';
    this.status = status;
  }
}

export function getStoredToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token) {
  if (typeof window === 'undefined') {
    return;
  }

  if (token) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = options.token ?? getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    headers,
    ...options,
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new APIError(data?.error || 'Request failed', res.status);
  }

  return data;
}

export const api = {
  register: (data) => fetchAPI('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => fetchAPI('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => fetchAPI('/api/auth/me'),
  logout: () => fetchAPI('/api/auth/logout', { method: 'POST' }),

  getExpenses: (month) => fetchAPI(`/api/expenses${month ? `?month=${month}` : ''}`),
  getGroupedExpenses: (month) => fetchAPI(`/api/expenses/grouped${month ? `?month=${month}` : ''}`),
  getSummary: (month) => fetchAPI(`/api/expenses/summary${month ? `?month=${month}` : ''}`),
  createExpense: (data) => fetchAPI('/api/expenses', { method: 'POST', body: JSON.stringify(data) }),
  updateExpense: (id, data) => fetchAPI(`/api/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExpense: (id) => fetchAPI(`/api/expenses/${id}`, { method: 'DELETE' }),
  askAI: (question) => fetchAPI('/api/ai/query', { method: 'POST', body: JSON.stringify({ question }) }),
};

export default api;
