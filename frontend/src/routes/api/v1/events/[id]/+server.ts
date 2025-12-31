import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

function getBackendUrl(): string {
  return "" // Use relative URL (same-origin since SvelteKit is integrated);
}

async function proxyToBackend(method: string, path: string, request?: Request): Promise<Response> {
  const backendUrl = `${getBackendUrl()}${path}`;
  const fetchOptions: RequestInit = { method, credentials: 'include', headers: { 'Content-Type': 'application/json' } };
  if (request) {
    try {
      const body = await request.text();
      if (body) fetchOptions.body = body;
    } catch (err) {
      console.error('Error reading request body:', err);
    }
    const cookies = request.headers.get('cookie');
    if (cookies) fetchOptions.headers = { ...fetchOptions.headers, cookie: cookies };
  }
  const response = await fetch(backendUrl, fetchOptions);
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    const data = await response.json();
    return json(data, { status: response.status });
  } else {
    const text = await response.text();
    return new Response(text, { status: response.status });
  }
}

export const GET: RequestHandler = async ({ params }) => proxyToBackend('GET', `/api/v1/events/${params.id}`);
export const PUT: RequestHandler = async ({ params, request }) => proxyToBackend('PUT', `/api/v1/events/${params.id}`, request);
export const DELETE: RequestHandler = async ({ params }) => proxyToBackend('DELETE', `/api/v1/events/${params.id}`);
