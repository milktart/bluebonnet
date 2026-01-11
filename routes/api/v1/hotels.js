/**
 * API v1 Hotels Routes
 * RESTful JSON API for hotel management
 */

const express = require('express');
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

// All hotel routes require authentication
router.use(ensureAuthenticated);

/**
 * GET /api/v1/hotels/trips/:tripId
 * Retrieve all hotels associated with a specific trip
 *
 * Returns hotels ordered by check-in date (earliest first)
 * Validates that requesting user owns the trip
 *
 * @param {string} req.params.tripId - Trip ID (UUID)
 *
 * @returns {Object} 200 OK response with hotels array
 * @returns {Array} returns - Array of hotel objects
 * @returns {string} returns[].id - Hotel ID
 * @returns {string} returns[].tripId - Associated trip ID
 * @returns {string} returns[].hotelName - Hotel name
 * @returns {string} returns[].address - Hotel address
 * @returns {string} returns[].city - City
 * @returns {string} returns[].checkInDate - Check-in date (ISO format)
 * @returns {string} returns[].checkOutDate - Check-out date (ISO format)
 * @returns {string} [returns[].confirmationNumber] - Booking confirmation if available
 * @returns {number} [returns[].price] - Nightly rate if available
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
    const { Hotel } = require('../../../models');
    const { Trip } = require('../../../models');

    // Verify trip belongs to user
    const trip = await Trip.findOne({
      where: { id: tripId, userId: req.user.id },
    });

    if (!trip) {
      return apiResponse.forbidden(res, 'Access denied');
    }

    const hotels = await Hotel.findAll({
      where: { tripId },
      order: [['checkInDate', 'ASC']],
    });

    return apiResponse.success(res, hotels, `Retrieved ${hotels.length} hotels`);
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to retrieve hotels', error);
  }
});

/**
 * GET /api/v1/hotels/:id
 * Retrieve a specific hotel with its companion assignments
 *
 * Includes all companions assigned to this hotel (both direct and inherited from trip)
 *
 * @param {string} req.params.id - Hotel ID (UUID)
 *
 * @returns {Object} 200 OK response with hotel details
 * @returns {string} returns.id - Hotel ID
 * @returns {string} returns.hotelName - Hotel name
 * @returns {string} returns.address - Street address
 * @returns {string} returns.city - City
 * @returns {string} returns.state - State/Province
 * @returns {string} returns.postalCode - ZIP/postal code
 * @returns {string} returns.country - Country
 * @returns {string} returns.checkInDate - Check-in date (ISO format)
 * @returns {string} returns.checkOutDate - Check-out date (ISO format)
 * @returns {string} returns.checkInDateTime - Check-in with time (ISO format)
 * @returns {string} returns.checkOutDateTime - Check-out with time (ISO format)
 * @returns {string} [returns.confirmationNumber] - Booking reference
 * @returns {string} [returns.phone] - Hotel phone number
 * @returns {number} [returns.price] - Nightly rate
 * @returns {Array} returns.itemCompanions - Assigned companions
 * @returns {string} returns.itemCompanions[].id - Companion ID
 * @returns {string} returns.itemCompanions[].email - Companion email
 * @returns {string} returns.itemCompanions[].firstName - First name
 * @returns {string} returns.itemCompanions[].lastName - Last name
 * @returns {boolean} returns.itemCompanions[].inheritedFromTrip - Trip-level companion flag
 *
 * @throws {401} Unauthorized - User not authenticated
 * @throws {404} Not found - Hotel not found
 * @throws {500} Server error - Database error
 *
 * @requires authentication - User must be logged in
 */
router.get('/:id', async (req, res) => {
  try {
    const { Hotel, TravelCompanion, ItemCompanion } = require('../../../models');
    const hotel = await Hotel.findByPk(req.params.id);

    if (!hotel) {
      return apiResponse.notFound(res, 'Hotel not found');
    }

    // Get companions for this hotel
    const itemCompanions = await ItemCompanion.findAll({
      where: { itemType: 'hotel', itemId: hotel.id },
      include: [
        {
          model: TravelCompanion,
          as: 'companion',
          attributes: ['id', 'email', 'firstName', 'lastName', 'name', 'userId'],
        },
      ],
    });

    // Add companions to response
    const hotelData = hotel.toJSON();
    hotelData.itemCompanions = itemCompanions.map((ic) => ({
      id: ic.companion.id,
      email: ic.companion.email,
      firstName: ic.companion.firstName,
      lastName: ic.companion.lastName,
      name: ic.companion.name,
      userId: ic.companion.userId,
      inheritedFromTrip: ic.inheritedFromTrip,
    }));

    return apiResponse.success(res, hotelData, 'Hotel retrieved successfully');
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to retrieve hotel', error);
  }
});

/**
 * POST /api/v1/hotels
 * Create a standalone hotel (not associated with a trip)
 *
 * Supports both combined datetime and separate date/time fields
 * Maps 'name' field to 'hotelName' for consistency
 *
 * @param {Object} req.body - Request body
 * @param {string} req.body.hotelName - Hotel name (or 'name' as alias)
 * @param {string} req.body.address - Street address
 * @param {string} req.body.city - City name
 * @param {string} [req.body.state] - State or province
 * @param {string} [req.body.postalCode] - ZIP or postal code
 * @param {string} [req.body.country] - Country name
 * @param {string} [req.body.checkInDate] - Check-in date (YYYY-MM-DD)
 * @param {string} [req.body.checkInTime] - Check-in time (HH:mm)
 * @param {string} [req.body.checkOutDate] - Check-out date (YYYY-MM-DD)
 * @param {string} [req.body.checkOutTime] - Check-out time (HH:mm)
 * @param {string} [req.body.confirmationNumber] - Booking reference
 * @param {string} [req.body.phone] - Hotel contact phone
 * @param {number} [req.body.price] - Nightly rate
 * @param {string} [req.body.notes] - Additional notes
 *
 * @returns {Object} 201 Created response with hotel object
 * @returns {string} returns.id - Hotel ID (UUID)
 * @returns {string} returns.hotelName - Hotel name
 * @returns {string} returns.address - Address
 * @returns {string} returns.city - City
 * @returns {string} returns.checkInDateTime - Check-in with time (ISO format)
 * @returns {string} returns.checkOutDateTime - Check-out with time (ISO format)
 *
 * @throws {400} Bad request - Missing required fields
 * @throws {401} Unauthorized - User not authenticated
 * @throws {500} Server error - Database error
 *
 * @requires authentication - User must be logged in
 */
router.post('/', async (req, res) => {
  try {
    const { Hotel } = require('../../../models');

    // Transform form data to match model
    const hotelData = {
      ...req.body,
      userId: req.user.id,
    };

    // Combine date and time fields into datetime
    if (req.body.checkInDate && req.body.checkInTime) {
      hotelData.checkInDateTime = new Date(`${req.body.checkInDate}T${req.body.checkInTime}`);
    }
    if (req.body.checkOutDate && req.body.checkOutTime) {
      hotelData.checkOutDateTime = new Date(`${req.body.checkOutDate}T${req.body.checkOutTime}`);
    }

    // Map 'name' field to 'hotelName' if provided
    if (req.body.name) {
      hotelData.hotelName = req.body.name;
    }

    // Create hotel without tripId (standalone)
    const hotel = await Hotel.create(hotelData);

    return apiResponse.created(res, hotel, 'Hotel created successfully');
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to create hotel', error);
  }
});

/**
 * POST /api/v1/hotels/trips/:tripId
 * Create a hotel for a specific trip
 *
 * Automatically adds all trip-level companions to the new hotel
 * Validates trip ownership and processes date/time fields
 *
 * @param {string} req.params.tripId - Trip ID (UUID)
 * @param {Object} req.body - Request body (same fields as POST /api/v1/hotels)
 * @param {string} req.body.hotelName - Hotel name
 * @param {string} req.body.address - Street address
 * @param {string} req.body.city - City name
 * @param {string} [req.body.state] - State or province
 * @param {string} [req.body.postalCode] - ZIP code
 * @param {string} [req.body.country] - Country
 * @param {string} [req.body.checkInDate] - Check-in date (YYYY-MM-DD)
 * @param {string} [req.body.checkInTime] - Check-in time (HH:mm)
 * @param {string} [req.body.checkOutDate] - Check-out date (YYYY-MM-DD)
 * @param {string} [req.body.checkOutTime] - Check-out time (HH:mm)
 * @param {string} [req.body.confirmationNumber] - Booking reference
 * @param {string} [req.body.phone] - Hotel phone
 * @param {number} [req.body.price] - Nightly rate
 * @param {string} [req.body.notes] - Notes
 *
 * @returns {Object} 201 Created response with hotel object
 * @returns {string} returns.id - Hotel ID
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
    const { Hotel } = require('../../../models');
    const itemCompanionHelper = require('../../../utils/itemCompanionHelper');

    // Verify trip belongs to user
    const trip = await Trip.findOne({
      where: { id: tripId, userId: req.user.id },
    });

    if (!trip) {
      return apiResponse.forbidden(res, 'Access denied');
    }

    // Transform form data to match model
    const hotelData = {
      ...req.body,
      tripId,
    };

    // Combine date and time fields into datetime
    if (req.body.checkInDate && req.body.checkInTime) {
      hotelData.checkInDateTime = new Date(`${req.body.checkInDate}T${req.body.checkInTime}`);
    }
    if (req.body.checkOutDate && req.body.checkOutTime) {
      hotelData.checkOutDateTime = new Date(`${req.body.checkOutDate}T${req.body.checkOutTime}`);
    }

    // Map 'name' field to 'hotelName' if provided
    if (req.body.name) {
      hotelData.hotelName = req.body.name;
    }

    // Create hotel
    const hotel = await Hotel.create(hotelData);

    // Auto-add trip-level companions to the new hotel
    try {
      await itemCompanionHelper.autoAddTripCompanions('hotel', hotel.id, tripId, req.user.id);
    } catch (companionError) {
      // Log error but don't fail the hotel creation
      console.error('[Hotel Creation] Error auto-adding companions:', companionError);
    }

    return apiResponse.created(res, hotel, 'Hotel created successfully');
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to create hotel', error);
  }
});

/**
 * PUT /api/v1/hotels/:id
 * Update an existing hotel
 *
 * Processes date/time fields and maps field names appropriately
 * Validates ownership and hotel exists
 *
 * @param {string} req.params.id - Hotel ID (UUID)
 * @param {Object} req.body - Request body with updatable fields
 * @param {string} [req.body.hotelName] - Updated hotel name
 * @param {string} [req.body.address] - Updated address
 * @param {string} [req.body.city] - Updated city
 * @param {string} [req.body.state] - Updated state/province
 * @param {string} [req.body.postalCode] - Updated postal code
 * @param {string} [req.body.country] - Updated country
 * @param {string} [req.body.checkInDate] - Updated check-in date (YYYY-MM-DD)
 * @param {string} [req.body.checkInTime] - Updated check-in time (HH:mm)
 * @param {string} [req.body.checkOutDate] - Updated check-out date (YYYY-MM-DD)
 * @param {string} [req.body.checkOutTime] - Updated check-out time (HH:mm)
 * @param {string} [req.body.confirmationNumber] - Updated confirmation number
 * @param {string} [req.body.phone] - Updated phone number
 * @param {number} [req.body.price] - Updated nightly rate
 * @param {string} [req.body.notes] - Updated notes
 *
 * @returns {Object} 200 OK response with updated hotel
 * @returns {string} returns.id - Hotel ID
 * @returns {string} returns.hotelName - Updated name
 * @returns {string} returns.checkInDateTime - Updated check-in (ISO format)
 * @returns {string} returns.checkOutDateTime - Updated check-out (ISO format)
 *
 * @throws {401} Unauthorized - User not authenticated
 * @throws {404} Not found - Hotel not found
 * @throws {500} Server error - Database error
 *
 * @requires authentication - User must be logged in
 */
router.put('/:id', async (req, res) => {
  try {
    const { Hotel } = require('../../../models');
    const hotel = await Hotel.findByPk(req.params.id);

    if (!hotel) {
      return apiResponse.notFound(res, 'Hotel not found');
    }

    // Transform form data to match model
    const hotelData = { ...req.body };

    // Combine date and time fields into datetime
    if (req.body.checkInDate && req.body.checkInTime) {
      hotelData.checkInDateTime = new Date(`${req.body.checkInDate}T${req.body.checkInTime}`);
    }
    if (req.body.checkOutDate && req.body.checkOutTime) {
      hotelData.checkOutDateTime = new Date(`${req.body.checkOutDate}T${req.body.checkOutTime}`);
    }

    // Map 'name' field to 'hotelName' if provided
    if (req.body.name) {
      hotelData.hotelName = req.body.name;
    }

    // Update hotel
    const updated = await hotel.update(hotelData);

    return apiResponse.success(res, updated, 'Hotel updated successfully');
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to update hotel', error);
  }
});

/**
 * DELETE /api/v1/hotels/:id
 * Delete a hotel
 *
 * Soft delete with cascade cleanup of companion assignments
 * Validates hotel exists before deletion
 *
 * @param {string} req.params.id - Hotel ID (UUID)
 *
 * @returns {Object} 204 No Content - successful deletion (no response body)
 *
 * @throws {401} Unauthorized - User not authenticated
 * @throws {404} Not found - Hotel not found
 * @throws {500} Server error - Database error
 *
 * @requires authentication - User must be logged in
 */
router.delete('/:id', async (req, res) => {
  try {
    const { Hotel } = require('../../../models');
    const hotel = await Hotel.findByPk(req.params.id);

    if (!hotel) {
      return apiResponse.notFound(res, 'Hotel not found');
    }

    await hotel.destroy();

    return apiResponse.noContent(res);
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to delete hotel', error);
  }
});

module.exports = router;
