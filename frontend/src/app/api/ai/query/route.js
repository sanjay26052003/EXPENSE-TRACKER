import { NextResponse } from 'next';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://expense-tracker-server.onrender.com';

export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    const body = await request.json();
    const response = await fetch(`${API_BASE}/api/ai/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ success: false, error: 'Backend unreachable' }, { status: 503 });
  }
}