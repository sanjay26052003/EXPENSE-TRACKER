import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://expense-tracker-server.onrender.com';

function getAuthorization(request) {
  const header = request.headers.get('authorization');
  return header ? { Authorization: header } : {};
}

export async function proxyRequest(request, endpoint, options = {}) {
  try {
    const init = {
      method: options.method || request.method,
      headers: {
        ...getAuthorization(request),
        ...(options.includeJson !== false ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {}),
      },
      cache: 'no-store',
    };

    if (options.body !== undefined) {
      init.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    } else if (request.method !== 'GET' && request.method !== 'HEAD') {
      init.body = await request.text();
      if (!init.body) {
        delete init.body;
      }
    }

    const response = await fetch(`${API_BASE}${endpoint}`, init);
    const text = await response.text();

    return new NextResponse(text, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Backend unreachable' }, { status: 503 });
  }
}
