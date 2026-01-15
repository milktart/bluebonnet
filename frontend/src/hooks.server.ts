import type { Handle, HandleFetch } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

/**
 * Handle fetch - Intercept server-side fetch calls and proxy to backend
 * This allows server-side load functions to use relative URLs like /api/v1/flights/:id
 * Those URLs are converted to http://localhost:3000/api/v1/flights/:id
 */
export const handleFetch: HandleFetch = async ({ request, fetch, event }) => {
  const url = new URL(request.url);

  // If the request is for /api or /auth routes, proxy to backend
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/auth')) {
    // Construct backend URL
    const backendUrl = `http://localhost:3000${url.pathname}${url.search}`;

    // Get all cookies from the incoming request
    const cookies = event.request.headers.get('cookie') || '';

    // Create new request with backend URL, preserving headers and adding cookies
    const backendRequest = new Request(backendUrl, {
      method: request.method,
      headers: {
        ...Object.fromEntries(request.headers.entries()),
        'cookie': cookies,
      },
      body: request.body,
    });

    return fetch(backendRequest);
  }

  return fetch(request);
};

export const handle: Handle = async ({ event, resolve }) => {
  // For dashboard route, ensure authentication
  if (event.url.pathname.startsWith('/dashboard')) {
    // Check for session cookie first
    const sessionId = event.cookies.get('connect.sid');
    const allCookies = event.request.headers.get('cookie') || '';

    if (!sessionId) {
      // No session cookie found - user is definitely not authenticated
      throw redirect(303, '/login');
    }

    // Session cookie exists, but we need to verify it's still valid on the backend
    // (could be expired or invalidated)
    try {
      // Determine backend URL
      // In dev mode, Express backend runs on port 3000 (same container/process)
      // In production, this would be configured differently
      let apiBase = 'http://localhost:3000';

      // Call backend to verify session is valid
      const verifyResponse = await fetch(`${apiBase}/auth/verify-session`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cookie': allCookies,
        },
      });

      if (!verifyResponse.ok) {
        // Backend says session is invalid (expired, revoked, etc.)
        throw redirect(303, '/login');
      }
    } catch (error) {
      // Check if this is a SvelteKit redirect exception (which has a location property)
      if (error && typeof error === 'object' && 'location' in error) {
        // This is our own redirect exception, re-throw it
        throw error;
      }

      // If we can't verify the session due to network error, still allow the request
      // The page-level load function will catch any actual auth errors
    }
  }

  return resolve(event);
};
