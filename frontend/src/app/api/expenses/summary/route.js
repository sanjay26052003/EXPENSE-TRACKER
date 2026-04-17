import { proxyRequest } from '../../_lib/proxy';

export async function GET(request) {
  return proxyRequest(request, `/api/expenses/summary${request.nextUrl.search || ''}`, {
    includeJson: false,
  });
}
