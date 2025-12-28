import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

/**
 * Logout endpoint
 * Calls backend logout API to clear the server-side session
 * Then redirects to login page
 */
export const GET: RequestHandler = async ({ request, cookies }) => {
  try {
    // Get the host from the request to determine backend URL
    const host = request.headers.get('host');
    let apiBase = 'http://localhost:3000'; // Default for local dev

    if (host && !host.startsWith('localhost')) {
      // In Docker or remote environment, use port 3501
      const protocol = request.url.startsWith('https') ? 'https:' : 'http:';
      const hostname = host.split(':')[0];
      apiBase = `${protocol}//${hostname}:3501`;
    }

    // Call backend logout endpoint to destroy session
    // This will clear the server-side session and invalidate the cookie
    await fetch(`${apiBase}/auth/logout`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Cookie': request.headers.get('cookie') || '',
      },
    });
  } catch (error) {
    console.error('Logout error:', error);
    // Continue with redirect even if API call fails
  }

  // Clear the client-side session cookie
  cookies.delete('connect.sid', { path: '/' });

  // Redirect to login page
  throw redirect(303, '/login');
};
