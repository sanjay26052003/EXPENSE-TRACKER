const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://expense-tracker-server.onrender.com';

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    const query = request.nextUrl.search || '';
    const response = await fetch(`${API_BASE}/api/expenses${query}`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { success: false, error: text }; }
    return Response.json(data, { status: response.status });
  } catch {
    return Response.json({ success: false, error: 'Backend unreachable' }, { status: 503 });
  }
}

export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    const body = await request.json();
    const response = await fetch(`${API_BASE}/api/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { success: false, error: text }; }
    return Response.json(data, { status: response.status });
  } catch {
    return Response.json({ success: false, error: 'Backend unreachable' }, { status: 503 });
  }
}