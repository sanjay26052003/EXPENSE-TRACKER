import { proxyRequest } from '../../_lib/proxy';

export async function GET(request) {
  return proxyRequest(request, '/api/auth/me');
}
