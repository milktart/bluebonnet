/**
 * Duplicate Detection Service
 * Detects potential duplicate items when importing account data
 * Uses >90% similarity threshold for matching
 */

import logger from '../utils/logger';

interface DuplicateResult {
  isDuplicate: boolean;
  duplicateOf?: any;
  similarity?: number;
}

interface DuplicateDisplayResult {
  type: string;
  displayName: string;
}

/**
 * Calculate string similarity using Levenshtein distance
 * Returns percentage 0-100
 */
export function calculateStringSimilarity(str1: any, str2: any): number {
  if (!str1 || !str2) return 0;

  const s1 = String(str1).toLowerCase().trim();
  const s2 = String(str2).toLowerCase().trim();

  if (s1 === s2) return 100;

  // Levenshtein distance algorithm
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 100;

  const editDistance = getEditDistance(longer, shorter);
  return ((longer.length - editDistance) / longer.length) * 100;
}

/**
 * Calculate edit distance between two strings (Levenshtein distance)
 */
function getEditDistance(s1: string, s2: string): number {
  const costs: number[] = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

/**
 * Compare two dates with tolerance (same day acceptable)
 */
export function compareDates(date1: any, date2: any, toleranceMs: number = 0): boolean {
  if (!date1 || !date2) return false;

  try {
    let iso1 = typeof date1 === 'string' ? date1 : date1.toISOString ? date1.toISOString() : String(date1);
    let iso2 = typeof date2 === 'string' ? date2 : date2.toISOString ? date2.toISOString() : String(date2);

    const datePart1 = iso1.split('T')[0];
    const datePart2 = iso2.split('T')[0];

    if (toleranceMs === 0) {
      return datePart1 === datePart2;
    }

    const d1 = new Date(date1);
    const d2 = new Date(date2);

    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;

    const diff = Math.abs(d1.getTime() - d2.getTime());
    return diff <= toleranceMs;
  } catch (error) {
    logger.debug('Error comparing dates:', { date1, date2, error: (error as Error).message });
    return false;
  }
}

/**
 * Calculate weighted similarity score for an object
 */
function calculateWeightedSimilarity(field1: any, field2: any, weight: number = 1): number {
  if (!field1 && !field2) return 100 * weight;
  if (!field1 || !field2) return 0;

  if (typeof field1 === 'string' && typeof field2 === 'string') {
    return calculateStringSimilarity(field1, field2) * weight;
  }

  return (String(field1).toLowerCase() === String(field2).toLowerCase() ? 100 : 0) * weight;
}

/**
 * Check for duplicate trips
 */
export function checkTripDuplicates(importedTrip: any, existingTrips: any[]): DuplicateResult {
  const threshold = 90;

  const normalizedImported = typeof importedTrip.get === 'function'
    ? importedTrip.get({ plain: true })
    : importedTrip;

  for (const existing of existingTrips) {
    const normalizedExisting = typeof existing.get === 'function'
      ? existing.get({ plain: true })
      : existing;

    const weights = {
      name: 0.5,
      departureDate: 0.25,
      returnDate: 0.25,
    };

    const scores = [
      calculateWeightedSimilarity(normalizedImported.name, normalizedExisting.name, weights.name),
      (compareDates(normalizedImported.departureDate, normalizedExisting.departureDate) ? 100 : 0) * weights.departureDate,
      (compareDates(normalizedImported.returnDate, normalizedExisting.returnDate) ? 100 : 0) * weights.returnDate,
    ];

    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    const similarity = scores.reduce((a, b) => a + b, 0) / totalWeight;

    if (similarity >= threshold) {
      return {
        isDuplicate: true,
        duplicateOf: existing,
        similarity: Math.round(similarity),
      };
    }
  }

  return { isDuplicate: false };
}

/**
 * Check for duplicate flights
 */
export function checkFlightDuplicates(importedFlight: any, existingFlights: any[]): DuplicateResult {
  const threshold = 90;

  const normalizedImported = typeof importedFlight.get === 'function'
    ? importedFlight.get({ plain: true })
    : importedFlight;

  for (const existing of existingFlights) {
    const normalizedExisting = typeof existing.get === 'function'
      ? existing.get({ plain: true })
      : existing;

    const weights = {
      airline: 0.2,
      flightNumber: 0.3,
      origin: 0.15,
      destination: 0.15,
      departureDateTime: 0.2,
    };

    const scores = [
      calculateWeightedSimilarity(normalizedImported.airline, normalizedExisting.airline, weights.airline),
      calculateWeightedSimilarity(normalizedImported.flightNumber, normalizedExisting.flightNumber, weights.flightNumber),
      calculateWeightedSimilarity(normalizedImported.origin, normalizedExisting.origin, weights.origin),
      calculateWeightedSimilarity(normalizedImported.destination, normalizedExisting.destination, weights.destination),
      (compareDates(normalizedImported.departureDateTime, normalizedExisting.departureDateTime) ? 100 : 0) *
        weights.departureDateTime,
    ];

    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    const similarity = scores.reduce((a, b) => a + b, 0) / totalWeight;

    if (similarity >= threshold) {
      return {
        isDuplicate: true,
        duplicateOf: existing,
        similarity: Math.round(similarity),
      };
    }
  }

  return { isDuplicate: false };
}

/**
 * Check for duplicate hotels
 */
export function checkHotelDuplicates(importedHotel: any, existingHotels: any[]): DuplicateResult {
  const threshold = 90;

  const normalizedImported = typeof importedHotel.get === 'function'
    ? importedHotel.get({ plain: true })
    : importedHotel;

  for (const existing of existingHotels) {
    const normalizedExisting = typeof existing.get === 'function'
      ? existing.get({ plain: true })
      : existing;

    const weights = {
      hotelName: 0.4,
      address: 0.2,
      checkInDateTime: 0.2,
      checkOutDateTime: 0.2,
    };

    const scores = [
      calculateWeightedSimilarity(normalizedImported.hotelName, normalizedExisting.hotelName, weights.hotelName),
      calculateWeightedSimilarity(normalizedImported.address, normalizedExisting.address, weights.address),
      (compareDates(normalizedImported.checkInDateTime, normalizedExisting.checkInDateTime) ? 100 : 0) * weights.checkInDateTime,
      (compareDates(normalizedImported.checkOutDateTime, normalizedExisting.checkOutDateTime) ? 100 : 0) *
        weights.checkOutDateTime,
    ];

    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    const similarity = scores.reduce((a, b) => a + b, 0) / totalWeight;

    if (similarity >= threshold) {
      return {
        isDuplicate: true,
        duplicateOf: existing,
        similarity: Math.round(similarity),
      };
    }
  }

  return { isDuplicate: false };
}

/**
 * Check for duplicate transportation
 */
export function checkTransportationDuplicates(importedTransportation: any, existingTransportation: any[]): DuplicateResult {
  const threshold = 90;

  const normalizedImported = typeof importedTransportation.get === 'function'
    ? importedTransportation.get({ plain: true })
    : importedTransportation;

  for (const existing of existingTransportation) {
    const normalizedExisting = typeof existing.get === 'function'
      ? existing.get({ plain: true })
      : existing;

    const weights = {
      type: 0.25,
      departureLocation: 0.25,
      arrivalLocation: 0.25,
      departureDateTime: 0.25,
    };

    const scores = [
      calculateWeightedSimilarity(normalizedImported.type, normalizedExisting.type, weights.type),
      calculateWeightedSimilarity(normalizedImported.departureLocation, normalizedExisting.departureLocation, weights.departureLocation),
      calculateWeightedSimilarity(normalizedImported.arrivalLocation, normalizedExisting.arrivalLocation, weights.arrivalLocation),
      (compareDates(normalizedImported.departureDateTime, normalizedExisting.departureDateTime) ? 100 : 0) *
        weights.departureDateTime,
    ];

    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    const similarity = scores.reduce((a, b) => a + b, 0) / totalWeight;

    if (similarity >= threshold) {
      return {
        isDuplicate: true,
        duplicateOf: existing,
        similarity: Math.round(similarity),
      };
    }
  }

  return { isDuplicate: false };
}

/**
 * Check for duplicate car rentals
 */
export function checkCarRentalDuplicates(importedCarRental: any, existingCarRentals: any[]): DuplicateResult {
  const threshold = 90;

  const normalizedImported = typeof importedCarRental.get === 'function'
    ? importedCarRental.get({ plain: true })
    : importedCarRental;

  for (const existing of existingCarRentals) {
    const normalizedExisting = typeof existing.get === 'function'
      ? existing.get({ plain: true })
      : existing;

    const weights = {
      pickupLocation: 0.25,
      dropoffLocation: 0.25,
      pickupDateTime: 0.25,
      dropoffDateTime: 0.25,
    };

    const scores = [
      calculateWeightedSimilarity(normalizedImported.pickupLocation, normalizedExisting.pickupLocation, weights.pickupLocation),
      calculateWeightedSimilarity(normalizedImported.dropoffLocation, normalizedExisting.dropoffLocation, weights.dropoffLocation),
      (compareDates(normalizedImported.pickupDateTime, normalizedExisting.pickupDateTime) ? 100 : 0) * weights.pickupDateTime,
      (compareDates(normalizedImported.dropoffDateTime, normalizedExisting.dropoffDateTime) ? 100 : 0) *
        weights.dropoffDateTime,
    ];

    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    const similarity = scores.reduce((a, b) => a + b, 0) / totalWeight;

    if (similarity >= threshold) {
      return {
        isDuplicate: true,
        duplicateOf: existing,
        similarity: Math.round(similarity),
      };
    }
  }

  return { isDuplicate: false };
}

/**
 * Check for duplicate events
 */
export function checkEventDuplicates(importedEvent: any, existingEvents: any[]): DuplicateResult {
  const threshold = 90;

  for (const existing of existingEvents) {
    const normalizedImported = typeof importedEvent.get === 'function'
      ? importedEvent.get({ plain: true })
      : importedEvent;
    const normalizedExisting = typeof existing.get === 'function'
      ? existing.get({ plain: true })
      : existing;

    const weights = {
      name: 0.45,
      location: 0.35,
      startDateTime: 0.2,
    };

    const timezone = normalizedExisting.timezone || 'UTC';
    const startDateScore =
      (compareDatesByTimezone(normalizedImported.startDateTime, normalizedExisting.startDateTime, timezone) ? 100 : 0) *
      weights.startDateTime;

    const nameScore = calculateWeightedSimilarity(normalizedImported.name, normalizedExisting.name, weights.name);
    const locationScore = calculateWeightedSimilarity(normalizedImported.location, normalizedExisting.location, weights.location);

    const scores = [nameScore, locationScore, startDateScore];

    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    const similarity = scores.reduce((a, b) => a + b, 0) / totalWeight;

    const startDateComparisonResult = compareDatesByTimezone(normalizedImported.startDateTime, normalizedExisting.startDateTime, timezone);
    logger.debug('Event duplicate detection:', {
      importedName: normalizedImported.name,
      existingName: normalizedExisting.name,
      importedLocation: normalizedImported.location,
      existingLocation: normalizedExisting.location,
      importedStartDateTime: normalizedImported.startDateTime,
      existingStartDateTime: normalizedExisting.startDateTime,
      importedTimezone: normalizedImported.timezone,
      existingTimezone: normalizedExisting.timezone,
      comparisonTimezone: timezone,
      weights,
      nameScore: Math.round(nameScore * 100) / 100,
      locationScore: Math.round(locationScore * 100) / 100,
      startDateScore: Math.round(startDateScore * 100) / 100,
      startDateComparisonResult,
      totalWeight,
      similarity: Math.round(similarity),
      threshold,
      isDuplicate: similarity >= threshold,
    });

    if (similarity >= threshold) {
      return {
        isDuplicate: true,
        duplicateOf: existing,
        similarity: Math.round(similarity),
      };
    }
  }

  return { isDuplicate: false };
}

/**
 * Compare two dates using a specific timezone
 */
function compareDatesByTimezone(date1: any, date2: any, timezone: string): boolean {
  if (!date1 || !date2) return false;

  try {
    const d1 = new Date(date1);
    const d2 = new Date(date2);

    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      logger.debug('Invalid date in compareDatesByTimezone:', {
        date1,
        date2,
        d1: d1.toISOString ? d1.toISOString() : d1,
        d2: d2.toISOString ? d2.toISOString() : d2,
      });
      return false;
    }

    const formatter = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: timezone,
    } as any);

    const date1Local = formatter.format(d1);
    const date2Local = formatter.format(d2);

    logger.debug('compareDatesByTimezone details:', {
      date1Input: date1,
      date2Input: date2,
      timezone,
      d1Timestamp: d1.getTime(),
      d2Timestamp: d2.getTime(),
      date1Local,
      date2Local,
      match: date1Local === date2Local,
    });

    return date1Local === date2Local;
  } catch (error) {
    logger.debug('Error comparing dates by timezone:', {
      date1,
      date2,
      timezone,
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    return compareDates(date1, date2);
  }
}

/**
 * Check for duplicate vouchers
 */
export function checkVoucherDuplicates(importedVoucher: any, existingVouchers: any[]): DuplicateResult {
  const threshold = 90;

  const normalizedImported = typeof importedVoucher.get === 'function'
    ? importedVoucher.get({ plain: true })
    : importedVoucher;

  for (const existing of existingVouchers) {
    const normalizedExisting = typeof existing.get === 'function'
      ? existing.get({ plain: true })
      : existing;

    const weights = {
      voucherNumber: 0.5,
      type: 0.2,
      issuer: 0.15,
      expirationDate: 0.15,
    };

    const scores = [
      calculateWeightedSimilarity(normalizedImported.voucherNumber, normalizedExisting.voucherNumber, weights.voucherNumber),
      calculateWeightedSimilarity(normalizedImported.type, normalizedExisting.type, weights.type),
      calculateWeightedSimilarity(normalizedImported.issuer, normalizedExisting.issuer, weights.issuer),
      (compareDates(normalizedImported.expirationDate, normalizedExisting.expirationDate) ? 100 : 0) *
        weights.expirationDate,
    ];

    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    const similarity = scores.reduce((a, b) => a + b, 0) / totalWeight;

    if (similarity >= threshold) {
      return {
        isDuplicate: true,
        duplicateOf: existing,
        similarity: Math.round(similarity),
      };
    }
  }

  return { isDuplicate: false };
}

/**
 * Check for duplicate companions
 */
export function checkCompanionDuplicates(importedCompanion: any, existingCompanions: any[]): DuplicateResult {
  const threshold = 90;

  const normalizedImported = typeof importedCompanion.get === 'function'
    ? importedCompanion.get({ plain: true })
    : importedCompanion;

  for (const existing of existingCompanions) {
    const normalizedExisting = typeof existing.get === 'function'
      ? existing.get({ plain: true })
      : existing;

    const weights = {
      name: 0.6,
      email: 0.4,
    };

    const scores = [
      calculateWeightedSimilarity(normalizedImported.name, normalizedExisting.name, weights.name),
      calculateWeightedSimilarity(normalizedImported.email, normalizedExisting.email, weights.email),
    ];

    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    const similarity = scores.reduce((a, b) => a + b, 0) / totalWeight;

    if (similarity >= threshold) {
      return {
        isDuplicate: true,
        duplicateOf: existing,
        similarity: Math.round(similarity),
      };
    }
  }

  return { isDuplicate: false };
}

/**
 * Get display name for a duplicate item
 */
export function getDuplicateDisplayName(item: any, type: string): string {
  switch (type) {
    case 'trip':
      return item.name || 'Untitled Trip';
    case 'flight':
      return `${item.airline} ${item.flightNumber}` || 'Flight';
    case 'hotel':
      return item.name || 'Hotel';
    case 'transportation':
      return `${item.type} - ${item.departureLocation} to ${item.arrivalLocation}` || 'Transportation';
    case 'carRental':
      return `${item.pickupLocation} to ${item.dropoffLocation}` || 'Car Rental';
    case 'event':
      return item.name || 'Event';
    case 'voucher':
      return item.voucherNumber || 'Voucher';
    case 'companion':
      return item.name || 'Companion';
    default:
      return 'Item';
  }
}

export default {
  calculateStringSimilarity,
  compareDates,
  checkTripDuplicates,
  checkFlightDuplicates,
  checkHotelDuplicates,
  checkTransportationDuplicates,
  checkCarRentalDuplicates,
  checkEventDuplicates,
  checkVoucherDuplicates,
  checkCompanionDuplicates,
  getDuplicateDisplayName,
};
