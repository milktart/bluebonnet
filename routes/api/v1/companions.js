/**
 * API v1 Companions Routes
 * RESTful JSON API for companion management
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


// All companion routes require authentication
router.use(ensureAuthenticated);

/**
 * GET /api/v1/companions/trips/:tripId
 * Get all companions for a trip
 */
router.get('/trips/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    const TripCompanion = require('../../../models').TripCompanion;
    const TravelCompanion = require('../../../models').TravelCompanion;
    const Trip = require('../../../models').Trip;

    // Verify trip belongs to user
    const trip = await Trip.findOne({
      where: { id: tripId, userId: req.user.id }
    });

    if (!trip) {
      return apiResponse.forbidden(res, 'Access denied');
    }

    const companions = await TripCompanion.findAll({
      where: { tripId },
      include: [
        {
          model: TravelCompanion,
          as: 'companion',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ]
    });

    return apiResponse.success(res, companions, `Retrieved ${companions.length} companions`);
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to retrieve companions', error);
  }
});

/**
 * GET /api/v1/companions/:id
 * Get companion details
 */
router.get('/:id', async (req, res) => {
  try {
    const TravelCompanion = require('../../../models').TravelCompanion;
    const companion = await TravelCompanion.findByPk(req.params.id);

    if (!companion) {
      return apiResponse.notFound(res, 'Companion not found');
    }

    return apiResponse.success(res, companion, 'Companion retrieved successfully');
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to retrieve companion', error);
  }
});

/**
 * POST /api/v1/companions/trips/:tripId
 * Add a companion to a trip
 */
router.post('/trips/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    const { companionId, canEdit } = req.body;
    const TripCompanion = require('../../../models').TripCompanion;
    const Trip = require('../../../models').Trip;

    // Verify trip belongs to user
    const trip = await Trip.findOne({
      where: { id: tripId, userId: req.user.id }
    });

    if (!trip) {
      return apiResponse.forbidden(res, 'Access denied');
    }

    // Add companion to trip
    const tripCompanion = await TripCompanion.create({
      tripId,
      companionId,
      canEdit: canEdit || false,
      addedBy: req.user.id
    });

    return apiResponse.created(res, tripCompanion, 'Companion added successfully');
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to add companion', error);
  }
});

/**
 * DELETE /api/v1/companions/trips/:tripId/:companionId
 * Remove a companion from a trip
 */
router.delete('/trips/:tripId/:companionId', async (req, res) => {
  try {
    const { tripId, companionId } = req.params;
    const TripCompanion = require('../../../models').TripCompanion;
    const Trip = require('../../../models').Trip;

    // Verify trip belongs to user
    const trip = await Trip.findOne({
      where: { id: tripId, userId: req.user.id }
    });

    if (!trip) {
      return apiResponse.forbidden(res, 'Access denied');
    }

    // Remove companion from trip
    const deleted = await TripCompanion.destroy({
      where: { tripId, companionId }
    });

    if (!deleted) {
      return apiResponse.notFound(res, 'Trip companion not found');
    }

    return apiResponse.noContent(res);
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to remove companion', error);
  }
});

module.exports = router;
