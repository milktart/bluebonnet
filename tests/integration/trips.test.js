/**
 * Integration Tests for Trips API
 * Tests /api/v1/trips endpoints
 */

const request = require('supertest');
const { createTestApp } = require('../testServer');
const tripService = require('../../services/tripService');

// Mock the trip service
jest.mock('../../services/tripService');

// Mock authentication middleware
jest.mock('../../middleware/auth', () => ({
  ensureAuthenticated: (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    next();
  },
  requireAdmin: (req, res, next) => next(),
}));

describe('Trips API - Integration Tests', () => {
  let app;
  const mockUserId = 'test-user-123';
  const mockTripId = 'trip-456';

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper to create authenticated request
  const authRequest = (method, url) => {
    return request(app)
      [method](url)
      .set('Accept', 'application/json')
      .set('X-Test-User-Id', mockUserId);
  };

  describe('GET /api/v1/trips', () => {
    it('should get all trips for authenticated user', async () => {
      const mockResult = {
        ownedTrips: [
          { id: 'trip-1', name: 'Summer Vacation', userId: mockUserId },
          { id: 'trip-2', name: 'Business Trip', userId: mockUserId },
        ],
        companionTrips: [],
        standalone: { flights: [], events: [] },
        pagination: { currentPage: 1, totalPages: 1 },
      };

      tripService.getUserTrips = jest.fn().mockResolvedValue(mockResult);

      const response = await authRequest('get', '/api/v1/trips');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.trips).toHaveLength(2);
      expect(tripService.getUserTrips).toHaveBeenCalledWith(mockUserId, {
        filter: 'upcoming',
        page: 1,
        limit: 20,
      });
    });

    it('should filter upcoming trips', async () => {
      const mockResult = {
        ownedTrips: [{ id: 'trip-1', name: 'Future Trip' }],
        companionTrips: [],
        standalone: {},
        pagination: { currentPage: 1, totalPages: 1 },
      };

      tripService.getUserTrips = jest.fn().mockResolvedValue(mockResult);

      const response = await authRequest('get', '/api/v1/trips?filter=upcoming');

      expect(response.status).toBe(200);
      expect(tripService.getUserTrips).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({ filter: 'upcoming' })
      );
    });

    it('should filter past trips with pagination', async () => {
      const mockResult = {
        ownedTrips: [{ id: 'trip-1', name: 'Past Trip' }],
        companionTrips: [],
        standalone: {},
        pagination: { currentPage: 1, totalPages: 3, hasNextPage: true },
      };

      tripService.getUserTrips = jest.fn().mockResolvedValue(mockResult);

      const response = await authRequest('get', '/api/v1/trips?filter=past&page=1&limit=10');

      expect(response.status).toBe(200);
      expect(response.body.pagination).toBeDefined();
      expect(tripService.getUserTrips).toHaveBeenCalledWith(mockUserId, {
        filter: 'past',
        page: 1,
        limit: 10,
      });
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app).get('/api/v1/trips');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/trips/stats', () => {
    it('should get trip statistics', async () => {
      const mockStats = {
        totalTrips: 10,
        upcomingTrips: 3,
        pastTrips: 6,
        activeTrips: 1,
      };

      tripService.getTripStatistics = jest.fn().mockResolvedValue(mockStats);

      const response = await authRequest('get', '/api/v1/trips/stats');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalTrips).toBe(10);
      expect(response.body.data.upcomingTrips).toBe(3);
      expect(tripService.getTripStatistics).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('GET /api/v1/trips/search', () => {
    it('should search trips by query', async () => {
      const mockTrips = [
        { id: 'trip-1', name: 'Paris Vacation', destination: 'Paris' },
        { id: 'trip-2', name: 'Paris Business', destination: 'Paris' },
      ];

      tripService.searchTrips = jest.fn().mockResolvedValue(mockTrips);

      const response = await authRequest('get', '/api/v1/trips/search?q=paris');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(tripService.searchTrips).toHaveBeenCalledWith(mockUserId, 'paris', 10);
    });

    it('should respect limit parameter', async () => {
      tripService.searchTrips = jest.fn().mockResolvedValue([]);

      const response = await authRequest('get', '/api/v1/trips/search?q=paris&limit=5');

      expect(response.status).toBe(200);
      expect(tripService.searchTrips).toHaveBeenCalledWith(mockUserId, 'paris', 5);
    });

    it('should return 400 if query is too short', async () => {
      const response = await authRequest('get', '/api/v1/trips/search?q=a');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('at least 2 characters');
    });

    it('should return 400 if query is missing', async () => {
      const response = await authRequest('get', '/api/v1/trips/search');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/trips/:id', () => {
    it('should get trip by ID', async () => {
      const mockTrip = {
        id: mockTripId,
        name: 'Summer Vacation',
        userId: mockUserId,
        flights: [],
        hotels: [],
      };

      tripService.getTripWithDetails = jest.fn().mockResolvedValue(mockTrip);

      const response = await authRequest('get', `/api/v1/trips/${mockTripId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(mockTripId);
      expect(response.body.data.name).toBe('Summer Vacation');
      expect(tripService.getTripWithDetails).toHaveBeenCalledWith(mockTripId, mockUserId);
    });

    it('should return 404 if trip not found', async () => {
      tripService.getTripWithDetails = jest.fn().mockResolvedValue(null);

      const response = await authRequest('get', '/api/v1/trips/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Trip not found');
    });
  });

  describe('POST /api/v1/trips', () => {
    it('should create a new trip', async () => {
      const newTrip = {
        name: 'New Vacation',
        destination: 'Hawaii',
        departureDate: '2025-07-01',
        returnDate: '2025-07-10',
      };

      const mockCreatedTrip = {
        ...newTrip,
        id: 'new-trip-789',
        userId: mockUserId,
      };

      tripService.createTrip = jest.fn().mockResolvedValue(mockCreatedTrip);

      const response = await authRequest('post', '/api/v1/trips').send(newTrip);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('new-trip-789');
      expect(response.body.data.name).toBe('New Vacation');
      expect(tripService.createTrip).toHaveBeenCalledWith(newTrip, mockUserId);
    });

    it('should return 400 if missing required fields', async () => {
      const invalidTrip = {
        name: 'Incomplete Trip',
        // Missing destination and departureDate
      };

      const response = await authRequest('post', '/api/v1/trips').send(invalidTrip);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Missing required fields');
    });
  });

  describe('PUT /api/v1/trips/:id', () => {
    it('should update a trip', async () => {
      const updatedData = {
        name: 'Updated Trip Name',
        destination: 'New Destination',
      };

      const mockUpdatedTrip = {
        id: mockTripId,
        ...updatedData,
        userId: mockUserId,
      };

      tripService.updateTrip = jest.fn().mockResolvedValue(mockUpdatedTrip);

      const response = await authRequest('put', `/api/v1/trips/${mockTripId}`).send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Trip Name');
      expect(tripService.updateTrip).toHaveBeenCalledWith(mockTripId, updatedData, mockUserId);
    });

    it('should return 404 if trip not found', async () => {
      tripService.updateTrip = jest.fn().mockResolvedValue(null);

      const response = await authRequest('put', '/api/v1/trips/non-existent').send({
        name: 'New Name',
      });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found or access denied');
    });
  });

  describe('DELETE /api/v1/trips/:id', () => {
    it('should delete a trip', async () => {
      tripService.deleteTrip = jest.fn().mockResolvedValue(true);

      const response = await authRequest('delete', `/api/v1/trips/${mockTripId}`);

      expect(response.status).toBe(204);
      expect(tripService.deleteTrip).toHaveBeenCalledWith(mockTripId, mockUserId);
    });

    it('should return 404 if trip not found', async () => {
      tripService.deleteTrip = jest.fn().mockResolvedValue(false);

      const response = await authRequest('delete', '/api/v1/trips/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found or access denied');
    });
  });
});
