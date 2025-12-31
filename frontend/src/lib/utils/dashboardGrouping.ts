/**
 * Dashboard Grouping and Filtering Utilities
 *
 * Functions for grouping travel items by date, filtering by time period,
 * and organizing data for dashboard display.
 */

/**
 * Parse a local date string (YYYY-MM-DD) into a Date object
 */
export function parseLocalDate(dateString: string): Date {
  if (!dateString) return new Date(0);
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Get trip end date (return date or departure date)
 */
export function getTripEndDate(trip: any): Date {
  if (trip.returnDate) {
    return parseLocalDate(trip.returnDate);
  }
  return trip.departureDate ? parseLocalDate(trip.departureDate) : new Date(0);
}

/**
 * Get the start date for an item based on its type
 */
export function getItemDate(item: any, itemType: string): Date {
  if (itemType === 'flight') return new Date(item.departureDateTime);
  if (itemType === 'hotel') return new Date(item.checkInDateTime);
  if (itemType === 'transportation') return new Date(item.departureDateTime);
  if (itemType === 'carRental') return new Date(item.pickupDateTime);
  if (itemType === 'event') return new Date(item.startDateTime);
  return new Date(0);
}

/**
 * Extract month key (YYYY-MM) from an item, respecting its timezone
 */
export function getDateKeyForItem(item: any): string {
  let date: Date;
  let timezone: string | null = null;

  if (item.type === 'trip') {
    date = parseLocalDate(item.data.departureDate);
  } else {
    date = item.sortDate;
    // Extract timezone from item based on type
    if (item.itemType === 'flight') {
      timezone = item.data.originTimezone;
    } else if (item.itemType === 'hotel') {
      timezone = item.data.timezone;
    } else if (item.itemType === 'transportation') {
      timezone = item.data.originTimezone;
    } else if (item.itemType === 'carRental') {
      timezone = item.data.pickupTimezone;
    } else if (item.itemType === 'event') {
      timezone = item.data.timezone;
    }
  }

  // Format date in item's timezone if available, otherwise UTC
  if (timezone) {
    try {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: '2-digit',
        timeZone: timezone
      });
      const parts = formatter.formatToParts(date);
      const values: Record<string, string> = {};
      parts.forEach((part) => {
        if (part.type !== 'literal') {
          values[part.type] = part.value;
        }
      });
      return `${values.year}-${values.month}`;
    } catch {
      // Fallback to UTC if timezone invalid
    }
  }

  // Fallback: use UTC date
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Extract day key (YYYY-MM-DD) from an item
 */
export function getDayKeyForItem(item: any): string {
  let date: Date;
  let timezone: string | null = null;

  // For trip items, extract timezone from the item data
  if (item.type === 'flight') {
    date = new Date(item.departureDateTime);
    timezone = item.originTimezone;
  } else if (item.type === 'hotel') {
    date = new Date(item.checkInDateTime);
    timezone = item.timezone;
  } else if (item.type === 'transportation') {
    date = new Date(item.departureDateTime);
    timezone = item.originTimezone;
  } else if (item.type === 'carRental') {
    date = new Date(item.pickupDateTime);
    timezone = item.pickupTimezone;
  } else if (item.type === 'event') {
    date = new Date(item.startDateTime);
    timezone = item.timezone;
  } else {
    return '';
  }

  // Format date in item's timezone if available, otherwise UTC
  if (timezone) {
    try {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: timezone
      });
      const parts = formatter.formatToParts(date);
      const values: Record<string, string> = {};
      parts.forEach((part) => {
        if (part.type !== 'literal') {
          values[part.type] = part.value;
        }
      });
      return `${values.year}-${values.month}-${values.day}`;
    } catch {
      // Fallback to UTC if timezone invalid
    }
  }

  // Fallback: use UTC date
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Group trip items by date (YYYY-MM-DD)
 */
export function groupTripItemsByDate(trip: any): Record<string, Array<any>> {
  const grouped: Record<string, Array<any>> = {};
  const dateOrder: string[] = [];

  const allItems: any[] = [];

  // Collect all items from the trip
  if (trip.flights) {
    trip.flights.forEach((f: any) => {
      const item = { type: 'flight', ...f };
      allItems.push(item);
    });
  }
  if (trip.hotels) {
    trip.hotels.forEach((h: any) => {
      const item = { type: 'hotel', ...h };
      allItems.push(item);
    });
  }
  if (trip.transportation) {
    trip.transportation.forEach((t: any) => {
      const item = { type: 'transportation', ...t };
      allItems.push(item);
    });
  }
  if (trip.carRentals) {
    trip.carRentals.forEach((c: any) => {
      const item = { type: 'carRental', ...c };
      allItems.push(item);
    });
  }
  if (trip.events) {
    trip.events.forEach((e: any) => {
      const item = { type: 'event', ...e };
      allItems.push(item);
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

  // Group by date
  allItems.forEach((item) => {
    const dateKey = getDayKeyForItem(item);
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
      dateOrder.push(dateKey);
    }
    grouped[dateKey].push(item);
  });

  return grouped;
}
