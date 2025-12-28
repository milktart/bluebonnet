/**
 * API v1 Car Rentals Routes
 * RESTful JSON API for car rental management
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


// All car rental routes require authentication
router.use(ensureAuthenticated);

/**
 * GET /api/v1/car-rentals/trips/:tripId
 * Get all car rentals for a trip
 */
router.get('/trips/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    const CarRental = require('../../../models').CarRental;
    const Trip = require('../../../models').Trip;

    // Verify trip belongs to user
    const trip = await Trip.findOne({
      where: { id: tripId, userId: req.user.id }
    });

    if (!trip) {
      return apiResponse.forbidden(res, 'Access denied');
    }

    const carRentals = await CarRental.findAll({
      where: { tripId },
      order: [['pickupDateTime', 'ASC']]
    });

    return apiResponse.success(res, carRentals, `Retrieved ${carRentals.length} car rentals`);
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to retrieve car rentals', error);
  }
});

/**
 * GET /api/v1/car-rentals/:id
 * Get car rental details
 */
router.get('/:id', async (req, res) => {
  try {
    const CarRental = require('../../../models').CarRental;
    const carRental = await CarRental.findByPk(req.params.id);

    if (!carRental) {
      return apiResponse.notFound(res, 'Car rental not found');
    }

    return apiResponse.success(res, carRental, 'Car rental retrieved successfully');
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to retrieve car rental', error);
  }
});

/**
 * POST /api/v1/car-rentals
 * Create a standalone car rental (not associated with a trip)
 */
router.post('/', async (req, res) => {
  try {
    const CarRental = require('../../../models').CarRental;

    // Transform form data to match model
    const rentalData = {
      ...req.body,
      userId: req.user.id
    };

    // Combine date and time fields into datetime
    if (req.body.pickupDate && req.body.pickupTime) {
      rentalData.pickupDateTime = new Date(`${req.body.pickupDate}T${req.body.pickupTime}`);
    }
    if (req.body.dropoffDate && req.body.dropoffTime) {
      rentalData.dropoffDateTime = new Date(`${req.body.dropoffDate}T${req.body.dropoffTime}`);
    }

    // Create car rental without tripId (standalone)
    const carRental = await CarRental.create(rentalData);

    return apiResponse.created(res, carRental, 'Car rental created successfully');
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to create car rental', error);
  }
});

/**
 * POST /api/v1/car-rentals/trips/:tripId
 * Create a car rental for a trip
 */
router.post('/trips/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    const Trip = require('../../../models').Trip;
    const CarRental = require('../../../models').CarRental;

    // Verify trip belongs to user
    const trip = await Trip.findOne({
      where: { id: tripId, userId: req.user.id }
    });

    if (!trip) {
      return apiResponse.forbidden(res, 'Access denied');
    }

    // Transform form data to match model
    const rentalData = {
      ...req.body,
      tripId
    };

    // Combine date and time fields into datetime
    if (req.body.pickupDate && req.body.pickupTime) {
      rentalData.pickupDateTime = new Date(`${req.body.pickupDate}T${req.body.pickupTime}`);
    }
    if (req.body.dropoffDate && req.body.dropoffTime) {
      rentalData.dropoffDateTime = new Date(`${req.body.dropoffDate}T${req.body.dropoffTime}`);
    }

    // Create car rental
    const carRental = await CarRental.create(rentalData);

    return apiResponse.created(res, carRental, 'Car rental created successfully');
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to create car rental', error);
  }
});

/**
 * PUT /api/v1/car-rentals/:id
 * Update a car rental
 */
router.put('/:id', async (req, res) => {
  try {
    const CarRental = require('../../../models').CarRental;
    const carRental = await CarRental.findByPk(req.params.id);

    if (!carRental) {
      return apiResponse.notFound(res, 'Car rental not found');
    }

    // Transform form data to match model
    const rentalData = { ...req.body };

    // Combine date and time fields into datetime
    if (req.body.pickupDate && req.body.pickupTime) {
      rentalData.pickupDateTime = new Date(`${req.body.pickupDate}T${req.body.pickupTime}`);
    }
    if (req.body.dropoffDate && req.body.dropoffTime) {
      rentalData.dropoffDateTime = new Date(`${req.body.dropoffDate}T${req.body.dropoffTime}`);
    }

    // Update car rental
    const updated = await carRental.update(rentalData);

    return apiResponse.success(res, updated, 'Car rental updated successfully');
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to update car rental', error);
  }
});

/**
 * DELETE /api/v1/car-rentals/:id
 * Delete a car rental
 */
router.delete('/:id', async (req, res) => {
  try {
    const CarRental = require('../../../models').CarRental;
    const carRental = await CarRental.findByPk(req.params.id);

    if (!carRental) {
      return apiResponse.notFound(res, 'Car rental not found');
    }

    await carRental.destroy();

    return apiResponse.noContent(res);
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to delete car rental', error);
  }
});

module.exports = router;
