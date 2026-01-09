import type { PageServerLoad } from './$types';
import { validateSession } from '$lib/server/auth';

export const load: PageServerLoad = async ({ cookies, fetch }) => {
  const sessionId = cookies.get('connect.sid');
  await validateSession(sessionId, fetch);
  return {};
};
