const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://expense-tracker-server.onrender.com';

export async function POST(request) {
  try {
    const body = await request.json();
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { success: false, error: text || `HTTP ${response.status}` };
    }

    return Response.json(data, { status: response.status });
  } catch (error) {
    return Response.json({ success: false, error: 'Backend unreachable' }, { status: 503 });
  }
}