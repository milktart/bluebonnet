/**
 * Import Preview Processor
 * Handles JSON parsing, data validation, and duplicate detection for account data import
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');
const duplicateDetectionService = require('../services/duplicateDetectionService');

/**
 * Process an import file and generate preview data with duplicate detection
 *
 * @param {Object} importData - Parsed JSON data from export file
 * @param {Object} currentUserData - Current user's existing data
 * @returns {Object} Preview data with grouped items and duplicate flags
 */
function generatePreviewData(importData, currentUserData) {
  const preview = {
    items: [],
    sections: {},
    stats: {
      totalItems: 0,
      totalDuplicates: 0,
      totalStandalone: 0,
    },
  };

  // Initialize section counters
  const sections = [
    'trips',
    'standaloneFlights',
    'standaloneHotels',
    'standaloneTransportation',
    'standaloneCarRentals',
    'standaloneEvents',
    'vouchers',
    'companions',
  ];

  sections.forEach((section) => {
    preview.sections[section] = { count: 0, duplicates: 0 };
  });

  // Process trips and their children
  if (importData.trips && Array.isArray(importData.trips)) {
    importData.trips.forEach((trip) => {
      const tripDuplicate = duplicateDetectionService.checkTripDuplicates(
        trip,
        currentUserData.trips || []
      );

      const tripPreviewId = uuidv4();
      const tripItem = {
        id: tripPreviewId,
        originalId: trip.id,
        category: 'trips',
        type: 'trip',
        name: trip.name || 'Untitled Trip',
        summary: formatTripSummary(trip),
        isDuplicate: tripDuplicate.isDuplicate,
        duplicateOf: tripDuplicate.duplicateOf
          ? {
              name: tripDuplicate.duplicateOf.name,
            }
          : null,
        duplicateSimilarity: tripDuplicate.similarity || 0,
        selected: !tripDuplicate.isDuplicate,
        data: trip,
      };

      preview.items.push(tripItem);
      preview.sections.trips.count++;
      if (tripDuplicate.isDuplicate) preview.sections.trips.duplicates++;
      preview.stats.totalItems++;
      if (tripDuplicate.isDuplicate) preview.stats.totalDuplicates++;

      // Process trip's children
      const tripChildren = {
        flights: [],
        hotels: [],
        transportation: [],
        carRentals: [],
        events: [],
      };

      // Flights
      if (trip.flights && Array.isArray(trip.flights)) {
        trip.flights.forEach((flight) => {
          const flightDuplicate = duplicateDetectionService.checkFlightDuplicates(
            flight,
            currentUserData.allFlights || []
          );

          const flightPreviewId = uuidv4();
          const flightItem = {
            id: flightPreviewId,
            originalId: flight.id,
            parentTripId: tripPreviewId,
            category: 'flights',
            type: 'flight',
            name: `${flight.airline} ${flight.flightNumber}`,
            summary: formatFlightSummary(flight),
            isDuplicate: flightDuplicate.isDuplicate,
            duplicateOf: flightDuplicate.duplicateOf
              ? {
                  name: `${flightDuplicate.duplicateOf.airline} ${flightDuplicate.duplicateOf.flightNumber}`,
                  origin: flightDuplicate.duplicateOf.origin,
                  destination: flightDuplicate.duplicateOf.destination,
                }
              : null,
            duplicateSimilarity: flightDuplicate.similarity || 0,
            selected: !flightDuplicate.isDuplicate,
            data: flight,
          };

          preview.items.push(flightItem);
          tripChildren.flights.push(flightPreviewId);
          preview.stats.totalItems++;
          if (flightDuplicate.isDuplicate) preview.stats.totalDuplicates++;
        });
      }

      // Hotels
      if (trip.hotels && Array.isArray(trip.hotels)) {
        trip.hotels.forEach((hotel) => {
          const hotelDuplicate = duplicateDetectionService.checkHotelDuplicates(
            hotel,
            currentUserData.allHotels || []
          );

          const hotelPreviewId = uuidv4();
          const hotelItem = {
            id: hotelPreviewId,
            originalId: hotel.id,
            parentTripId: tripPreviewId,
            category: 'hotels',
            type: 'hotel',
            name: hotel.hotelName || 'Hotel',
            summary: formatHotelSummary(hotel),
            isDuplicate: hotelDuplicate.isDuplicate,
            duplicateOf: hotelDuplicate.duplicateOf
              ? {
                  name: hotelDuplicate.duplicateOf.hotelName,
                }
              : null,
            duplicateSimilarity: hotelDuplicate.similarity || 0,
            selected: !hotelDuplicate.isDuplicate,
            data: hotel,
          };

          preview.items.push(hotelItem);
          tripChildren.hotels.push(hotelPreviewId);
          preview.stats.totalItems++;
          if (hotelDuplicate.isDuplicate) preview.stats.totalDuplicates++;
        });
      }

      // Transportation
      if (trip.transportation && Array.isArray(trip.transportation)) {
        trip.transportation.forEach((trans) => {
          const transDuplicate = duplicateDetectionService.checkTransportationDuplicates(
            trans,
            currentUserData.allTransportation || []
          );

          const transPreviewId = uuidv4();
          const transItem = {
            id: transPreviewId,
            originalId: trans.id,
            parentTripId: tripPreviewId,
            category: 'transportation',
            type: 'transportation',
            name: trans.type || 'Transportation',
            summary: formatTransportationSummary(trans),
            isDuplicate: transDuplicate.isDuplicate,
            duplicateOf: transDuplicate.duplicateOf
              ? {
                  name: `${transDuplicate.duplicateOf.type}`,
                  departureLocation: transDuplicate.duplicateOf.departureLocation,
                  arrivalLocation: transDuplicate.duplicateOf.arrivalLocation,
                }
              : null,
            duplicateSimilarity: transDuplicate.similarity || 0,
            selected: !transDuplicate.isDuplicate,
            data: trans,
          };

          preview.items.push(transItem);
          tripChildren.transportation.push(transPreviewId);
          preview.stats.totalItems++;
          if (transDuplicate.isDuplicate) preview.stats.totalDuplicates++;
        });
      }

      // Car Rentals
      if (trip.carRentals && Array.isArray(trip.carRentals)) {
        trip.carRentals.forEach((carRental) => {
          const carRentalDuplicate = duplicateDetectionService.checkCarRentalDuplicates(
            carRental,
            currentUserData.allCarRentals || []
          );

          const carRentalPreviewId = uuidv4();
          const carRentalItem = {
            id: carRentalPreviewId,
            originalId: carRental.id,
            parentTripId: tripPreviewId,
            category: 'carRentals',
            type: 'carRental',
            name: `${carRental.pickupLocation} to ${carRental.dropoffLocation}`,
            summary: formatCarRentalSummary(carRental),
            isDuplicate: carRentalDuplicate.isDuplicate,
            duplicateOf: carRentalDuplicate.duplicateOf
              ? {
                  name: `${carRentalDuplicate.duplicateOf.pickupLocation} to ${carRentalDuplicate.duplicateOf.dropoffLocation}`,
                }
              : null,
            duplicateSimilarity: carRentalDuplicate.similarity || 0,
            selected: !carRentalDuplicate.isDuplicate,
            data: carRental,
          };

          preview.items.push(carRentalItem);
          tripChildren.carRentals.push(carRentalPreviewId);
          preview.stats.totalItems++;
          if (carRentalDuplicate.isDuplicate) preview.stats.totalDuplicates++;
        });
      }

      // Events
      if (trip.events && Array.isArray(trip.events)) {
        trip.events.forEach((event) => {
          const eventDuplicate = duplicateDetectionService.checkEventDuplicates(
            event,
            currentUserData.allEvents || []
          );

          const eventPreviewId = uuidv4();
          const eventItem = {
            id: eventPreviewId,
            originalId: event.id,
            parentTripId: tripPreviewId,
            category: 'events',
            type: 'event',
            name: event.name || 'Event',
            summary: formatEventSummary(event),
            isDuplicate: eventDuplicate.isDuplicate,
            duplicateOf: eventDuplicate.duplicateOf
              ? {
                  name: eventDuplicate.duplicateOf.name,
                  location: eventDuplicate.duplicateOf.location,
                }
              : null,
            duplicateSimilarity: eventDuplicate.similarity || 0,
            selected: !eventDuplicate.isDuplicate,
            data: event,
          };

          preview.items.push(eventItem);
          tripChildren.events.push(eventPreviewId);
          preview.stats.totalItems++;
          if (eventDuplicate.isDuplicate) preview.stats.totalDuplicates++;
        });
      }

      // Attach children refs to trip item
      tripItem.children = tripChildren;
    });
  }

  // Process standalone flights
  if (importData.standaloneFlights && Array.isArray(importData.standaloneFlights)) {
    importData.standaloneFlights.forEach((flight) => {
      const flightDuplicate = duplicateDetectionService.checkFlightDuplicates(
        flight,
        currentUserData.allFlights || []
      );

      const flightItem = {
        id: uuidv4(),
        originalId: flight.id,
        category: 'standaloneFlights',
        type: 'flight',
        name: `${flight.airline} ${flight.flightNumber}`,
        summary: formatFlightSummary(flight),
        isDuplicate: flightDuplicate.isDuplicate,
        duplicateOf: flightDuplicate.duplicateOf
          ? {
              name: `${flightDuplicate.duplicateOf.airline} ${flightDuplicate.duplicateOf.flightNumber}`,
              origin: flightDuplicate.duplicateOf.origin,
              destination: flightDuplicate.duplicateOf.destination,
            }
          : null,
        duplicateSimilarity: flightDuplicate.similarity || 0,
        selected: !flightDuplicate.isDuplicate,
        data: flight,
      };

      preview.items.push(flightItem);
      preview.sections.standaloneFlights.count++;
      if (flightDuplicate.isDuplicate) preview.sections.standaloneFlights.duplicates++;
      preview.stats.totalItems++;
      if (flightDuplicate.isDuplicate) preview.stats.totalDuplicates++;
      preview.stats.totalStandalone++;
    });
  }

  // Process standalone hotels
  if (importData.standaloneHotels && Array.isArray(importData.standaloneHotels)) {
    importData.standaloneHotels.forEach((hotel) => {
      const hotelDuplicate = duplicateDetectionService.checkHotelDuplicates(
        hotel,
        currentUserData.allHotels || []
      );

      const hotelItem = {
        id: uuidv4(),
        originalId: hotel.id,
        category: 'standaloneHotels',
        type: 'hotel',
        name: hotel.hotelName || 'Hotel',
        summary: formatHotelSummary(hotel),
        isDuplicate: hotelDuplicate.isDuplicate,
        duplicateOf: hotelDuplicate.duplicateOf
          ? {
              name: hotelDuplicate.duplicateOf.hotelName,
            }
          : null,
        duplicateSimilarity: hotelDuplicate.similarity || 0,
        selected: !hotelDuplicate.isDuplicate,
        data: hotel,
      };

      preview.items.push(hotelItem);
      preview.sections.standaloneHotels.count++;
      if (hotelDuplicate.isDuplicate) preview.sections.standaloneHotels.duplicates++;
      preview.stats.totalItems++;
      if (hotelDuplicate.isDuplicate) preview.stats.totalDuplicates++;
      preview.stats.totalStandalone++;
    });
  }

  // Process standalone transportation
  if (importData.standaloneTransportation && Array.isArray(importData.standaloneTransportation)) {
    importData.standaloneTransportation.forEach((trans) => {
      const transDuplicate = duplicateDetectionService.checkTransportationDuplicates(
        trans,
        currentUserData.allTransportation || []
      );

      const transItem = {
        id: uuidv4(),
        originalId: trans.id,
        category: 'standaloneTransportation',
        type: 'transportation',
        name: trans.type || 'Transportation',
        summary: formatTransportationSummary(trans),
        isDuplicate: transDuplicate.isDuplicate,
        duplicateOf: transDuplicate.duplicateOf
          ? {
              name: `${transDuplicate.duplicateOf.type}`,
              departureLocation: transDuplicate.duplicateOf.departureLocation,
              arrivalLocation: transDuplicate.duplicateOf.arrivalLocation,
            }
          : null,
        duplicateSimilarity: transDuplicate.similarity || 0,
        selected: !transDuplicate.isDuplicate,
        data: trans,
      };

      preview.items.push(transItem);
      preview.sections.standaloneTransportation.count++;
      if (transDuplicate.isDuplicate) preview.sections.standaloneTransportation.duplicates++;
      preview.stats.totalItems++;
      if (transDuplicate.isDuplicate) preview.stats.totalDuplicates++;
      preview.stats.totalStandalone++;
    });
  }

  // Process standalone car rentals
  if (importData.standaloneCarRentals && Array.isArray(importData.standaloneCarRentals)) {
    importData.standaloneCarRentals.forEach((carRental) => {
      const carRentalDuplicate = duplicateDetectionService.checkCarRentalDuplicates(
        carRental,
        currentUserData.allCarRentals || []
      );

      const carRentalItem = {
        id: uuidv4(),
        originalId: carRental.id,
        category: 'standaloneCarRentals',
        type: 'carRental',
        name: `${carRental.pickupLocation} to ${carRental.dropoffLocation}`,
        summary: formatCarRentalSummary(carRental),
        isDuplicate: carRentalDuplicate.isDuplicate,
        duplicateOf: carRentalDuplicate.duplicateOf
          ? {
              name: `${carRentalDuplicate.duplicateOf.pickupLocation} to ${carRentalDuplicate.duplicateOf.dropoffLocation}`,
            }
          : null,
        duplicateSimilarity: carRentalDuplicate.similarity || 0,
        selected: !carRentalDuplicate.isDuplicate,
        data: carRental,
      };

      preview.items.push(carRentalItem);
      preview.sections.standaloneCarRentals.count++;
      if (carRentalDuplicate.isDuplicate) preview.sections.standaloneCarRentals.duplicates++;
      preview.stats.totalItems++;
      if (carRentalDuplicate.isDuplicate) preview.stats.totalDuplicates++;
      preview.stats.totalStandalone++;
    });
  }

  // Process standalone events
  if (importData.standaloneEvents && Array.isArray(importData.standaloneEvents)) {
    importData.standaloneEvents.forEach((event) => {
      const eventDuplicate = duplicateDetectionService.checkEventDuplicates(
        event,
        currentUserData.allEvents || []
      );

      const eventItem = {
        id: uuidv4(),
        originalId: event.id,
        category: 'standaloneEvents',
        type: 'event',
        name: event.name || 'Event',
        summary: formatEventSummary(event),
        isDuplicate: eventDuplicate.isDuplicate,
        duplicateOf: eventDuplicate.duplicateOf
          ? {
              name: eventDuplicate.duplicateOf.name,
              location: eventDuplicate.duplicateOf.location,
            }
          : null,
        duplicateSimilarity: eventDuplicate.similarity || 0,
        selected: !eventDuplicate.isDuplicate,
        data: event,
      };

      preview.items.push(eventItem);
      preview.sections.standaloneEvents.count++;
      if (eventDuplicate.isDuplicate) preview.sections.standaloneEvents.duplicates++;
      preview.stats.totalItems++;
      if (eventDuplicate.isDuplicate) preview.stats.totalDuplicates++;
      preview.stats.totalStandalone++;
    });
  }

  // Process vouchers
  if (importData.vouchers && Array.isArray(importData.vouchers)) {
    importData.vouchers.forEach((voucher) => {
      const voucherDuplicate = duplicateDetectionService.checkVoucherDuplicates(
        voucher,
        currentUserData.vouchers || []
      );

      const voucherItem = {
        id: uuidv4(),
        originalId: voucher.id,
        category: 'vouchers',
        type: 'voucher',
        name: voucher.voucherNumber || 'Voucher',
        summary: formatVoucherSummary(voucher),
        isDuplicate: voucherDuplicate.isDuplicate,
        duplicateOf: voucherDuplicate.duplicateOf
          ? {
              name: voucherDuplicate.duplicateOf.voucherNumber,
              type: voucherDuplicate.duplicateOf.type,
            }
          : null,
        duplicateSimilarity: voucherDuplicate.similarity || 0,
        selected: !voucherDuplicate.isDuplicate,
        data: voucher,
      };

      preview.items.push(voucherItem);
      preview.sections.vouchers.count++;
      if (voucherDuplicate.isDuplicate) preview.sections.vouchers.duplicates++;
      preview.stats.totalItems++;
      if (voucherDuplicate.isDuplicate) preview.stats.totalDuplicates++;
    });
  }

  // Process companions
  if (importData.companions && Array.isArray(importData.companions)) {
    importData.companions.forEach((companion) => {
      const companionDuplicate = duplicateDetectionService.checkCompanionDuplicates(
        companion,
        currentUserData.companions || []
      );

      const companionItem = {
        id: uuidv4(),
        originalId: companion.id,
        category: 'companions',
        type: 'companion',
        name: companion.name || 'Companion',
        summary: formatCompanionSummary(companion),
        isDuplicate: companionDuplicate.isDuplicate,
        duplicateOf: companionDuplicate.duplicateOf
          ? {
              name: companionDuplicate.duplicateOf.name,
              email: companionDuplicate.duplicateOf.email,
            }
          : null,
        duplicateSimilarity: companionDuplicate.similarity || 0,
        selected: !companionDuplicate.isDuplicate,
        data: companion,
      };

      preview.items.push(companionItem);
      preview.sections.companions.count++;
      if (companionDuplicate.isDuplicate) preview.sections.companions.duplicates++;
      preview.stats.totalItems++;
      if (companionDuplicate.isDuplicate) preview.stats.totalDuplicates++;
    });
  }

  return preview;
}

// Formatting functions for summaries
function formatTripSummary(trip) {
  let departureDate = 'No date';
  let returnDate = 'No date';

  // Try to parse departure date
  if (trip.departureDate) {
    try {
      const date = new Date(trip.departureDate);
      if (!isNaN(date.getTime())) {
        departureDate = date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
    } catch {
      // Keep as 'No date'
    }
  }

  // Try to parse return date
  if (trip.returnDate) {
    try {
      const date = new Date(trip.returnDate);
      if (!isNaN(date.getTime())) {
        returnDate = date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
    } catch {
      // Keep as 'No date'
    }
  }

  return `${departureDate} to ${returnDate}`;
}

function formatFlightSummary(flight) {
  const departure = flight.origin || 'Unknown';
  const arrival = flight.destination || 'Unknown';
  const dateTime = formatDate(flight.departureDateTime);
  return `${departure} → ${arrival} • ${dateTime}`;
}

function formatHotelSummary(hotel) {
  const hotelName = hotel.hotelName || 'Hotel';
  const checkIn = formatDate(hotel.checkInDateTime);
  const checkOut = formatDate(hotel.checkOutDateTime);
  return `${hotelName} • ${checkIn} to ${checkOut}`;
}

function formatTransportationSummary(trans) {
  const departure = trans.departureLocation || 'Unknown';
  const arrival = trans.arrivalLocation || 'Unknown';
  const dateTime = formatDate(trans.departureDateTime);
  return `${departure} → ${arrival} • ${dateTime}`;
}

function formatCarRentalSummary(carRental) {
  const pickup = carRental.pickupLocation || 'Unknown';
  const dropoff = carRental.dropoffLocation || 'Unknown';
  const pickupDate = formatDate(carRental.pickupDateTime);
  return `${pickup} to ${dropoff} • ${pickupDate}`;
}

function formatEventSummary(event) {
  const location = event.location || 'Unknown location';
  const startDate = formatDate(event.startDateTime);
  return `${location} • ${startDate}`;
}

function formatVoucherSummary(voucher) {
  const type = voucher.type || 'Voucher';
  const value = voucher.totalValue ? `$${voucher.totalValue}` : 'Amount not specified';
  return `${type} • ${value}`;
}

function formatCompanionSummary(companion) {
  return companion.email || 'No email provided';
}

function formatDate(dateString) {
  if (!dateString) return 'No date';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'Invalid date';
  }
}

module.exports = {
  generatePreviewData,
};
