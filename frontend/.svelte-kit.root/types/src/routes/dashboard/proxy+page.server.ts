// @ts-nocheck
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

/**
 * Page load - Protect dashboard from unauthenticated access
 * This is the primary auth check for the dashboard page
 */
export const load = async ({ cookies }: Parameters<PageServerLoad>[0]) => {
  // Check for valid session cookie
  const sessionId = cookies.get('connect.sid');

  console.log('[DASHBOARD +PAGE.SERVER] Load function called');
  console.log('[DASHBOARD +PAGE.SERVER] Session ID:', sessionId ? 'EXISTS' : 'MISSING');

  if (!sessionId) {
    // User is not authenticated - redirect to login immediately
    console.log('[DASHBOARD +PAGE.SERVER] No session ID - redirecting to /login');
    throw redirect(303, '/login');
  }

  console.log('[DASHBOARD +PAGE.SERVER] User authenticated, allowing page load');
  // User is authenticated, allow page to load
  return {};
};
