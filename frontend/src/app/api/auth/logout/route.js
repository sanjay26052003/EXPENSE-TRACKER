import { proxyRequest } from '../../_lib/proxy';

export async function POST(request) {
  return proxyRequest(request, '/api/auth/logout');
}
