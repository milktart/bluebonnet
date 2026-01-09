import type { LayoutServerLoad } from './$types';
import { validateSession } from '$lib/server/auth';

/**
 * Dashboard Layout Load - Protect dashboard from unauthenticated access
 * This runs on the server side before the layout component renders
 */
export const load: LayoutServerLoad = async ({ cookies, fetch }) => {
  const sessionId = cookies.get('connect.sid');
  await validateSession(sessionId, fetch);
  return {};
};
