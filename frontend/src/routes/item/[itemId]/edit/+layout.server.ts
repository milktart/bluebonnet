import type { LayoutServerLoad } from './$types';
import { validateSession } from '$lib/server/auth';

export const load: LayoutServerLoad = async ({ cookies, params, fetch }) => {
  const sessionId = cookies.get('connect.sid');
  await validateSession(sessionId, fetch);

  const itemId = params.itemId;
  const itemTypes = ['flights', 'hotels', 'transportation', 'carRentals', 'events'];

  // Try to find which item type this ID belongs to
  for (const itemType of itemTypes) {
    try {
      const response = await fetch(`/api/v1/${itemType}/${itemId}`, {
        headers: {
          'Cookie': `connect.sid=${sessionId}`
        }
      });

      if (response.ok) {
        let item = await response.json();
        // Handle wrapped response format
        if (item && typeof item === 'object' && 'data' in item) {
          item = item.data;
        }
        return {
          item,
          itemType: itemType.slice(0, -1) // Remove 's' from plural
        };
      }
    } catch (e) {
      // Continue to next item type
    }
  }

  // Item not found, return empty data
  return {
    item: null,
    itemType: null
  };
};
