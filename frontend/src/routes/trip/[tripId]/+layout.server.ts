import type { LayoutServerLoad } from './$types';
import { validateSession } from '$lib/server/auth';

export const load: LayoutServerLoad = async ({ cookies, params, fetch }) => {
  console.log('[Trip Layout Server Load] Called with tripId:', params.tripId);

  const sessionId = cookies.get('connect.sid');
  await validateSession(sessionId, fetch);

  const tripId = params.tripId;

  // Fetch the trip data
  try {
    const apiUrl = `/api/v1/trips/${tripId}`;
    console.log('[Trip Layout Server Load] Fetching from:', apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        'Cookie': `connect.sid=${sessionId}`
      }
    });

    console.log('[Trip Layout Server Load] Response status:', response.status);

    if (response.ok) {
      let trip = await response.json();
      console.log('[Trip Layout Server Load] Raw response:', JSON.stringify(trip).substring(0, 200));

      // Handle wrapped response format (success/data structure)
      if (trip && typeof trip === 'object' && 'data' in trip) {
        trip = trip.data;
        console.log('[Trip Layout Server Load] Unwrapped response:', JSON.stringify(trip).substring(0, 200));
      }

      console.log('[Trip Layout Server Load] Trip loaded:', trip?.id, trip?.name);
      return { trip };
    } else {
      console.log('[Trip Layout Server Load] Response not ok:', response.statusText);
    }
  } catch (e) {
    // Trip not found, return empty
    console.log('[Trip Layout Server Load] Error:', e);
  }

  console.log('[Trip Layout Server Load] Returning empty trip');
  return { trip: null };
};
