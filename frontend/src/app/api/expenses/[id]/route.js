import { proxyRequest } from '../../_lib/proxy';

export async function GET(request, { params }) {
  return proxyRequest(request, `/api/expenses/${params.id}`, { includeJson: false });
}

export async function PUT(request, { params }) {
  return proxyRequest(request, `/api/expenses/${params.id}`);
}

export async function DELETE(request, { params }) {
  return proxyRequest(request, `/api/expenses/${params.id}`, { includeJson: false });
}
