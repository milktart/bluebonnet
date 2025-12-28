/**
 * API v1 Transportation Routes
 * RESTful JSON API for transportation management
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


// All transportation routes require authentication
router.use(ensureAuthenticated);

/**
 * GET /api/v1/transportation/trips/:tripId
 * Get all transportation for a trip
 */
router.get('/trips/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    const Transportation = require('../../../models').Transportation;
    const Trip = require('../../../models').Trip;

    // Verify trip belongs to user
    const trip = await Trip.findOne({
      where: { id: tripId, userId: req.user.id }
    });

    if (!trip) {
      return apiResponse.forbidden(res, 'Access denied');
    }

    const transportation = await Transportation.findAll({
      where: { tripId },
      order: [['departureDateTime', 'ASC']]
    });

    return apiResponse.success(res, transportation, `Retrieved ${transportation.length} transportation items`);
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to retrieve transportation', error);
  }
});

/**
 * GET /api/v1/transportation/:id
 * Get transportation details
 */
router.get('/:id', async (req, res) => {
  try {
    const Transportation = require('../../../models').Transportation;
    const trans = await Transportation.findByPk(req.params.id);

    if (!trans) {
      return apiResponse.notFound(res, 'Transportation not found');
    }

    return apiResponse.success(res, trans, 'Transportation retrieved successfully');
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to retrieve transportation', error);
  }
});

/**
 * POST /api/v1/transportation
 * Create standalone transportation (not associated with a trip)
 */
router.post('/', async (req, res) => {
  try {
    const Transportation = require('../../../models').Transportation;

    // Transform form data to match model
    const transData = {
      ...req.body,
      userId: req.user.id
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
 * Create transportation for a trip
 */
router.post('/trips/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    const Trip = require('../../../models').Trip;
    const Transportation = require('../../../models').Transportation;

    // Verify trip belongs to user
    const trip = await Trip.findOne({
      where: { id: tripId, userId: req.user.id }
    });

    if (!trip) {
      return apiResponse.forbidden(res, 'Access denied');
    }

    // Transform form data to match model
    const transData = {
      ...req.body,
      tripId
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

    return apiResponse.created(res, trans, 'Transportation created successfully');
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to create transportation', error);
  }
});

/**
 * PUT /api/v1/transportation/:id
 * Update transportation
 */
router.put('/:id', async (req, res) => {
  try {
    const Transportation = require('../../../models').Transportation;
    const trans = await Transportation.findByPk(req.params.id);

    if (!trans) {
      return apiResponse.notFound(res, 'Transportation not found');
    }

    // Transform form data to match model
    const transData = { ...req.body };

    // Combine date and time fields into datetime
    if (req.body.departureDate && req.body.departureTime) {
      transData.departureDateTime = new Date(`${req.body.departureDate}T${req.body.departureTime}`);
    }
    if (req.body.arrivalDate && req.body.arrivalTime) {
      transData.arrivalDateTime = new Date(`${req.body.arrivalDate}T${req.body.arrivalTime}`);
    }

    // Update transportation
    const updated = await trans.update(transData);

    return apiResponse.success(res, updated, 'Transportation updated successfully');
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to update transportation', error);
  }
});

/**
 * DELETE /api/v1/transportation/:id
 * Delete transportation
 */
router.delete('/:id', async (req, res) => {
  try {
    const Transportation = require('../../../models').Transportation;
    const trans = await Transportation.findByPk(req.params.id);

    if (!trans) {
      return apiResponse.notFound(res, 'Transportation not found');
    }

    await trans.destroy();

    return apiResponse.noContent(res);
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to delete transportation', error);
  }
});

module.exports = router;
