/**
 * API v1 Trips Routes
 * RESTful JSON API for trip management
 * Phase 3 - API Versioning
 */

const express = require('express');
const tripService = require('../../../services/tripService');
const apiResponse = require('../../../utils/apiResponse');
const { ensureAuthenticated } = require('../../../middleware/auth');

const router = express.Router();

// All trip routes require authentication
router.use(ensureAuthenticated);

/**
 * GET /api/v1/trips
 * List all trips for authenticated user
 * Query params: filter (upcoming/past/all), page, limit
 */
router.get('/', async (req, res) => {
  try {
    const { filter = 'upcoming', page = 1, limit = 20 } = req.query;

    const result = await tripService.getUserTrips(req.user.id, {
      filter,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });

    // Combine owned and companion trips
    const trips = [...result.ownedTrips, ...result.companionTrips];

    // If past trips with pagination, return paginated response
    if (filter === 'past' && result.pagination.totalPages > 1) {
      return apiResponse.paginated(
        res,
        trips,
        result.pagination,
        `Retrieved ${trips.length} ${filter} trips`
      );
    }

    return apiResponse.success(
      res,
      {
        trips,
        standalone: result.standalone,
      },
      `Retrieved ${trips.length} ${filter} trips`
    );
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to retrieve trips', error);
  }
});

/**
 * GET /api/v1/trips/stats
 * Get trip statistics for authenticated user
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await tripService.getTripStatistics(req.user.id);
    return apiResponse.success(res, stats, 'Trip statistics retrieved');
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to retrieve trip statistics', error);
  }
});

/**
 * GET /api/v1/trips/search
 * Search trips by name or destination
 * Query params: q (query), limit
 */
router.get('/search', async (req, res) => {
  try {
    const { q: query, limit = 10 } = req.query;

    if (!query || query.length < 2) {
      return apiResponse.badRequest(res, 'Search query must be at least 2 characters');
    }

    const trips = await tripService.searchTrips(req.user.id, query, parseInt(limit, 10));

    return apiResponse.success(res, trips, `Found ${trips.length} trips`);
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to search trips', error);
  }
});

/**
 * GET /api/v1/trips/:id
 * Get trip details by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const trip = await tripService.getTripWithDetails(req.params.id, req.user.id);

    if (!trip) {
      return apiResponse.notFound(res, 'Trip not found');
    }

    return apiResponse.success(res, trip, 'Trip retrieved successfully');
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to retrieve trip', error);
  }
});

/**
 * POST /api/v1/trips
 * Create a new trip
 */
router.post('/', async (req, res) => {
  try {
    const { name, destination, departureDate } = req.body;

    // Basic validation
    if (!name || !destination || !departureDate) {
      return apiResponse.badRequest(
        res,
        'Missing required fields: name, destination, departureDate'
      );
    }

    const trip = await tripService.createTrip(req.body, req.user.id);

    return apiResponse.created(res, trip, 'Trip created successfully');
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to create trip', error);
  }
});

/**
 * PUT /api/v1/trips/:id
 * Update a trip
 */
router.put('/:id', async (req, res) => {
  try {
    const trip = await tripService.updateTrip(req.params.id, req.body, req.user.id);

    if (!trip) {
      return apiResponse.notFound(res, 'Trip not found or access denied');
    }

    return apiResponse.success(res, trip, 'Trip updated successfully');
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to update trip', error);
  }
});

/**
 * DELETE /api/v1/trips/:id
 * Delete a trip
 */
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await tripService.deleteTrip(req.params.id, req.user.id);

    if (!deleted) {
      return apiResponse.notFound(res, 'Trip not found or access denied');
    }

    return apiResponse.noContent(res);
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to delete trip', error);
  }
});

module.exports = router;
