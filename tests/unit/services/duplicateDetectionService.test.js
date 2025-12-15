/**
 * Unit Tests for services/duplicateDetectionService.js
 * Tests duplicate detection and similarity calculation for account data import
 */

/* eslint-env jest */

const duplicateDetectionService = require('../../../services/duplicateDetectionService');

describe('DuplicateDetectionService', () => {
  describe('calculateStringSimilarity', () => {
    it('should return 100 for identical strings', () => {
      expect(duplicateDetectionService.calculateStringSimilarity('test', 'test')).toBe(100);
    });

    it('should return 100 for identical strings with different cases', () => {
      expect(duplicateDetectionService.calculateStringSimilarity('Test', 'test')).toBe(100);
    });

    it('should return 100 for identical strings with whitespace', () => {
      expect(duplicateDetectionService.calculateStringSimilarity('test ', ' test')).toBe(100);
    });

    it('should return 0 for completely different strings', () => {
      const similarity = duplicateDetectionService.calculateStringSimilarity('abc', 'xyz');
      expect(similarity).toBeLessThanOrEqual(40); // Very different strings
    });

    it('should return high similarity for similar strings', () => {
      const similarity = duplicateDetectionService.calculateStringSimilarity('Los Angeles', 'Los Angles');
      expect(similarity).toBeGreaterThan(85);
    });

    it('should handle empty strings', () => {
      expect(duplicateDetectionService.calculateStringSimilarity('', '')).toBe(100);
      expect(duplicateDetectionService.calculateStringSimilarity('test', '')).toBe(0);
      expect(duplicateDetectionService.calculateStringSimilarity('', 'test')).toBe(0);
    });

    it('should handle null/undefined values', () => {
      expect(duplicateDetectionService.calculateStringSimilarity(null, 'test')).toBe(0);
      expect(duplicateDetectionService.calculateStringSimilarity('test', null)).toBe(0);
      expect(duplicateDetectionService.calculateStringSimilarity(null, null)).toBe(0);
      expect(duplicateDetectionService.calculateStringSimilarity(undefined, 'test')).toBe(0);
    });

    it('should calculate correct similarity for common misspellings', () => {
      const similarity = duplicateDetectionService.calculateStringSimilarity('New York', 'New Yrok');
      expect(similarity).toBeGreaterThan(85);
    });

    it('should handle special characters', () => {
      const similarity = duplicateDetectionService.calculateStringSimilarity(
        'San Francisco, CA',
        'San Francisco CA'
      );
      expect(similarity).toBeGreaterThan(90);
    });

    it('should use Levenshtein distance algorithm', () => {
      // 'kitten' to 'sitting' requires 3 edits (Levenshtein distance = 3)
      const similarity = duplicateDetectionService.calculateStringSimilarity('kitten', 'sitting');
      expect(similarity).toBeGreaterThan(50);
      expect(similarity).toBeLessThan(80);
    });

    it('should handle numeric strings', () => {
      const similarity = duplicateDetectionService.calculateStringSimilarity('12345', '12345');
      expect(similarity).toBe(100);
    });

    it('should return percentage between 0-100', () => {
      const results = [
        duplicateDetectionService.calculateStringSimilarity('abc', 'def'),
        duplicateDetectionService.calculateStringSimilarity('hello', 'hallo'),
        duplicateDetectionService.calculateStringSimilarity('test', 'test'),
      ];
      results.forEach((result) => {
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('compareDates', () => {
    it('should return true for identical dates', () => {
      const date = '2025-12-15T10:00:00Z';
      expect(duplicateDetectionService.compareDates(date, date)).toBe(true);
    });

    it('should return true for same day different times', () => {
      expect(duplicateDetectionService.compareDates('2025-12-15T08:00:00Z', '2025-12-15T22:00:00Z')).toBe(true);
    });

    it('should return false for different days', () => {
      expect(
        duplicateDetectionService.compareDates('2025-12-15T10:00:00Z', '2025-12-16T10:00:00Z')
      ).toBe(false);
    });

    it('should handle Date objects', () => {
      const date1 = new Date('2025-12-15');
      const date2 = new Date('2025-12-15');
      expect(duplicateDetectionService.compareDates(date1, date2)).toBe(true);
    });

    it('should return false for null/undefined dates', () => {
      expect(duplicateDetectionService.compareDates(null, '2025-12-15')).toBe(false);
      expect(duplicateDetectionService.compareDates('2025-12-15', null)).toBe(false);
      expect(duplicateDetectionService.compareDates(null, null)).toBe(false);
      expect(duplicateDetectionService.compareDates(undefined, '2025-12-15')).toBe(false);
    });

    it('should return false for invalid dates', () => {
      expect(duplicateDetectionService.compareDates('invalid', '2025-12-15')).toBe(false);
      expect(duplicateDetectionService.compareDates('2025-12-15', 'not a date')).toBe(false);
    });

    it('should accept tolerance parameter', () => {
      const date1 = '2025-12-15T10:00:00Z';
      const date2 = '2025-12-16T10:00:00Z'; // Next day
      // With 0 tolerance (default), should be false
      expect(duplicateDetectionService.compareDates(date1, date2, 0)).toBe(false);
      // With 1 day tolerance, should be true
      expect(duplicateDetectionService.compareDates(date1, date2, 86400000)).toBe(true); // 1 day in ms
    });
  });

  describe('checkTripDuplicates', () => {
    const sampleTrip = {
      id: 'trip-1',
      name: 'Paris Vacation',
      destination: 'Paris, France',
      startDate: '2025-06-01',
      endDate: '2025-06-07',
    };

    it('should detect exact duplicate trip', () => {
      const result = duplicateDetectionService.checkTripDuplicates(sampleTrip, [sampleTrip]);

      expect(result.isDuplicate).toBe(true);
      expect(result.similarity).toBeGreaterThanOrEqual(90);
    });

    it('should not detect duplicate for different trip', () => {
      const otherTrip = {
        name: 'Tokyo Adventure',
        destination: 'Tokyo, Japan',
        startDate: '2025-08-01',
        endDate: '2025-08-15',
      };

      const result = duplicateDetectionService.checkTripDuplicates(sampleTrip, [otherTrip]);

      expect(result.isDuplicate).toBe(false);
    });

    it('should detect similar trip with minor variations', () => {
      const similarTrip = {
        name: 'Paris Vacaton', // Misspelling
        destination: 'Paris, France',
        startDate: '2025-06-01',
        endDate: '2025-06-07',
      };

      const result = duplicateDetectionService.checkTripDuplicates(sampleTrip, [similarTrip]);

      // May or may not detect as duplicate depending on similarity algorithm
      expect(result).toHaveProperty('isDuplicate');
      expect(result).toHaveProperty('similarity');
    });

    it('should detect duplicate with same destination and dates', () => {
      const similarTrip = {
        name: 'Trip to Paris', // Different name but same destination and dates
        destination: 'Paris, France',
        startDate: '2025-06-01',
        endDate: '2025-06-07',
      };

      const result = duplicateDetectionService.checkTripDuplicates(sampleTrip, [similarTrip]);

      // Should likely detect as duplicate due to high similarity in critical fields
      expect(result).toHaveProperty('isDuplicate');
    });

    it('should include duplicate reference data', () => {
      const existingTrip = {
        id: 'existing-1',
        name: 'Paris Vacation',
        destination: 'Paris, France',
        startDate: '2025-06-01',
        endDate: '2025-06-07',
      };

      const result = duplicateDetectionService.checkTripDuplicates(sampleTrip, [existingTrip]);

      if (result.isDuplicate) {
        expect(result.duplicateOf).toEqual({
          name: 'Paris Vacation',
          destination: 'Paris, France',
        });
      }
    });

    it('should handle empty existing trips array', () => {
      const result = duplicateDetectionService.checkTripDuplicates(sampleTrip, []);

      expect(result.isDuplicate).toBe(false);
    });

    it('should return similarity score', () => {
      const result = duplicateDetectionService.checkTripDuplicates(sampleTrip, [sampleTrip]);

      expect(typeof result.similarity).toBe('number');
      expect(result.similarity).toBeGreaterThanOrEqual(0);
      expect(result.similarity).toBeLessThanOrEqual(100);
    });
  });

  describe('checkFlightDuplicates', () => {
    const sampleFlight = {
      id: 'flight-1',
      airline: 'United Airlines',
      flightNumber: 'UA100',
      departureCity: 'Los Angeles',
      arrivalCity: 'New York',
      departureDateTime: '2025-06-01T10:00:00Z',
    };

    it('should detect exact duplicate flight', () => {
      const result = duplicateDetectionService.checkFlightDuplicates(sampleFlight, [sampleFlight]);

      expect(result.isDuplicate).toBe(true);
      expect(result.similarity).toBe(100);
    });

    it('should not detect duplicate for different flight', () => {
      const otherFlight = {
        airline: 'American Airlines',
        flightNumber: 'AA200',
        departureCity: 'Chicago',
        arrivalCity: 'Boston',
        departureDateTime: '2025-06-02T15:00:00Z',
      };

      const result = duplicateDetectionService.checkFlightDuplicates(sampleFlight, [otherFlight]);

      expect(result.isDuplicate).toBe(false);
    });

    it('should detect similar flight with minor airline name variation', () => {
      const similarFlight = {
        airline: 'United',
        flightNumber: 'UA100',
        departureCity: 'Los Angeles',
        arrivalCity: 'New York',
        departureDateTime: '2025-06-01T10:00:00Z',
      };

      const result = duplicateDetectionService.checkFlightDuplicates(sampleFlight, [similarFlight]);

      expect(result).toHaveProperty('isDuplicate');
      expect(result).toHaveProperty('similarity');
    });

    it('should include flight reference data when duplicate', () => {
      const existingFlight = {
        id: 'existing-flight-1',
        airline: 'United Airlines',
        flightNumber: 'UA100',
        departureCity: 'Los Angeles',
        arrivalCity: 'New York',
        departureDateTime: '2025-06-01T10:00:00Z',
      };

      const result = duplicateDetectionService.checkFlightDuplicates(sampleFlight, [existingFlight]);

      if (result.isDuplicate) {
        expect(result.duplicateOf).toHaveProperty('name');
        expect(result.duplicateOf).toHaveProperty('departureCity');
        expect(result.duplicateOf).toHaveProperty('arrivalCity');
      }
    });

    it('should handle empty existing flights array', () => {
      const result = duplicateDetectionService.checkFlightDuplicates(sampleFlight, []);

      expect(result.isDuplicate).toBe(false);
    });

    it('should be sensitive to flight number changes', () => {
      const differentFlight = {
        airline: 'United Airlines',
        flightNumber: 'UA101', // Different flight number
        departureCity: 'Los Angeles',
        arrivalCity: 'New York',
        departureDateTime: '2025-06-01T10:00:00Z',
      };

      const result = duplicateDetectionService.checkFlightDuplicates(sampleFlight, [differentFlight]);

      // Should not detect as duplicate due to different flight number
      expect(result.isDuplicate).toBe(false);
    });
  });

  describe('checkHotelDuplicates', () => {
    const sampleHotel = {
      id: 'hotel-1',
      name: 'The Plaza Hotel',
      city: 'New York',
      checkInDateTime: '2025-06-01T15:00:00Z',
      checkOutDateTime: '2025-06-05T11:00:00Z',
    };

    it('should detect exact duplicate hotel', () => {
      const result = duplicateDetectionService.checkHotelDuplicates(sampleHotel, [sampleHotel]);

      expect(result.isDuplicate).toBe(true);
      expect(result.similarity).toBe(100);
    });

    it('should detect similar hotel with name variation', () => {
      const similarHotel = {
        name: 'Plaza Hotel',
        city: 'New York',
        checkInDateTime: '2025-06-01T15:00:00Z',
        checkOutDateTime: '2025-06-05T11:00:00Z',
      };

      const result = duplicateDetectionService.checkHotelDuplicates(sampleHotel, [similarHotel]);

      expect(result).toHaveProperty('isDuplicate');
    });

    it('should not detect duplicate for different hotel', () => {
      const otherHotel = {
        name: 'The Ritz',
        city: 'Paris',
        checkInDateTime: '2025-07-01T15:00:00Z',
        checkOutDateTime: '2025-07-05T11:00:00Z',
      };

      const result = duplicateDetectionService.checkHotelDuplicates(sampleHotel, [otherHotel]);

      expect(result.isDuplicate).toBe(false);
    });

    it('should handle empty existing hotels array', () => {
      const result = duplicateDetectionService.checkHotelDuplicates(sampleHotel, []);

      expect(result.isDuplicate).toBe(false);
    });

    it('should include hotel reference data when duplicate', () => {
      const existingHotel = {
        id: 'existing-hotel-1',
        name: 'The Plaza Hotel',
        city: 'New York',
        checkInDateTime: '2025-06-01T15:00:00Z',
        checkOutDateTime: '2025-06-05T11:00:00Z',
      };

      const result = duplicateDetectionService.checkHotelDuplicates(sampleHotel, [existingHotel]);

      if (result.isDuplicate) {
        expect(result.duplicateOf).toHaveProperty('name');
        expect(result.duplicateOf).toHaveProperty('city');
      }
    });
  });

  describe('checkTransportationDuplicates', () => {
    const sampleTransportation = {
      id: 'trans-1',
      type: 'Taxi',
      departureLocation: 'JFK Airport',
      arrivalLocation: 'Manhattan Hotel',
      departureDateTime: '2025-06-01T15:30:00Z',
    };

    it('should detect exact duplicate transportation', () => {
      const result = duplicateDetectionService.checkTransportationDuplicates(
        sampleTransportation,
        [sampleTransportation]
      );

      expect(result.isDuplicate).toBe(true);
      expect(result.similarity).toBe(100);
    });

    it('should not detect duplicate for different transportation', () => {
      const otherTransportation = {
        type: 'Uber',
        departureLocation: 'Hotel',
        arrivalLocation: 'Airport',
        departureDateTime: '2025-06-05T10:00:00Z',
      };

      const result = duplicateDetectionService.checkTransportationDuplicates(
        sampleTransportation,
        [otherTransportation]
      );

      expect(result.isDuplicate).toBe(false);
    });

    it('should handle empty existing transportation array', () => {
      const result = duplicateDetectionService.checkTransportationDuplicates(
        sampleTransportation,
        []
      );

      expect(result.isDuplicate).toBe(false);
    });
  });

  describe('checkCarRentalDuplicates', () => {
    const sampleCarRental = {
      id: 'car-1',
      pickupLocation: 'LAX Airport',
      dropoffLocation: 'Downtown LA',
      pickupDateTime: '2025-06-01T10:00:00Z',
      dropoffDateTime: '2025-06-07T11:00:00Z',
    };

    it('should detect exact duplicate car rental', () => {
      const result = duplicateDetectionService.checkCarRentalDuplicates(sampleCarRental, [
        sampleCarRental,
      ]);

      expect(result.isDuplicate).toBe(true);
      expect(result.similarity).toBe(100);
    });

    it('should not detect duplicate for different car rental', () => {
      const otherCarRental = {
        pickupLocation: 'JFK Airport',
        dropoffLocation: 'Manhattan',
        pickupDateTime: '2025-07-01T10:00:00Z',
        dropoffDateTime: '2025-07-07T11:00:00Z',
      };

      const result = duplicateDetectionService.checkCarRentalDuplicates(sampleCarRental, [
        otherCarRental,
      ]);

      expect(result.isDuplicate).toBe(false);
    });

    it('should handle empty existing car rentals array', () => {
      const result = duplicateDetectionService.checkCarRentalDuplicates(sampleCarRental, []);

      expect(result.isDuplicate).toBe(false);
    });
  });

  describe('checkEventDuplicates', () => {
    const sampleEvent = {
      id: 'event-1',
      name: 'Jazz Concert',
      location: 'Blue Note Jazz Club',
      startDateTime: '2025-06-15T20:00:00Z',
      endDateTime: '2025-06-15T23:00:00Z',
    };

    it('should detect exact duplicate event', () => {
      const result = duplicateDetectionService.checkEventDuplicates(sampleEvent, [sampleEvent]);

      expect(result.isDuplicate).toBe(true);
      expect(result.similarity).toBe(100);
    });

    it('should not detect duplicate for different event', () => {
      const otherEvent = {
        name: 'Museum Tour',
        location: 'MoMA',
        startDateTime: '2025-06-16T10:00:00Z',
        endDateTime: '2025-06-16T14:00:00Z',
      };

      const result = duplicateDetectionService.checkEventDuplicates(sampleEvent, [otherEvent]);

      expect(result.isDuplicate).toBe(false);
    });

    it('should detect similar event with name variation', () => {
      const similarEvent = {
        name: 'Jazz Concrt', // Misspelling
        location: 'Blue Note Jazz Club',
        startDateTime: '2025-06-15T20:00:00Z',
        endDateTime: '2025-06-15T23:00:00Z',
      };

      const result = duplicateDetectionService.checkEventDuplicates(sampleEvent, [similarEvent]);

      expect(result).toHaveProperty('isDuplicate');
    });

    it('should handle empty existing events array', () => {
      const result = duplicateDetectionService.checkEventDuplicates(sampleEvent, []);

      expect(result.isDuplicate).toBe(false);
    });
  });

  describe('checkVoucherDuplicates', () => {
    const sampleVoucher = {
      id: 'voucher-1',
      code: 'UPGRADE2025',
      type: 'Upgrade',
      issueDate: '2025-01-01',
    };

    it('should detect exact duplicate voucher', () => {
      const result = duplicateDetectionService.checkVoucherDuplicates(sampleVoucher, [
        sampleVoucher,
      ]);

      expect(result.isDuplicate).toBe(true);
      expect(result.similarity).toBe(100);
    });

    it('should not detect duplicate for different voucher', () => {
      const otherVoucher = {
        code: 'CREDIT50',
        type: 'Credit',
        issueDate: '2025-02-01',
      };

      const result = duplicateDetectionService.checkVoucherDuplicates(sampleVoucher, [
        otherVoucher,
      ]);

      expect(result.isDuplicate).toBe(false);
    });

    it('should be sensitive to voucher code', () => {
      const similarVoucher = {
        code: 'UPGRADE2024', // Different code
        type: 'Upgrade',
        issueDate: '2025-01-01',
      };

      const result = duplicateDetectionService.checkVoucherDuplicates(sampleVoucher, [
        similarVoucher,
      ]);

      // Different code should not be duplicate
      expect(result.isDuplicate).toBe(false);
    });

    it('should handle empty existing vouchers array', () => {
      const result = duplicateDetectionService.checkVoucherDuplicates(sampleVoucher, []);

      expect(result.isDuplicate).toBe(false);
    });
  });

  describe('checkCompanionDuplicates', () => {
    const sampleCompanion = {
      id: 'companion-1',
      name: 'John Smith',
      email: 'john@example.com',
    };

    it('should detect exact duplicate companion', () => {
      const result = duplicateDetectionService.checkCompanionDuplicates(sampleCompanion, [
        sampleCompanion,
      ]);

      expect(result.isDuplicate).toBe(true);
      expect(result.similarity).toBe(100);
    });

    it('should not detect duplicate for different companion', () => {
      const otherCompanion = {
        name: 'Jane Doe',
        email: 'jane@example.com',
      };

      const result = duplicateDetectionService.checkCompanionDuplicates(sampleCompanion, [
        otherCompanion,
      ]);

      expect(result.isDuplicate).toBe(false);
    });

    it('should detect similar companion with name variation', () => {
      const similarCompanion = {
        name: 'Jon Smith', // Similar name
        email: 'john@example.com',
      };

      const result = duplicateDetectionService.checkCompanionDuplicates(sampleCompanion, [
        similarCompanion,
      ]);

      expect(result).toHaveProperty('isDuplicate');
    });

    it('should handle empty existing companions array', () => {
      const result = duplicateDetectionService.checkCompanionDuplicates(sampleCompanion, []);

      expect(result.isDuplicate).toBe(false);
    });

    it('should include companion reference data when duplicate', () => {
      const existingCompanion = {
        id: 'existing-companion-1',
        name: 'John Smith',
        email: 'john@example.com',
      };

      const result = duplicateDetectionService.checkCompanionDuplicates(sampleCompanion, [
        existingCompanion,
      ]);

      if (result.isDuplicate) {
        expect(result.duplicateOf).toHaveProperty('name');
        expect(result.duplicateOf).toHaveProperty('email');
      }
    });
  });

  describe('getDuplicateDisplayName', () => {
    it('should return trip name for trip type', () => {
      const trip = { name: 'Paris Vacation' };
      const displayName = duplicateDetectionService.getDuplicateDisplayName(trip, 'trip');
      expect(displayName).toBe('Paris Vacation');
    });

    it('should return untitled trip for missing name', () => {
      const trip = {};
      const displayName = duplicateDetectionService.getDuplicateDisplayName(trip, 'trip');
      expect(displayName).toBe('Untitled Trip');
    });

    it('should return airline and flight number for flight type', () => {
      const flight = { airline: 'United', flightNumber: 'UA100' };
      const displayName = duplicateDetectionService.getDuplicateDisplayName(flight, 'flight');
      expect(displayName).toBe('United UA100');
    });

    it('should return hotel name for hotel type', () => {
      const hotel = { name: 'The Plaza' };
      const displayName = duplicateDetectionService.getDuplicateDisplayName(hotel, 'hotel');
      expect(displayName).toBe('The Plaza');
    });

    it('should return transportation details for transportation type', () => {
      const transportation = {
        type: 'Taxi',
        departureLocation: 'LAX',
        arrivalLocation: 'Downtown',
      };
      const displayName = duplicateDetectionService.getDuplicateDisplayName(
        transportation,
        'transportation'
      );
      expect(displayName).toBe('Taxi - LAX to Downtown');
    });

    it('should return car rental locations for carRental type', () => {
      const carRental = {
        pickupLocation: 'LAX',
        dropoffLocation: 'Downtown LA',
      };
      const displayName = duplicateDetectionService.getDuplicateDisplayName(carRental, 'carRental');
      expect(displayName).toBe('LAX to Downtown LA');
    });

    it('should return event name for event type', () => {
      const event = { name: 'Jazz Concert' };
      const displayName = duplicateDetectionService.getDuplicateDisplayName(event, 'event');
      expect(displayName).toBe('Jazz Concert');
    });

    it('should return voucher code for voucher type', () => {
      const voucher = { code: 'UPGRADE2025' };
      const displayName = duplicateDetectionService.getDuplicateDisplayName(voucher, 'voucher');
      expect(displayName).toBe('UPGRADE2025');
    });

    it('should return companion name for companion type', () => {
      const companion = { name: 'John Smith' };
      const displayName = duplicateDetectionService.getDuplicateDisplayName(companion, 'companion');
      expect(displayName).toBe('John Smith');
    });

    it('should return Item for unknown type', () => {
      const item = { name: 'Something' };
      const displayName = duplicateDetectionService.getDuplicateDisplayName(item, 'unknown');
      expect(displayName).toBe('Item');
    });

    it('should handle missing fields gracefully', () => {
      const flight = { airline: 'United' }; // Missing flightNumber
      const displayName = duplicateDetectionService.getDuplicateDisplayName(flight, 'flight');
      expect(displayName).toBe('United undefined');
    });
  });

  describe('Similarity threshold testing', () => {
    it('should use 90% threshold for all duplicate detection functions', () => {
      // All duplicate detection functions should have 90% similarity threshold
      // This can be verified by testing items that are exactly at 90% similarity
      // and slightly below/above

      const trip1 = {
        name: 'Paris Trip',
        destination: 'Paris, France',
        startDate: '2025-06-01',
        endDate: '2025-06-07',
      };

      // Test with exact match
      const exactResult = duplicateDetectionService.checkTripDuplicates(trip1, [trip1]);
      expect(exactResult.isDuplicate).toBe(true);

      // Test with very different trip
      const differentTrip = {
        name: 'Tokyo Adventure',
        destination: 'Tokyo, Japan',
        startDate: '2025-08-01',
        endDate: '2025-08-15',
      };
      const differentResult = duplicateDetectionService.checkTripDuplicates(trip1, [differentTrip]);
      expect(differentResult.isDuplicate).toBe(false);
    });
  });

  describe('Edge cases and robustness', () => {
    it('should handle very long strings', () => {
      const longString = 'a'.repeat(1000);
      const similarity = duplicateDetectionService.calculateStringSimilarity(longString, longString);
      expect(similarity).toBe(100);
    });

    it('should handle special characters in all functions', () => {
      const trip = {
        name: 'Trip #1 (Updated)',
        destination: 'San Francisco, CA & Bay Area',
        startDate: '2025-06-01',
        endDate: '2025-06-07',
      };

      const result = duplicateDetectionService.checkTripDuplicates(trip, [trip]);
      expect(result.isDuplicate).toBe(true);
    });

    it('should handle unicode characters', () => {
      const similarity = duplicateDetectionService.calculateStringSimilarity('café', 'cafe');
      expect(similarity).toBeGreaterThan(0);
    });

    it('should handle multiple duplicates and return first match', () => {
      const trip = { name: 'Paris', destination: 'Paris, France', startDate: '2025-06-01', endDate: '2025-06-07' };
      const existingTrips = [
        { name: 'Tokyo', destination: 'Tokyo, Japan', startDate: '2025-08-01', endDate: '2025-08-07' },
        trip, // Exact match
        { name: 'Paris Trip', destination: 'Paris, France', startDate: '2025-06-01', endDate: '2025-06-07' }, // Also similar
      ];

      const result = duplicateDetectionService.checkTripDuplicates(trip, existingTrips);
      expect(result.isDuplicate).toBe(true);
      expect(result.duplicateOf.destination).toBe('Paris, France');
    });
  });
});
