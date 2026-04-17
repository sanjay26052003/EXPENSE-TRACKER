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
  if (typeof window === 'undefined') return;
  if (token) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

async function fetchAPI(endpoint, options = {}) {
  const token = options.token ?? getStoredToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // Use relative URL — Next.js API routes proxy to backend
  const url = `/api${endpoint}`;
  const res = await fetch(url, { headers, ...options });

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
  register: (data) => fetchAPI('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => fetchAPI('/auth/me'),
  logout: () => fetchAPI('/auth/logout', { method: 'POST' }),

  getExpenses: (month) => fetchAPI(`/expenses${month ? `?month=${month}` : ''}`),
  getGroupedExpenses: (month) => fetchAPI(`/expenses/grouped${month ? `?month=${month}` : ''}`),
  getSummary: (month) => fetchAPI(`/expenses/summary${month ? `?month=${month}` : ''}`),
  createExpense: (data) => fetchAPI('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  updateExpense: (id, data) => fetchAPI(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExpense: (id) => fetchAPI(`/expenses/${id}`, { method: 'DELETE' }),
  askAI: (question) => fetchAPI('/ai/query', { method: 'POST', body: JSON.stringify({ question }) }),
};

export default api;
