import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

/**
 * Page load - Protect dashboard from unauthenticated access
 * This is the primary auth check for the dashboard page
 */
export const load: PageServerLoad = async ({ cookies }) => {
  // Check for valid session cookie
  const sessionId = cookies.get('connect.sid');


  if (!sessionId) {
    // User is not authenticated - redirect to login immediately
    throw redirect(303, '/login');
  }

  // User is authenticated, allow page to load
  return {};
};
