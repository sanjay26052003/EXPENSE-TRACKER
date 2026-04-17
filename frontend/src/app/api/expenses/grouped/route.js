import { proxyRequest } from '../../_lib/proxy';

export async function GET(request) {
  return proxyRequest(request, `/api/expenses/grouped${request.nextUrl.search || ''}`, {
    includeJson: false,
  });
}
