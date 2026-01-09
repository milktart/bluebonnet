import type { LayoutServerLoad } from './$types';
import { validateSession } from '$lib/server/auth';

export const load: LayoutServerLoad = async ({ cookies, params, fetch }) => {
  const sessionId = cookies.get('connect.sid');
  await validateSession(sessionId, fetch);

  const tripId = params.tripId;
  const itemId = params.itemId;
  const itemTypes = ['flights', 'hotels', 'transportation', 'carRentals', 'events'];

  // Fetch the trip data
  let trip = null;
  try {
    const response = await fetch(`/api/v1/trips/${tripId}`, {
      headers: {
        'Cookie': `connect.sid=${sessionId}`
      }
    });
    if (response.ok) {
      trip = await response.json();
      // Handle wrapped response format
      if (trip && typeof trip === 'object' && 'data' in trip) {
        trip = trip.data;
      }
    }
  } catch (e) {
    // Trip not found
  }

  // Try to find which item type this ID belongs to
  let item = null;
  for (const itemType of itemTypes) {
    try {
      const response = await fetch(`/api/v1/${itemType}/${itemId}`, {
        headers: {
          'Cookie': `connect.sid=${sessionId}`
        }
      });

      if (response.ok) {
        item = await response.json();
        // Handle wrapped response format
        if (item && typeof item === 'object' && 'data' in item) {
          item = item.data;
        }
        break;
      }
    } catch (e) {
      // Continue to next item type
    }
  }

  return { trip, item };
};
