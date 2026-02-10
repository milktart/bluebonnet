/**
 * API v1 Transportation Routes
 * RESTful JSON API for transportation management
 */

const express = require('express');
const apiResponse = require('../../../utils/apiResponse');
const { ensureAuthenticated } = require('../../../middleware/auth');
const { getItemPermissions } = require('../../../utils/itemPermissionHelper');
const { loadItemCompanionsData } = require('../../../utils/itemCompanionLoader');

const router = express.Router();

// Handle CORS preflight requests
router.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// All transportation routes require authentication
router.use(ensureAuthenticated);

/**
 * GET /api/v1/transportation/trips/:tripId
 * Retrieve all transportation items associated with a specific trip
 *
 * Returns transportation ordered by departure date/time (earliest first)
 * Validates that requesting user owns the trip
 *
 * @param {string} req.params.tripId - Trip ID (UUID)
 *
 * @returns {Object} 200 OK response with transportation array
 * @returns {Array} returns - Array of transportation objects
 * @returns {string} returns[].id - Transportation ID
 * @returns {string} returns[].tripId - Associated trip ID
 * @returns {string} returns[].type - Type (bus, train, taxi, etc.)
 * @returns {string} returns[].origin - Starting location
 * @returns {string} returns[].destination - End location
 * @returns {string} returns[].departureDateTime - Departure in UTC ISO format
 * @returns {string} returns[].arrivalDateTime - Arrival in UTC ISO format
 * @returns {string} [returns[].confirmationNumber] - Booking confirmation if available
 *
 * @throws {401} Unauthorized - User not authenticated
 * @throws {403} Forbidden - User does not own the trip
 * @throws {404} Not found - Trip not found
 * @throws {500} Server error - Database error
 *
 * @requires authentication - User must be logged in
 */
router.get('/trips/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    const { Transportation } = require('../../../models');
    const { Trip } = require('../../../models');

    // Verify trip belongs to user
    const trip = await Trip.findOne({
      where: { id: tripId, userId: req.user.id },
    });

    if (!trip) {
      return apiResponse.forbidden(res, 'Access denied');
    }

    const transportation = await Transportation.findAll({
      where: { tripId },
      order: [['departureDateTime', 'ASC']],
    });

    return apiResponse.success(
      res,
      transportation,
      `Retrieved ${transportation.length} transportation items`
    );
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to retrieve transportation', error);
  }
});

/**
 * GET /api/v1/transportation/:id
 * Retrieve a specific transportation item with its companion assignments
 *
 * Includes all companions assigned to this transportation (both direct and inherited from trip)
 *
 * @param {string} req.params.id - Transportation ID (UUID)
 *
 * @returns {Object} 200 OK response with transportation details
 * @returns {string} returns.id - Transportation ID
 * @returns {string} returns.type - Transportation type (bus, train, taxi, car, ferry, etc.)
 * @returns {string} returns.origin - Starting location
 * @returns {string} returns.destination - Destination location
 * @returns {string} returns.departureDateTime - Departure in UTC ISO format
 * @returns {string} returns.arrivalDateTime - Arrival in UTC ISO format
 * @returns {string} [returns.confirmationNumber] - Booking reference
 * @returns {string} [returns.notes] - Additional notes
 * @returns {Array} returns.itemCompanions - Assigned companions
 * @returns {string} returns.itemCompanions[].id - Companion ID
 * @returns {string} returns.itemCompanions[].email - Companion email
 * @returns {string} returns.itemCompanions[].firstName - First name
 * @returns {string} returns.itemCompanions[].lastName - Last name
 * @returns {boolean} returns.itemCompanions[].inheritedFromTrip - Trip-level flag
 *
 * @throws {401} Unauthorized - User not authenticated
 * @throws {404} Not found - Transportation not found
 * @throws {500} Server error - Database error
 *
 * @requires authentication - User must be logged in
 */
router.get('/:id', async (req, res) => {
  try {
    const { Transportation, Trip } = require('../../../models');
    const trans = await Transportation.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip', required: false }],
    });

    if (!trans) {
      return apiResponse.notFound(res, 'Transportation not found');
    }

    const transData = trans.toJSON();

    // Load all companion data using shared helper
    const { itemCompanions, tripCompanions, tripOwnerId } = await loadItemCompanionsData(
      trans,
      'transportation'
    );

    transData.itemCompanions = itemCompanions;

    // Set canEdit flag using centralized permission helper
    const userId = req.user?.id;
    const permissions = await getItemPermissions(trans, userId);
    transData.canEdit = permissions.canEdit;
    transData.canDelete = permissions.canDelete;

    if (tripCompanions.length > 0) {
      transData.tripCompanions = tripCompanions;
      transData.tripOwnerId = tripOwnerId;
    }

    return apiResponse.success(res, transData, 'Transportation retrieved successfully');
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to retrieve transportation', error);
  }
});

/**
 * POST /api/v1/transportation
 * Create standalone transportation (not associated with a trip)
 *
 * Supports separate date and time fields
 * Automatically combines into departureDateTime and arrivalDateTime
 *
 * @param {Object} req.body - Request body
 * @param {string} req.body.type - Transportation type (bus, train, taxi, car, ferry, etc.)
 * @param {string} req.body.origin - Starting location
 * @param {string} req.body.destination - Destination location
 * @param {string} [req.body.departureDate] - Departure date (YYYY-MM-DD)
 * @param {string} [req.body.departureTime] - Departure time (HH:mm)
 * @param {string} [req.body.arrivalDate] - Arrival date (YYYY-MM-DD)
 * @param {string} [req.body.arrivalTime] - Arrival time (HH:mm)
 * @param {string} [req.body.confirmationNumber] - Booking reference
 * @param {string} [req.body.notes] - Additional notes
 *
 * @returns {Object} 201 Created response with transportation object
 * @returns {string} returns.id - Transportation ID (UUID)
 * @returns {string} returns.type - Transportation type
 * @returns {string} returns.origin - Origin location
 * @returns {string} returns.destination - Destination location
 * @returns {string} returns.departureDateTime - Departure in UTC ISO format
 * @returns {string} returns.arrivalDateTime - Arrival in UTC ISO format
 *
 * @throws {400} Bad request - Missing required fields
 * @throws {401} Unauthorized - User not authenticated
 * @throws {500} Server error - Database error
 *
 * @requires authentication - User must be logged in
 */
router.post('/', async (req, res) => {
  try {
    const { Transportation } = require('../../../models');
    const geocodingService = require('../../../services/geocodingService');

    // Geocode origin and destination
    const originCoords = await geocodingService.geocodeLocation(req.body.origin);
    const destCoords = await geocodingService.geocodeLocation(req.body.destination);

    // Transform form data to match model
    const transData = {
      ...req.body,
      userId: req.user.id,
      originLat: originCoords?.lat,
      originLng: originCoords?.lng,
      destinationLat: destCoords?.lat,
      destinationLng: destCoords?.lng,
    };

    // Combine date and time fields into datetime
    if (req.body.departureDate && req.body.departureTime) {
      transData.departureDateTime = new Date(`${req.body.departureDate}T${req.body.departureTime}`);
    }
    if (req.body.arrivalDate && req.body.arrivalTime) {
      transData.arrivalDateTime = new Date(`${req.body.arrivalDate}T${req.body.arrivalTime}`);
    }

    // Create transportation without tripId (standalone)
    const trans = await Transportation.create(transData);

    return apiResponse.created(res, trans, 'Transportation created successfully');
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to create transportation', error);
  }
});

/**
 * POST /api/v1/transportation/trips/:tripId
 * Create transportation for a specific trip
 *
 * Automatically adds all trip-level companions to the new transportation
 * Validates trip ownership and processes date/time fields
 *
 * @param {string} req.params.tripId - Trip ID (UUID)
 * @param {Object} req.body - Request body (same as POST /api/v1/transportation)
 * @param {string} req.body.type - Transportation type
 * @param {string} req.body.origin - Starting location
 * @param {string} req.body.destination - Destination location
 * @param {string} [req.body.departureDate] - Departure date (YYYY-MM-DD)
 * @param {string} [req.body.departureTime] - Departure time (HH:mm)
 * @param {string} [req.body.arrivalDate] - Arrival date (YYYY-MM-DD)
 * @param {string} [req.body.arrivalTime] - Arrival time (HH:mm)
 * @param {string} [req.body.confirmationNumber] - Booking reference
 * @param {string} [req.body.notes] - Notes
 *
 * @returns {Object} 201 Created response with transportation object
 * @returns {string} returns.id - Transportation ID
 * @returns {string} returns.tripId - Associated trip ID
 * @returns {Array} returns.itemCompanions - Auto-added companions from trip level
 *
 * @throws {400} Bad request - Invalid parameters
 * @throws {401} Unauthorized - User not authenticated
 * @throws {403} Forbidden - User does not own the trip
 * @throws {404} Not found - Trip not found
 * @throws {500} Server error - Database error
 *
 * @requires authentication - User must be logged in
 */
router.post('/trips/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    const { Trip } = require('../../../models');
    const { Transportation } = require('../../../models');
    const itemCompanionHelper = require('../../../utils/itemCompanionHelper');
    const geocodingService = require('../../../services/geocodingService');

    // Verify trip belongs to user
    const trip = await Trip.findOne({
      where: { id: tripId, userId: req.user.id },
    });

    if (!trip) {
      return apiResponse.forbidden(res, 'Access denied');
    }

    // Geocode origin and destination
    const originCoords = await geocodingService.geocodeLocation(req.body.origin);
    const destCoords = await geocodingService.geocodeLocation(req.body.destination);

    // Transform form data to match model
    const transData = {
      ...req.body,
      tripId,
      originLat: originCoords?.lat,
      originLng: originCoords?.lng,
      destinationLat: destCoords?.lat,
      destinationLng: destCoords?.lng,
    };

    // Combine date and time fields into datetime
    if (req.body.departureDate && req.body.departureTime) {
      transData.departureDateTime = new Date(`${req.body.departureDate}T${req.body.departureTime}`);
    }
    if (req.body.arrivalDate && req.body.arrivalTime) {
      transData.arrivalDateTime = new Date(`${req.body.arrivalDate}T${req.body.arrivalTime}`);
    }

    // Create transportation
    const trans = await Transportation.create(transData);

    // Auto-add trip-level companions to the new transportation
    try {
      await itemCompanionHelper.autoAddTripCompanions(
        'transportation',
        trans.id,
        tripId,
        req.user.id
      );
    } catch (companionError) {
      // Log error but don't fail the transportation creation
      console.error('[Transportation Creation] Error auto-adding companions:', companionError);
    }

    return apiResponse.created(res, trans, 'Transportation created successfully');
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to create transportation', error);
  }
});

/**
 * PUT /api/v1/transportation/:id
 * Update an existing transportation item
 *
 * Processes date/time fields and validates transportation exists
 *
 * @param {string} req.params.id - Transportation ID (UUID)
 * @param {Object} req.body - Request body with updatable fields
 * @param {string} [req.body.type] - Updated transportation type
 * @param {string} [req.body.origin] - Updated starting location
 * @param {string} [req.body.destination] - Updated destination
 * @param {string} [req.body.departureDate] - Updated departure date (YYYY-MM-DD)
 * @param {string} [req.body.departureTime] - Updated departure time (HH:mm)
 * @param {string} [req.body.arrivalDate] - Updated arrival date (YYYY-MM-DD)
 * @param {string} [req.body.arrivalTime] - Updated arrival time (HH:mm)
 * @param {string} [req.body.confirmationNumber] - Updated confirmation number
 * @param {string} [req.body.notes] - Updated notes
 *
 * @returns {Object} 200 OK response with updated transportation
 * @returns {string} returns.id - Transportation ID
 * @returns {string} returns.type - Updated type
 * @returns {string} returns.origin - Updated origin
 * @returns {string} returns.destination - Updated destination
 * @returns {string} returns.departureDateTime - Updated departure (ISO format)
 * @returns {string} returns.arrivalDateTime - Updated arrival (ISO format)
 *
 * @throws {401} Unauthorized - User not authenticated
 * @throws {404} Not found - Transportation not found
 * @throws {500} Server error - Database error
 *
 * @requires authentication - User must be logged in
 */
router.put('/:id', async (req, res) => {
  try {
    const { Transportation, Trip } = require('../../../models');
    const { requireItemEditPermission } = require('../../../utils/itemPermissionHelper');
    const geocodingService = require('../../../services/geocodingService');

    const trans = await Transportation.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip', required: false }],
    });

    if (!trans) {
      return apiResponse.notFound(res, 'Transportation not found');
    }

    // Check permission to edit
    await requireItemEditPermission(trans, req.user.id, 'transportation');

    // Transform form data to match model
    const transData = { ...req.body };
    const newTripId = transData.tripId;
    const oldTripId = trans.tripId;

    // Geocode if origin or destination changed
    if (req.body.origin || req.body.destination) {
      const originNew = req.body.origin || trans.origin;
      const destNew = req.body.destination || trans.destination;
      const originOld = trans.origin;
      const destOld = trans.destination;

      // Only re-geocode if locations changed
      if (originNew !== originOld || destNew !== destOld) {
        const originCoords = await geocodingService.geocodeLocation(originNew);
        const destCoords = await geocodingService.geocodeLocation(destNew);

        if (originCoords) {
          transData.originLat = originCoords.lat;
          transData.originLng = originCoords.lng;
        }
        if (destCoords) {
          transData.destinationLat = destCoords.lat;
          transData.destinationLng = destCoords.lng;
        }
      }
    }

    // Combine date and time fields into datetime
    if (req.body.departureDate && req.body.departureTime) {
      transData.departureDateTime = new Date(`${req.body.departureDate}T${req.body.departureTime}`);
    }
    if (req.body.arrivalDate && req.body.arrivalTime) {
      transData.arrivalDateTime = new Date(`${req.body.arrivalDate}T${req.body.arrivalTime}`);
    }

    // Update transportation
    const updated = await trans.update(transData);

    // Handle trip association changes via ItemTrip junction table
    if (newTripId !== undefined && newTripId !== oldTripId) {
      try {
        const ItemTripService = require('../../../services/itemTripService');
        const itemTripService = new ItemTripService();

        // Remove from old trip if there was one
        if (oldTripId) {
          await itemTripService.removeItemFromTrip('transportation', trans.id, oldTripId);
        }

        // Add to new trip if one was provided
        if (newTripId) {
          await itemTripService.addItemToTrip('transportation', trans.id, newTripId, req.user.id);
        }
      } catch (error) {
        require('../../../utils/logger').error(
          'Error updating transportation trip association:',
          error
        );
        // Don't fail the update due to ItemTrip errors
      }
    }

    return apiResponse.success(res, updated, 'Transportation updated successfully');
  } catch (error) {
    if (error.statusCode === 403) {
      return apiResponse.forbidden(res, error.message);
    }
    return apiResponse.internalError(res, 'Failed to update transportation', error);
  }
});

/**
 * DELETE /api/v1/transportation/:id
 * Delete transportation
 *
 * Soft delete with cascade cleanup of companion assignments
 * Validates transportation exists before deletion
 *
 * @param {string} req.params.id - Transportation ID (UUID)
 *
 * @returns {Object} 204 No Content - successful deletion (no response body)
 *
 * @throws {401} Unauthorized - User not authenticated
 * @throws {404} Not found - Transportation not found
 * @throws {500} Server error - Database error
 *
 * @requires authentication - User must be logged in
 */
router.delete('/:id', async (req, res) => {
  try {
    const { Transportation, Trip } = require('../../../models');
    const { requireItemEditPermission } = require('../../../utils/itemPermissionHelper');
    const trans = await Transportation.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip', required: false }],
    });

    if (!trans) {
      return apiResponse.notFound(res, 'Transportation not found');
    }

    // Check permission to delete
    await requireItemEditPermission(trans, req.user.id, 'transportation');

    await trans.destroy();

    return apiResponse.noContent(res);
  } catch (error) {
    if (error.statusCode === 403) {
      return apiResponse.forbidden(res, error.message);
    }
    return apiResponse.internalError(res, 'Failed to delete transportation', error);
  }
});

module.exports = router;
