import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  // For dashboard route, ensure authentication
  if (event.url.pathname.startsWith('/dashboard')) {
    // Check for session cookie first
    const sessionId = event.cookies.get('connect.sid');
    const allCookies = event.request.headers.get('cookie') || '';

    console.log('[HOOKS.SERVER] Dashboard access attempt');
    console.log('[HOOKS.SERVER] Session ID from cookies.get():', sessionId ? 'EXISTS' : 'MISSING');
    console.log('[HOOKS.SERVER] All cookies from header:', allCookies);
    console.log('[HOOKS.SERVER] Pathname:', event.url.pathname);

    if (!sessionId) {
      // No session cookie found - user is definitely not authenticated
      console.log('[HOOKS.SERVER] No session ID found - redirecting to /login');
      throw redirect(303, '/login');
    }

    // Session cookie exists, but we need to verify it's still valid on the backend
    // (could be expired or invalidated)
    try {
      console.log('[HOOKS.SERVER] Session ID found - verifying with backend');

      // Determine backend URL
      // In Docker, frontend container can reach backend app container via internal service name
      // The docker-compose defines the service as 'app', listening on port 3001
      let apiBase = 'http://app:3001';

      console.log('[HOOKS.SERVER] Using backend URL:', apiBase);

      // Call backend to verify session is valid
      const verifyResponse = await fetch(`${apiBase}/auth/verify-session`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cookie': allCookies,
        },
      });

      console.log('[HOOKS.SERVER] Backend verification response:', verifyResponse.status);

      if (!verifyResponse.ok) {
        // Backend says session is invalid (expired, revoked, etc.)
        console.log('[HOOKS.SERVER] Backend returned', verifyResponse.status, '- session is invalid, redirecting to /login');
        throw redirect(303, '/login');
      }

      console.log('[HOOKS.SERVER] Backend verified session is valid - allowing access');
    } catch (error) {
      // Check if this is a SvelteKit redirect exception (which has a location property)
      if (error && typeof error === 'object' && 'location' in error) {
        // This is our own redirect exception, re-throw it
        console.log('[HOOKS.SERVER] Rethrowing redirect exception');
        throw error;
      }

      console.error('[HOOKS.SERVER] Error verifying session with backend:', error instanceof Error ? error.message : String(error));
      if (error instanceof Error) {
        console.error('[HOOKS.SERVER] Error details:', error.stack);
      }
      // If we can't verify the session due to network error, still allow the request
      // The page-level load function will catch any actual auth errors
      console.log('[HOOKS.SERVER] Could not verify with backend, allowing request to proceed');
    }
  }

  return resolve(event);
};
