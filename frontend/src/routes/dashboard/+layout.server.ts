import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

/**
 * Dashboard Layout Load - Protect dashboard from unauthenticated access
 * This runs on the server side before the layout component renders
 */
export const load: LayoutServerLoad = async ({ cookies }) => {
  // Check if user has a valid session cookie
  const sessionId = cookies.get('connect.sid');


  if (!sessionId) {
    // No session cookie found - user is not authenticated
    // Redirect to login immediately
    throw redirect(303, '/login');
  }

  // Session exists, allow layout to render
  return {};
};
