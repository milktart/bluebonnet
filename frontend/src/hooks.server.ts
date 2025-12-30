import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

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
      // In Docker, frontend container can reach backend app container via internal service name
      // The docker-compose defines the service as 'app', listening on port 3001
      let apiBase = 'http://app:3001';


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

      console.error('[HOOKS.SERVER] Error verifying session with backend:', error instanceof Error ? error.message : String(error));
      if (error instanceof Error) {
        console.error('[HOOKS.SERVER] Error details:', error.stack);
      }
      // If we can't verify the session due to network error, still allow the request
      // The page-level load function will catch any actual auth errors
    }
  }

  return resolve(event);
};
