/**
 * API v1 Hotels Routes
 * RESTful JSON API for hotel management
 */

const express = require('express');
const apiResponse = require('../../../utils/apiResponse');
const { ensureAuthenticated } = require('../../../middleware/auth');

const router = express.Router();

// Handle CORS preflight requests
router.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", req.get("Origin") || "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie");
  res.header("Access-Control-Allow-Credentials", "true");
  res.sendStatus(200);
});


// All hotel routes require authentication
router.use(ensureAuthenticated);

/**
 * GET /api/v1/hotels/trips/:tripId
 * Get all hotels for a trip
 */
router.get('/trips/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    const Hotel = require('../../../models').Hotel;
    const Trip = require('../../../models').Trip;

    // Verify trip belongs to user
    const trip = await Trip.findOne({
      where: { id: tripId, userId: req.user.id }
    });

    if (!trip) {
      return apiResponse.forbidden(res, 'Access denied');
    }

    const hotels = await Hotel.findAll({
      where: { tripId },
      order: [['checkInDate', 'ASC']]
    });

    return apiResponse.success(res, hotels, `Retrieved ${hotels.length} hotels`);
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to retrieve hotels', error);
  }
});

/**
 * GET /api/v1/hotels/:id
 * Get hotel details
 */
router.get('/:id', async (req, res) => {
  try {
    const Hotel = require('../../../models').Hotel;
    const hotel = await Hotel.findByPk(req.params.id);

    if (!hotel) {
      return apiResponse.notFound(res, 'Hotel not found');
    }

    return apiResponse.success(res, hotel, 'Hotel retrieved successfully');
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to retrieve hotel', error);
  }
});

/**
 * POST /api/v1/hotels
 * Create a standalone hotel (not associated with a trip)
 */
router.post('/', async (req, res) => {
  try {
    const Hotel = require('../../../models').Hotel;

    // Transform form data to match model
    const hotelData = {
      ...req.body,
      userId: req.user.id
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
 * Create a hotel for a trip
 */
router.post('/trips/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    const Trip = require('../../../models').Trip;
    const Hotel = require('../../../models').Hotel;

    // Verify trip belongs to user
    const trip = await Trip.findOne({
      where: { id: tripId, userId: req.user.id }
    });

    if (!trip) {
      return apiResponse.forbidden(res, 'Access denied');
    }

    // Transform form data to match model
    const hotelData = {
      ...req.body,
      tripId
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

    return apiResponse.created(res, hotel, 'Hotel created successfully');
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to create hotel', error);
  }
});

/**
 * PUT /api/v1/hotels/:id
 * Update a hotel
 */
router.put('/:id', async (req, res) => {
  try {
    const Hotel = require('../../../models').Hotel;
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
 */
router.delete('/:id', async (req, res) => {
  try {
    const Hotel = require('../../../models').Hotel;
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
