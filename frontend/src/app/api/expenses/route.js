import { proxyRequest } from '../_lib/proxy';

export async function GET(request) {
  return proxyRequest(request, `/api/expenses${request.nextUrl.search || ''}`, {
    includeJson: false,
  });
}

export async function POST(request) {
  return proxyRequest(request, '/api/expenses');
}
