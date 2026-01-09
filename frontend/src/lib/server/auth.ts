import { redirect } from '@sveltejs/kit';

/**
 * Validates a user's session by checking with the backend's verify-session endpoint
 * Throws a redirect to /login if the session is invalid or expired
 *
 * In SvelteKit server loads, the fetch function automatically includes cookies,
 * so we don't need to manually pass them.
 */
export async function validateSession(
  sessionId: string | undefined,
  fetch: typeof globalThis.fetch
): Promise<void> {
  // No session cookie present
  if (!sessionId) {
    console.log('[validateSession] No session cookie found, redirecting to login');
    throw redirect(303, '/login');
  }

  // Verify session is actually valid by checking with backend
  // The fetch in server loads automatically includes cookies
  try {
    console.log('[validateSession] Verifying session with backend');
    const verifyResponse = await fetch('/auth/verify-session');

    console.log('[validateSession] Verify response status:', verifyResponse.status);

    // If response is not ok (401, 500, etc), session is invalid
    if (!verifyResponse.ok) {
      console.log('[validateSession] Session verification failed with status:', verifyResponse.status);
      throw redirect(303, '/login');
    }

    console.log('[validateSession] Session is valid');
  } catch (e) {
    // If it's a SvelteKit redirect, re-throw it
    if (e instanceof Error && 'location' in e) {
      throw e;
    }
    // If fetch itself fails (network error), redirect to login as a fallback
    console.error('[validateSession] Error verifying session:', e);
    throw redirect(303, '/login');
  }
}
