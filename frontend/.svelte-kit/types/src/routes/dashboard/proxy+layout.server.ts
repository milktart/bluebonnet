// @ts-nocheck
import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

/**
 * Dashboard Layout Load - Protect dashboard from unauthenticated access
 * This runs on the server side before the layout component renders
 */
export const load = async ({ cookies }: Parameters<LayoutServerLoad>[0]) => {
  // Check if user has a valid session cookie
  const sessionId = cookies.get('connect.sid');

  console.log('[DASHBOARD +LAYOUT.SERVER] Load function called');
  console.log('[DASHBOARD +LAYOUT.SERVER] Session ID:', sessionId ? 'EXISTS' : 'MISSING');

  if (!sessionId) {
    // No session cookie found - user is not authenticated
    // Redirect to login immediately
    console.log('[DASHBOARD +LAYOUT.SERVER] No session ID - redirecting to /login');
    throw redirect(303, '/login');
  }

  console.log('[DASHBOARD +LAYOUT.SERVER] User authenticated, allowing dashboard access');
  // Session exists, allow layout to render
  return {};
};
