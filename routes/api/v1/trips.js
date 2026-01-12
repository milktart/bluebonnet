/**
 * API v1 Trips Routes
 * RESTful JSON API for trip management
 *
 * All endpoints require authentication (ensureAuthenticated middleware)
 * Response format: { success: boolean, data: ?, message: string }
 */

const express = require('express');
const tripService = require('../../../services/tripService');
const apiResponse = require('../../../utils/apiResponse');
const { ensureAuthenticated } = require('../../../middleware/auth');

const router = express.Router();

// Handle CORS preflight requests
router.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// All trip routes require authentication
router.use(ensureAuthenticated);

/**
 * GET /api/v1/trips
 * List all trips for authenticated user (both owned and companion trips)
 *
 * Returns a deduplicated list of trips where user is owner or companion
 * Optionally filters by trip dates and supports pagination
 *
 * @query {string} [filter='upcoming'] - Filter trips by status
 *   - 'upcoming': trips with departureDate in future
 *   - 'past': trips with departureDate in past
 *   - 'all': all trips regardless of date
 * @query {number} [page=1] - Page number for pagination (used with past filter)
 * @query {number} [limit=20] - Items per page
 *
 * @returns {Object} 200 OK response with trips and standalone items
 * @returns {Array} returns.trips - Array of trip objects (deduplicated)
 * @returns {string} returns.trips[].id - Trip ID (UUID)
 * @returns {string} returns.trips[].name - Trip name
 * @returns {string} returns.trips[].departureDate - Departure date (ISO format)
 * @returns {string} [returns.trips[].returnDate] - Return date (ISO format)
 * @returns {number} returns.trips[].companionCount - Number of companions
 * @returns {Array} returns.standalone - Standalone travel items not in any trip
 * @returns {Object} [returns.pagination] - Pagination info (for past trips with multiple pages)
 * @returns {number} returns.pagination.page - Current page
 * @returns {number} returns.pagination.limit - Items per page
 * @returns {number} returns.pagination.totalPages - Total number of pages
 * @returns {number} returns.pagination.totalItems - Total items available
 *
 * @throws {401} Unauthorized - User not authenticated
 * @throws {500} Server error - Database error
 *
 * @requires authentication - User must be logged in
 */
router.get('/', async (req, res) => {
  try {
    const { filter = 'upcoming', page = 1, limit = 20 } = req.query;

    const result = await tripService.getUserTrips(req.user.id, {
      filter,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });

    // Combine owned and companion trips, removing duplicates
    const tripIds = new Set();
    const trips = [];

    [...result.ownedTrips, ...result.companionTrips].forEach((trip) => {
      if (!tripIds.has(trip.id)) {
        tripIds.add(trip.id);
        trips.push(trip);
      }
    });

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
 *
 * Provides aggregated data about all trips, their items, and companions
 *
 * @returns {Object} 200 OK response with statistics
 * @returns {number} returns.totalTrips - Total number of trips (owned + companion)
 * @returns {number} returns.upcomingTrips - Number of trips with future departure dates
 * @returns {number} returns.pastTrips - Number of trips with past departure dates
 * @returns {number} returns.totalFlights - Total flights across all trips
 * @returns {number} returns.totalHotels - Total hotels across all trips
 * @returns {number} returns.totalEvents - Total events across all trips
 * @returns {number} returns.totalTransportation - Total transportation items
 * @returns {number} returns.totalCarRentals - Total car rentals
 * @returns {number} returns.companionsCount - Unique companions across all trips
 * @returns {number} [returns.totalDays] - Total trip days (sum of all trip durations)
 * @returns {Array} [returns.topDestinations] - Most visited destinations
 *
 * @throws {401} Unauthorized - User not authenticated
 * @throws {500} Server error - Database error
 *
 * @requires authentication - User must be logged in
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
 *
 * Performs full-text search across trip names and destination information
 * Case-insensitive and partial match enabled
 *
 * @query {string} q - Search query string (required, minimum 2 characters)
 *   - Searches trip name, destination, and destination field
 * @query {number} [limit=10] - Maximum results to return (1-100)
 *
 * @returns {Object} 200 OK response with matching trips
 * @returns {Array} returns - Array of trip objects matching query
 * @returns {string} returns[].id - Trip ID (UUID)
 * @returns {string} returns[].name - Trip name
 * @returns {string} returns[].destination - Trip destination
 * @returns {string} returns[].departureDate - Departure date (ISO format)
 * @returns {string} [returns[].returnDate] - Return date (ISO format)
 * @returns {number} returns[].companionCount - Companion count
 *
 * @throws {400} Bad request - Query shorter than 2 characters or missing
 * @throws {401} Unauthorized - User not authenticated
 * @throws {500} Server error - Database error
 *
 * @requires authentication - User must be logged in
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
 * Get trip details by ID with all associated items and companions
 *
 * Returns complete trip information including all nested travel items and companion details
 *
 * @param {string} req.params.id - Trip ID (UUID)
 *
 * @returns {Object} 200 OK response with complete trip object
 * @returns {string} returns.id - Trip ID
 * @returns {string} returns.name - Trip name
 * @returns {string} returns.destination - Trip destination
 * @returns {string} returns.departureDate - Departure date (ISO format)
 * @returns {string} [returns.returnDate] - Return date (ISO format)
 * @returns {string} [returns.purpose] - Trip purpose (business, leisure, family, etc.)
 * @returns {string} returns.userId - Trip owner ID
 * @returns {Array} returns.flights - Associated flight objects
 * @returns {Array} returns.hotels - Associated hotel objects
 * @returns {Array} returns.events - Associated event objects
 * @returns {Array} returns.transportation - Associated transportation objects
 * @returns {Array} returns.carRentals - Associated car rental objects
 * @returns {Array} returns.companions - Trip-level companions
 * @returns {string} returns.companions[].id - Companion ID
 * @returns {string} returns.companions[].email - Companion email
 * @returns {string} returns.companions[].firstName - Companion first name
 * @returns {Array} returns.vouchers - Associated vouchers
 * @returns {string} returns.createdAt - Creation timestamp (ISO format)
 * @returns {string} returns.updatedAt - Last update timestamp (ISO format)
 *
 * @throws {401} Unauthorized - User not authenticated
 * @throws {404} Not found - Trip not found or user has no access
 * @throws {500} Server error - Database error
 *
 * @requires authentication - User must be logged in
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
 *
 * Creates a new trip with initial metadata
 * Sets authenticated user as trip owner
 *
 * @param {Object} req.body - Request body
 * @param {string} req.body.name - Trip name (required, e.g., "Summer Vacation")
 * @param {string} req.body.departureDate - Departure date in YYYY-MM-DD format (required)
 * @param {string} [req.body.returnDate] - Return date in YYYY-MM-DD format (optional)
 * @param {string} [req.body.destination] - Destination/location name (optional)
 * @param {string} [req.body.purpose] - Trip purpose (optional)
 *   - Values: 'business', 'leisure', 'family', 'adventure', etc.
 *   - Default: 'leisure'
 * @param {boolean} [req.body.defaultCompanionEditPermission] - Give companions edit access by default (optional)
 * @param {string} [req.body.notes] - Trip notes or description (optional)
 *
 * @returns {Object} 201 Created response with new trip
 * @returns {string} returns.id - Newly created trip ID (UUID)
 * @returns {string} returns.name - Trip name
 * @returns {string} returns.destination - Trip destination
 * @returns {string} returns.departureDate - Departure date (ISO format)
 * @returns {string} [returns.returnDate] - Return date (ISO format)
 * @returns {string} returns.purpose - Trip purpose
 * @returns {string} returns.userId - Trip owner ID
 * @returns {string} returns.createdAt - Creation timestamp
 *
 * @throws {400} Bad request - Missing required fields (name, departureDate) or invalid format
 * @throws {401} Unauthorized - User not authenticated
 * @throws {500} Server error - Database error
 *
 * @requires authentication - User must be logged in
 */
router.post('/', async (req, res) => {
  try {
    const { name, departureDate, returnDate } = req.body;

    // Basic validation
    if (!name || !departureDate) {
      return apiResponse.badRequest(res, 'Missing required fields: name, departureDate');
    }

    const trip = await tripService.createTrip(req.body, req.user.id);

    return apiResponse.created(res, trip, 'Trip created successfully');
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to create trip', error);
  }
});

/**
 * PUT /api/v1/trips/:id
 * Update an existing trip
 *
 * Allows updating trip metadata and scheduling information
 * Validates trip ownership
 *
 * @param {string} req.params.id - Trip ID (UUID)
 * @param {Object} req.body - Request body with updatable fields
 * @param {string} [req.body.name] - Updated trip name
 * @param {string} [req.body.destination] - Updated destination
 * @param {string} [req.body.departureDate] - Updated departure date (YYYY-MM-DD)
 * @param {string} [req.body.returnDate] - Updated return date (YYYY-MM-DD)
 * @param {string} [req.body.purpose] - Updated trip purpose
 * @param {boolean} [req.body.defaultCompanionEditPermission] - Update companion defaults
 * @param {string} [req.body.notes] - Updated notes
 *
 * @returns {Object} 200 OK response with updated trip
 * @returns {string} returns.id - Trip ID
 * @returns {string} returns.name - Updated name
 * @returns {string} returns.destination - Updated destination
 * @returns {string} returns.departureDate - Updated departure date
 * @returns {string} [returns.returnDate] - Updated return date
 * @returns {string} returns.updatedAt - Update timestamp
 *
 * @throws {401} Unauthorized - User not authenticated
 * @throws {403} Forbidden - User does not own the trip
 * @throws {404} Not found - Trip not found
 * @throws {500} Server error - Database error
 *
 * @requires authentication - User must be logged in and be trip owner
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
 *
 * Soft delete cascading to all associated items and relationships
 * All flights, hotels, events, transportation, car rentals, and vouchers are deleted
 * Companion relationships are also removed
 *
 * @param {string} req.params.id - Trip ID (UUID)
 *
 * @returns {Object} 204 No Content - successful deletion (no response body)
 *
 * @throws {401} Unauthorized - User not authenticated
 * @throws {403} Forbidden - User does not own the trip
 * @throws {404} Not found - Trip not found
 * @throws {500} Server error - Database error during cascade delete
 *
 * @requires authentication - User must be logged in and be trip owner
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
