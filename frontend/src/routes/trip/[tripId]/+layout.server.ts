import type { LayoutServerLoad } from './$types';
import { validateSession } from '$lib/server/auth';

export const load: LayoutServerLoad = async ({ cookies, params, fetch }) => {

  const sessionId = cookies.get('connect.sid');
  await validateSession(sessionId, fetch);

  const tripId = params.tripId;

  // Fetch the trip data
  try {
    const apiUrl = `/api/v1/trips/${tripId}`;

    const response = await fetch(apiUrl, {
      headers: {
        'Cookie': `connect.sid=${sessionId}`
      }
    });


    if (response.ok) {
      let trip = await response.json();

      // Handle wrapped response format (success/data structure)
      if (trip && typeof trip === 'object' && 'data' in trip) {
        trip = trip.data;
      }

      return { trip };
    } else {
    }
  } catch (e) {
    // Trip not found, return empty
  }

  return { trip: null };
};
