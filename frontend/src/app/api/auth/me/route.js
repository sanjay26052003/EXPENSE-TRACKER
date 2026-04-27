const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://expense-tracker-server.onrender.com';

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    const response = await fetch(`${API_BASE}/api/auth/me`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!response) {
      return Response.json({ success: false, error: 'Backend unreachable' }, { status: 503 });
    }
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { success: false, error: text || `HTTP ${response.status}` }; }
    return Response.json(data, { status: response.status });
  } catch {
    return Response.json({ success: false, error: 'Backend unreachable' }, { status: 503 });
  }
}