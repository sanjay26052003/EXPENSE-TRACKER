import { NextResponse } from 'next';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://expense-tracker-server.onrender.com';

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    const query = request.nextUrl.search || '';
    const response = await fetch(`${API_BASE}/api/expenses/summary${query}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ success: false, error: 'Backend unreachable' }, { status: 503 });
  }
}