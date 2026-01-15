import type { LayoutServerLoad } from './$types';
import { validateSession } from '$lib/server/auth';

export const load: LayoutServerLoad = async ({ cookies, params, fetch }) => {
  console.log('[item layout] Starting load for itemId:', params.itemId);
  const sessionId = cookies.get('connect.sid');

  console.log('[item layout] Validating session...');
  await validateSession(sessionId, fetch);
  console.log('[item layout] Session validated');

  const itemId = params.itemId;
  const itemTypes = [
    { type: 'flights', endpoint: 'flights' },
    { type: 'hotels', endpoint: 'hotels' },
    { type: 'transportation', endpoint: 'transportation' },
    { type: 'carRentals', endpoint: 'car-rentals' },
    { type: 'events', endpoint: 'events' }
  ];

  // Try to find which item type this ID belongs to
  for (const { type, endpoint } of itemTypes) {
    try {
      console.log('[item layout] Fetching', endpoint, 'with ID:', itemId);
      const response = await fetch(`/api/v1/${endpoint}/${itemId}`);

      console.log('[item layout] Response status for', endpoint, ':', response.status);

      if (response.ok) {
        let item = await response.json();
        // Handle wrapped response format
        if (item && typeof item === 'object' && 'data' in item) {
          item = item.data;
        }
        console.log('[item layout] Found item of type:', type);
        return {
          item,
          itemType: type.slice(0, -1) // Remove 's' from plural
        };
      }
    } catch (e) {
      console.log('[item layout] Error fetching', endpoint, ':', e.message);
      // Continue to next item type
    }
  }

  // Item not found, return empty data
  console.log('[item layout] Item not found, returning empty data');
  return {
    item: null,
    itemType: null
  };
};
