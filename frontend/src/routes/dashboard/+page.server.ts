import type { PageServerLoad } from './$types';
import { validateSession } from '$lib/server/auth';

/**
 * Page load - Protect dashboard from unauthenticated access
 * This is the primary auth check for the dashboard page
 */
export const load: PageServerLoad = async ({ cookies, fetch }) => {
  const sessionId = cookies.get('connect.sid');
  await validateSession(sessionId, fetch);
  return {};
};
