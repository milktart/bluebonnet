/**
 * API v1 Transportation Routes
 * RESTful JSON API for transportation management
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

// All transportation routes require authentication
router.use(ensureAuthenticated);

/**
 * GET /api/v1/transportation/trips/:tripId
 * Get all transportation for a trip
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
 * Get transportation details
 */
router.get('/:id', async (req, res) => {
  try {
    const { Transportation, TravelCompanion, ItemCompanion } = require('../../../models');
    const trans = await Transportation.findByPk(req.params.id);

    if (!trans) {
      return apiResponse.notFound(res, 'Transportation not found');
    }

    // Get companions for this transportation
    const itemCompanions = await ItemCompanion.findAll({
      where: { itemType: 'transportation', itemId: trans.id },
      include: [
        {
          model: TravelCompanion,
          as: 'companion',
          attributes: ['id', 'email', 'firstName', 'lastName', 'name'],
        },
      ],
    });

    // Add companions to response
    const transData = trans.toJSON();
    transData.itemCompanions = itemCompanions.map((ic) => ({
      id: ic.companion.id,
      email: ic.companion.email,
      firstName: ic.companion.firstName,
      lastName: ic.companion.lastName,
      name: ic.companion.name,
      inheritedFromTrip: ic.inheritedFromTrip,
    }));

    return apiResponse.success(res, transData, 'Transportation retrieved successfully');
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
    const { Transportation } = require('../../../models');

    // Transform form data to match model
    const transData = {
      ...req.body,
      userId: req.user.id,
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
 * Auto-adds trip-level companions to the new transportation
 */
router.post('/trips/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    const { Trip } = require('../../../models');
    const { Transportation } = require('../../../models');
    const itemCompanionHelper = require('../../../utils/itemCompanionHelper');

    // Verify trip belongs to user
    const trip = await Trip.findOne({
      where: { id: tripId, userId: req.user.id },
    });

    if (!trip) {
      return apiResponse.forbidden(res, 'Access denied');
    }

    // Transform form data to match model
    const transData = {
      ...req.body,
      tripId,
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
 * Update transportation
 */
router.put('/:id', async (req, res) => {
  try {
    const { Transportation } = require('../../../models');
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
    const { Transportation } = require('../../../models');
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
