/**
 * Dashboard Item Utilities
 *
 * Functions for extracting information about travel items, calculating
 * layovers, and generating display icons/colors.
 */

/**
 * Extract city name from location string
 * Handles formats: "CODE - City, State, Country" or "City, State, Country"
 */
export function getCityName(location: string): string {
  if (!location) return '';

  // Handle format: "CODE - City, State, Country"
  if (location.includes(' - ')) {
    const parts = location.split(' - ')[1];
    if (parts && parts.includes(',')) {
      // Extract just the city name (first part before comma)
      return parts.split(',')[0].trim();
    }
    return parts?.trim() || '';
  }

  // Handle format: "City, State, Country"
  if (location.includes(',')) {
    return location.split(',')[0].trim();
  }

  // Return as-is if no recognizable format
  return location.trim();
}

/**
 * Get icon name for transportation method
 */
export function getTransportIcon(method: string): string {
  const methodLower = (method || '').toLowerCase().trim();
  const iconMap: Record<string, string> = {
    train: 'train',
    bus: 'directions_bus',
    ferry: 'directions_boat',
    shuttle: 'local_taxi',
    taxi: 'local_taxi',
    rideshare: 'local_taxi',
    subway: 'subway',
    metro: 'subway',
    tram: 'tram',
    other: 'directions_run'
  };
  return iconMap[methodLower] || 'train';
}

/**
 * Get color for transportation method
 */
export function getTransportColor(method: string): string {
  const methodLower = (method || '').toLowerCase().trim();
  const colorMap: Record<string, string> = {
    train: 'blue',
    bus: 'amber',
    ferry: 'cyan',
    shuttle: 'purple',
    taxi: 'orange',
    rideshare: 'orange',
    subway: 'teal',
    metro: 'teal',
    tram: 'emerald',
    other: 'gray'
  };
  return colorMap[methodLower] || 'amber';
}

/**
 * Get icon for trip purpose
 */
export function getTripIcon(purpose: string): string {
  if (purpose === 'business') return 'badge';
  if (['leisure', 'family', 'romantic'].includes(purpose)) return 'hotel';
  return 'flights_and_hotels';
}

/**
 * Get comma-separated list of cities from a trip
 */
export function getTripCities(trip: any): string {
  const cities = new Set<string>();

  if (trip.flights) {
    trip.flights.forEach((f: any) => {
      if (f.origin) cities.add(getCityName(f.origin));
      if (f.destination) cities.add(getCityName(f.destination));
    });
  }

  if (trip.transportation) {
    trip.transportation.forEach((t: any) => {
      if (t.origin) cities.add(getCityName(t.origin));
      if (t.destination) cities.add(getCityName(t.destination));
    });
  }

  if (trip.carRentals) {
    trip.carRentals.forEach((c: any) => {
      if (c.pickupLocation) cities.add(getCityName(c.pickupLocation));
    });
  }

  return Array.from(cities).sort().join(', ');
}

/**
 * Check if there's a long layover (> 25 hours) without accommodation
 * Returns layover info and next item if applicable
 */
export function checkLongLayoverWithoutAccommodation(
  trip: any,
  flightId: string
): { duration: string; location: string; nextItemDate: string; nextItemType: string } | null {
  const allItems: any[] = [];

  // Collect all items from the trip and sort chronologically
  if (trip.flights) {
    trip.flights.forEach((f: any) => {
      allItems.push({ type: 'flight', ...f });
    });
  }
  if (trip.hotels) {
    trip.hotels.forEach((h: any) => {
      allItems.push({ type: 'hotel', ...h });
    });
  }
  if (trip.transportation) {
    trip.transportation.forEach((t: any) => {
      allItems.push({ type: 'transportation', ...t });
    });
  }
  if (trip.carRentals) {
    trip.carRentals.forEach((c: any) => {
      allItems.push({ type: 'carRental', ...c });
    });
  }
  if (trip.events) {
    trip.events.forEach((e: any) => {
      allItems.push({ type: 'event', ...e });
    });
  }

  // Sort items chronologically
  allItems.sort((a, b) => {
    const dateA =
      a.type === 'flight'
        ? new Date(a.departureDateTime)
        : a.type === 'hotel'
          ? new Date(a.checkInDateTime)
          : a.type === 'transportation'
            ? new Date(a.departureDateTime)
            : a.type === 'carRental'
              ? new Date(a.pickupDateTime)
              : a.type === 'event'
                ? new Date(a.startDateTime)
                : new Date(0);
    const dateB =
      b.type === 'flight'
        ? new Date(b.departureDateTime)
        : b.type === 'hotel'
          ? new Date(b.checkInDateTime)
          : b.type === 'transportation'
            ? new Date(b.departureDateTime)
            : b.type === 'carRental'
              ? new Date(b.pickupDateTime)
              : b.type === 'event'
                ? new Date(b.startDateTime)
                : new Date(0);
    return dateA.getTime() - dateB.getTime();
  });

  // Find the flight
  for (let i = 0; i < allItems.length; i++) {
    if (allItems[i].type === 'flight' && allItems[i].id === flightId) {
      const currentFlight = allItems[i];

      // Look for next flight or transportation
      let nextFlightOrTransport = null;
      let nextFlightOrTransportIndex = -1;

      for (let j = i + 1; j < allItems.length; j++) {
        if (allItems[j].type === 'flight' || allItems[j].type === 'transportation') {
          nextFlightOrTransport = allItems[j];
          nextFlightOrTransportIndex = j;
          break;
        }
      }

      if (!nextFlightOrTransport) return null;

      // Get arrival time of current flight and departure time of next flight/transport
      const arrivalTime = new Date(currentFlight.arrivalDateTime);
      const departureTime = new Date(nextFlightOrTransport.departureDateTime);

      // Calculate duration
      const durationMs = departureTime.getTime() - arrivalTime.getTime();
      const durationHours = durationMs / (1000 * 60 * 60);

      // Only show suggestion if layover is > 25 hours
      if (durationHours <= 25) {
        return null;
      }

      // Check if there's already a hotel between these items
      let hasHotel = false;
      for (let j = i + 1; j < nextFlightOrTransportIndex; j++) {
        if (allItems[j].type === 'hotel') {
          const hotelCheckIn = new Date(allItems[j].checkInDateTime);
          const hotelCheckOut = new Date(allItems[j].checkOutDateTime);

          // Check if hotel covers the layover period
          if (hotelCheckIn <= arrivalTime && hotelCheckOut >= departureTime) {
            hasHotel = true;
            break;
          }
        }
      }

      if (hasHotel) {
        return null;
      }

      // Convert to hours and minutes
      const hours = Math.floor(durationHours);
      const minutes = Math.round((durationHours - hours) * 60);

      // Format duration
      const durationStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
      const location = currentFlight.destination?.split(' - ')[0]?.trim() || '';

      return {
        duration: durationStr,
        location,
        nextItemDate:
          nextFlightOrTransport.type === 'flight'
            ? nextFlightOrTransport.departureDateTime
            : nextFlightOrTransport.departureDateTime,
        nextItemType: nextFlightOrTransport.type
      };
    }
  }

  return null;
}

/**
 * Calculate layover between two consecutive flights
 * Returns duration and location if layover exists and is <= 25 hours
 */
export function calculateLayover(flight1: any, flight2: any): { duration: string; location: string } | null {
  // Check if both are flights
  if (flight1.type !== 'flight' || flight2.type !== 'flight') {
    return null;
  }

  // Check if arrival airport matches departure airport
  const arrivalAirportCode = flight1.destination?.split(' - ')[0]?.trim();
  const departureAirportCode = flight2.origin?.split(' - ')[0]?.trim();

  if (!arrivalAirportCode || !departureAirportCode || arrivalAirportCode !== departureAirportCode) {
    return null;
  }

  // Get arrival time of first flight and departure time of second flight
  const arrivalTime = new Date(flight1.arrivalDateTime);
  const departureTime = new Date(flight2.departureDateTime);

  // Calculate difference in milliseconds
  const durationMs = departureTime.getTime() - arrivalTime.getTime();
  const durationHours = durationMs / (1000 * 60 * 60);

  // Only show layover if less than or equal to 25 hours
  if (durationHours < 0 || durationHours > 25) {
    return null;
  }

  // Convert to hours and minutes
  const hours = Math.floor(durationHours);
  const minutes = Math.round((durationHours - hours) * 60);

  // Format as "Xh Ym in AIRPORT"
  const durationStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  const location = arrivalAirportCode;

  return {
    duration: durationStr,
    location
  };
}

/**
 * Get layover information for a specific flight within a trip
 * Returns null if no layover after the flight
 */
export function getFlightLayoverInfo(trip: any, flightId: string): { duration: string; location: string } | null {
  const allItems: any[] = [];

  // Collect all items from the trip and sort chronologically
  if (trip.flights) {
    trip.flights.forEach((f: any) => {
      allItems.push({ type: 'flight', ...f });
    });
  }
  if (trip.hotels) {
    trip.hotels.forEach((h: any) => {
      allItems.push({ type: 'hotel', ...h });
    });
  }
  if (trip.transportation) {
    trip.transportation.forEach((t: any) => {
      allItems.push({ type: 'transportation', ...t });
    });
  }
  if (trip.carRentals) {
    trip.carRentals.forEach((c: any) => {
      allItems.push({ type: 'carRental', ...c });
    });
  }
  if (trip.events) {
    trip.events.forEach((e: any) => {
      allItems.push({ type: 'event', ...e });
    });
  }

  // Sort items chronologically
  allItems.sort((a, b) => {
    const dateA =
      a.type === 'flight'
        ? new Date(a.departureDateTime)
        : a.type === 'hotel'
          ? new Date(a.checkInDateTime)
          : a.type === 'transportation'
            ? new Date(a.departureDateTime)
            : a.type === 'carRental'
              ? new Date(a.pickupDateTime)
              : a.type === 'event'
                ? new Date(a.startDateTime)
                : new Date(0);
    const dateB =
      b.type === 'flight'
        ? new Date(b.departureDateTime)
        : b.type === 'hotel'
          ? new Date(b.checkInDateTime)
          : b.type === 'transportation'
            ? new Date(b.departureDateTime)
            : b.type === 'carRental'
              ? new Date(b.pickupDateTime)
              : b.type === 'event'
                ? new Date(b.startDateTime)
                : new Date(0);
    return dateA.getTime() - dateB.getTime();
  });

  // Find the flight and check the next flight
  for (let i = 0; i < allItems.length; i++) {
    if (allItems[i].type === 'flight' && allItems[i].id === flightId) {
      // Check if there's a next item that's a flight
      if (i + 1 < allItems.length && allItems[i + 1].type === 'flight') {
        return calculateLayover(allItems[i], allItems[i + 1]);
      }
      break;
    }
  }

  return null;
}

/**
 * Check if a layover spans across date boundaries
 */
export function layoverSpansDates(trip: any, flightId: string, currentDayKey: string): boolean {
  const allItems: any[] = [];

  // Collect all items from the trip and sort chronologically
  if (trip.flights) {
    trip.flights.forEach((f: any) => {
      allItems.push({ type: 'flight', ...f });
    });
  }
  if (trip.hotels) {
    trip.hotels.forEach((h: any) => {
      allItems.push({ type: 'hotel', ...h });
    });
  }
  if (trip.transportation) {
    trip.transportation.forEach((t: any) => {
      allItems.push({ type: 'transportation', ...t });
    });
  }
  if (trip.carRentals) {
    trip.carRentals.forEach((c: any) => {
      allItems.push({ type: 'carRental', ...c });
    });
  }
  if (trip.events) {
    trip.events.forEach((e: any) => {
      allItems.push({ type: 'event', ...e });
    });
  }

  // Sort items chronologically
  allItems.sort((a, b) => {
    const dateA =
      a.type === 'flight'
        ? new Date(a.departureDateTime)
        : a.type === 'hotel'
          ? new Date(a.checkInDateTime)
          : a.type === 'transportation'
            ? new Date(a.departureDateTime)
            : a.type === 'carRental'
              ? new Date(a.pickupDateTime)
              : a.type === 'event'
                ? new Date(a.startDateTime)
                : new Date(0);
    const dateB =
      b.type === 'flight'
        ? new Date(b.departureDateTime)
        : b.type === 'hotel'
          ? new Date(b.checkInDateTime)
          : b.type === 'transportation'
            ? new Date(b.departureDateTime)
            : b.type === 'carRental'
              ? new Date(b.pickupDateTime)
              : b.type === 'event'
                ? new Date(b.startDateTime)
                : new Date(0);
    return dateA.getTime() - dateB.getTime();
  });

  // Find the flight and get the layover info
  for (let i = 0; i < allItems.length; i++) {
    if (allItems[i].type === 'flight' && allItems[i].id === flightId) {
      if (i + 1 < allItems.length && allItems[i + 1].type === 'flight') {
        const currentFlight = allItems[i];
        const nextFlight = allItems[i + 1];
        const currentDate = new Date(currentFlight.arrivalDateTime);
        const nextDate = new Date(nextFlight.departureDateTime);

        // Extract date key from currentDate and nextDate
        const currentYear = currentDate.getUTCFullYear();
        const currentMonth = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
        const currentDay = String(currentDate.getUTCDate()).padStart(2, '0');
        const currentDateKey = `${currentYear}-${currentMonth}-${currentDay}`;

        const nextYear = nextDate.getUTCFullYear();
        const nextMonth = String(nextDate.getUTCMonth() + 1).padStart(2, '0');
        const nextDay = String(nextDate.getUTCDate()).padStart(2, '0');
        const nextDateKey = `${nextYear}-${nextMonth}-${nextDay}`;

        // Check if layover starts in currentDayKey and ends in a different day
        if (currentDateKey === currentDayKey && nextDateKey !== currentDayKey) {
          return true;
        }
      }
      break;
    }
  }

  return false;
}
