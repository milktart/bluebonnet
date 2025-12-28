import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

function getBackendUrl(): string {
  // Use Express backend at localhost:3000 in development
  return 'http://localhost:3000';
}

async function proxyToBackend(
  method: string,
  path: string,
  request?: Request
): Promise<Response> {
  const backendUrl = `${getBackendUrl()}${path}`;
  const fetchOptions: RequestInit = {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (request) {
    try {
      const body = await request.text();
      if (body) {
        fetchOptions.body = body;
      }
    } catch (err) {
      console.error('Error reading request body:', err);
    }

    // Forward relevant headers
    const cookies = request.headers.get('cookie');
    if (cookies) {
      fetchOptions.headers = {
        ...fetchOptions.headers,
        cookie: cookies,
      };
    }
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

export const GET: RequestHandler = async ({ params }) => {
  return proxyToBackend('GET', `/api/v1/flights/${params.id}`);
};

export const PUT: RequestHandler = async ({ params, request }) => {
  return proxyToBackend('PUT', `/api/v1/flights/${params.id}`, request);
};

export const DELETE: RequestHandler = async ({ params }) => {
  return proxyToBackend('DELETE', `/api/v1/flights/${params.id}`);
};
