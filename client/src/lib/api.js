const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

export const api = {
  // Expenses
  getExpenses: (month) => fetchAPI(`/api/expenses${month ? `?month=${month}` : ''}`),
  getGroupedExpenses: (month) => fetchAPI(`/api/expenses/grouped${month ? `?month=${month}` : ''}`),
  getSummary: (month) => fetchAPI(`/api/expenses/summary${month ? `?month=${month}` : ''}`),
  createExpense: (data) => fetchAPI('/api/expenses', { method: 'POST', body: JSON.stringify(data) }),
  updateExpense: (id, data) => fetchAPI(`/api/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExpense: (id) => fetchAPI(`/api/expenses/${id}`, { method: 'DELETE' }),

  // AI
  askAI: (question) => fetchAPI('/api/ai/query', { method: 'POST', body: JSON.stringify({ question }) }),
};

export default api;
