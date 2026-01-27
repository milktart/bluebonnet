import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

/**
 * Logout endpoint
 * Calls backend logout API to clear the server-side session
 * Then redirects to login page
 */
export const GET: RequestHandler = async ({ request, cookies }) => {
  try {
    // Since SvelteKit is now integrated with Express on same port,
    // use relative URL for logout (works in all environments)
    const logoutUrl = '/auth/logout';

    await fetch(logoutUrl, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Cookie': request.headers.get('cookie') || '',
      },
    });
  } catch (error) {
    // Continue with redirect even if API call fails
  }

  // Clear the client-side session cookie
  cookies.delete('connect.sid', { path: '/' });

  // Redirect to login page
  throw redirect(303, '/login');
};
