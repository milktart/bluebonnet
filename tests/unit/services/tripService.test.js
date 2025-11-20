/**
 * Unit Tests for TripService
 * Phase 5 - Testing Infrastructure
 */

const tripService = require('../../../services/tripService');
const {
  Trip,
  Flight,
  Hotel,
  Event,
  TripCompanion,
  TravelCompanion,
  ItemCompanion,
} = require('../../../models');

// Mock the models
jest.mock('../../../models');

describe('TripService', () => {
  let mockUserId;
  let mockTripId;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    mockUserId = 'user-123';
    mockTripId = 'trip-456';
  });

  describe('getUserTrips', () => {
    it('should get upcoming trips for a user', async () => {
      const mockTrips = [
        testHelpers.createTestTrip(mockUserId, {
          id: mockTripId,
          name: 'Summer Vacation',
          departureDate: '2025-06-01',
        }),
      ];

      Trip.findAll = jest.fn().mockResolvedValue(mockTrips);
      Trip.count = jest.fn().mockResolvedValue(1);

      const result = await tripService.getUserTrips(mockUserId, {
        filter: 'upcoming',
      });

      expect(result.ownedTrips).toHaveLength(1);
      expect(result.ownedTrips[0].name).toBe('Summer Vacation');
      expect(Trip.findAll).toHaveBeenCalled();
    });

    it('should get past trips for a user with pagination', async () => {
      const mockTrips = [
        testHelpers.createTestTrip(mockUserId, {
          id: 'trip-1',
          name: 'Past Trip 1',
          departureDate: '2024-01-01',
          returnDate: '2024-01-10',
        }),
      ];

      Trip.findAll = jest.fn().mockResolvedValue(mockTrips);
      Trip.count = jest.fn().mockResolvedValue(25); // Total 25 trips

      const result = await tripService.getUserTrips(mockUserId, {
        filter: 'past',
        page: 1,
        limit: 20,
      });

      expect(result.ownedTrips).toHaveLength(1);
      expect(result.pagination.totalPages).toBe(2);
      expect(result.pagination.hasNextPage).toBe(true);
      expect(Trip.findAll).toHaveBeenCalled();
    });

    it('should return empty array when user has no trips', async () => {
      Trip.findAll = jest.fn().mockResolvedValue([]);
      Trip.count = jest.fn().mockResolvedValue(0);

      const result = await tripService.getUserTrips(mockUserId);

      expect(result.ownedTrips).toHaveLength(0);
      expect(result.companionTrips).toHaveLength(0);
    });
  });

  describe('getTripWithDetails', () => {
    it('should get trip with full details for owner', async () => {
      const mockTrip = {
        id: mockTripId,
        userId: mockUserId,
        name: 'Test Trip',
        tripCompanions: [],
      };

      Trip.findByPk = jest.fn().mockResolvedValue(mockTrip);

      const result = await tripService.getTripWithDetails(mockTripId, mockUserId);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockTripId);
      expect(Trip.findByPk).toHaveBeenCalledWith(mockTripId, expect.any(Object));
    });

    it('should return null for non-existent trip', async () => {
      Trip.findByPk = jest.fn().mockResolvedValue(null);

      const result = await tripService.getTripWithDetails('non-existent', mockUserId);

      expect(result).toBeNull();
    });

    it('should return null when user is not owner or companion', async () => {
      const mockTrip = {
        id: mockTripId,
        userId: 'other-user',
        tripCompanions: [],
      };

      Trip.findByPk = jest.fn().mockResolvedValue(mockTrip);

      const result = await tripService.getTripWithDetails(mockTripId, mockUserId);

      expect(result).toBeNull();
    });

    it('should allow access for trip companions', async () => {
      const mockTrip = {
        id: mockTripId,
        userId: 'other-user',
        tripCompanions: [
          {
            companion: {
              userId: mockUserId,
            },
          },
        ],
      };

      Trip.findByPk = jest.fn().mockResolvedValue(mockTrip);

      const result = await tripService.getTripWithDetails(mockTripId, mockUserId);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockTripId);
    });
  });

  describe('createTrip', () => {
    it('should create a trip with valid data', async () => {
      const tripData = testHelpers.createTestTrip(mockUserId);

      const mockCreatedTrip = {
        ...tripData,
        id: mockTripId,
      };

      Trip.create = jest.fn().mockResolvedValue(mockCreatedTrip);

      const result = await tripService.createTrip(tripData, mockUserId);

      expect(result.id).toBe(mockTripId);
      expect(result.name).toBe(tripData.name);
      expect(Trip.create).toHaveBeenCalled();

      // Verify the call includes userId
      const callArgs = Trip.create.mock.calls[0][0];
      expect(callArgs.userId).toBe(mockUserId);
      expect(callArgs.name).toBe(tripData.name);
    });
  });

  describe('updateTrip', () => {
    it('should update trip for owner', async () => {
      const mockTrip = {
        id: mockTripId,
        userId: mockUserId,
        name: 'Old Name',
        update: jest.fn().mockResolvedValue(true),
      };

      Trip.findByPk = jest.fn().mockResolvedValue(mockTrip);

      const updatedData = { name: 'New Name' };
      const result = await tripService.updateTrip(mockTripId, updatedData, mockUserId);

      expect(result).toBeDefined();
      expect(mockTrip.update).toHaveBeenCalledWith(updatedData);
    });

    it('should return null when updating non-existent trip', async () => {
      Trip.findByPk = jest.fn().mockResolvedValue(null);

      const result = await tripService.updateTrip('non-existent', {}, mockUserId);

      expect(result).toBeNull();
    });

    it('should return null when user is not owner', async () => {
      const mockTrip = {
        id: mockTripId,
        userId: 'other-user',
      };

      Trip.findByPk = jest.fn().mockResolvedValue(mockTrip);

      const result = await tripService.updateTrip(mockTripId, {}, mockUserId);

      expect(result).toBeNull();
    });
  });

  describe('deleteTrip', () => {
    it('should delete trip for owner', async () => {
      const mockTrip = {
        id: mockTripId,
        userId: mockUserId,
        destroy: jest.fn().mockResolvedValue(true),
      };

      Trip.findByPk = jest.fn().mockResolvedValue(mockTrip);
      ItemCompanion.destroy = jest.fn().mockResolvedValue(true);
      TripCompanion.destroy = jest.fn().mockResolvedValue(true);

      const result = await tripService.deleteTrip(mockTripId, mockUserId);

      expect(result).toBe(true);
      expect(ItemCompanion.destroy).toHaveBeenCalledWith({
        where: { tripId: mockTripId },
      });
      expect(TripCompanion.destroy).toHaveBeenCalledWith({
        where: { tripId: mockTripId },
      });
      expect(mockTrip.destroy).toHaveBeenCalled();
    });

    it('should return false when deleting non-existent trip', async () => {
      Trip.findByPk = jest.fn().mockResolvedValue(null);

      const result = await tripService.deleteTrip('non-existent', mockUserId);

      expect(result).toBe(false);
    });

    it('should return false when user is not owner', async () => {
      const mockTrip = {
        id: mockTripId,
        userId: 'other-user',
      };

      Trip.findByPk = jest.fn().mockResolvedValue(mockTrip);

      const result = await tripService.deleteTrip(mockTripId, mockUserId);

      expect(result).toBe(false);
    });
  });

  describe('getTripStatistics', () => {
    it('should calculate trip statistics correctly', async () => {
      Trip.count = jest
        .fn()
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(3) // upcoming
        .mockResolvedValueOnce(6) // past
        .mockResolvedValueOnce(1); // active

      const result = await tripService.getTripStatistics(mockUserId);

      expect(result.totalTrips).toBe(10);
      expect(result.upcomingTrips).toBe(3);
      expect(result.pastTrips).toBe(6);
      expect(result.activeTrips).toBe(1);
    });
  });

  describe('searchTrips', () => {
    it('should search trips by name', async () => {
      const mockTrips = [
        testHelpers.createTestTrip(mockUserId, {
          id: 'trip-1',
          name: 'Paris Vacation',
        }),
      ];

      Trip.findAll = jest.fn().mockResolvedValue(mockTrips);

      const result = await tripService.searchTrips(mockUserId, 'paris');

      expect(result).toHaveLength(1);
      expect(result[0].name).toContain('Paris');
      expect(Trip.findAll).toHaveBeenCalled();
    });

    it('should limit search results', async () => {
      const mockTrips = Array(15)
        .fill(null)
        .map((_, i) =>
          testHelpers.createTestTrip(mockUserId, {
            id: `trip-${i}`,
            name: `Trip ${i}`,
          })
        );

      Trip.findAll = jest.fn().mockResolvedValue(mockTrips.slice(0, 10));

      const result = await tripService.searchTrips(mockUserId, 'trip', 10);

      expect(result).toHaveLength(10);
    });
  });

  describe('getStandaloneItems', () => {
    it('should get standalone flights and events', async () => {
      const mockFlights = [testHelpers.createTestFlight(null, { id: 'flight-1' })];
      const mockEvents = [{ id: 'event-1', name: 'Concert' }];

      Flight.findAll = jest.fn().mockResolvedValue(mockFlights);
      Event.findAll = jest.fn().mockResolvedValue(mockEvents);

      const result = await tripService.getStandaloneItems(mockUserId);

      expect(result.flights).toHaveLength(1);
      expect(result.events).toHaveLength(1);
      expect(Flight.findAll).toHaveBeenCalled();
      expect(Event.findAll).toHaveBeenCalled();
    });
  });
});
