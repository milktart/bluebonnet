/**
 * API v1 Companions Routes
 * RESTful JSON API for companion management
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

// All companion routes require authentication
router.use(ensureAuthenticated);

/**
 * GET /api/v1/companions/all
 * Get all available companions for the current user
 * Returns companions created by user + companion profiles (where user was added)
 */
router.get('/all', async (req, res) => {
  try {
    const { TravelCompanion } = require('../../../models');
    const { Op } = require('sequelize');
    const userId = req.user.id;

    // Fetch companions created by user
    const companionsCreated = await TravelCompanion.findAll({
      where: {
        createdBy: userId,
        [Op.or]: [{ userId: null }, { userId: { [Op.ne]: userId } }],
      },
      attributes: ['id', 'firstName', 'lastName', 'email', 'canBeAddedByOthers'],
      raw: true,
    });

    // Fetch companion profiles (where user was added by others)
    const companionProfiles = await TravelCompanion.findAll({
      where: {
        userId,
        createdBy: { [Op.ne]: userId },
      },
      attributes: ['id', 'firstName', 'lastName', 'email', 'canBeAddedByOthers'],
      raw: true,
    });

    // Build combined list with direction indicators
    const companionMap = new Map();

    // Add created companions
    companionsCreated.forEach((companion) => {
      const { email } = companion;
      if (!companionMap.has(email)) {
        companionMap.set(email, {
          id: companion.id,
          firstName: companion.firstName,
          lastName: companion.lastName,
          email: companion.email,
          youInvited: true,
          theyInvited: false,
          canBeAddedByOthers: companion.canBeAddedByOthers,
        });
      } else {
        const existing = companionMap.get(email);
        existing.youInvited = true;
      }
    });

    // Add companion profiles
    companionProfiles.forEach((profile) => {
      const { email } = profile;
      if (!companionMap.has(email)) {
        companionMap.set(email, {
          id: profile.id,
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          youInvited: false,
          theyInvited: true,
          canBeAddedByOthers: profile.canBeAddedByOthers,
        });
      } else {
        const existing = companionMap.get(email);
        existing.theyInvited = true;
      }
    });

    const companionsList = Array.from(companionMap.values());
    return apiResponse.success(
      res,
      companionsList,
      `Retrieved ${companionsList.length} companions`
    );
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to retrieve companions', error);
  }
});

/**
 * GET /api/v1/companions/trips/:tripId
 * Get all companions for a trip
 */
router.get('/trips/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    const { TripCompanion } = require('../../../models');
    const { TravelCompanion } = require('../../../models');
    const { Trip } = require('../../../models');

    // Verify trip belongs to user
    const trip = await Trip.findOne({
      where: { id: tripId, userId: req.user.id },
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
          attributes: ['id', 'name', 'email', 'phone'],
        },
      ],
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
    const { TravelCompanion } = require('../../../models');
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
 * Also automatically adds the companion to all existing items in the trip
 */
router.post('/trips/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    const { companionId, canEdit } = req.body;
    const { TripCompanion } = require('../../../models');
    const { TravelCompanion } = require('../../../models');
    const { Trip } = require('../../../models');
    const itemCompanionHelper = require('../../../utils/itemCompanionHelper');

    console.log('[Add Companion] Request params:', { tripId, companionId, canEdit });

    // Verify trip belongs to user
    const trip = await Trip.findOne({
      where: { id: tripId, userId: req.user.id },
    });

    if (!trip) {
      return apiResponse.forbidden(res, 'Access denied');
    }

    // Verify companion exists
    const companion = await TravelCompanion.findByPk(companionId);
    if (!companion) {
      return apiResponse.notFound(res, 'Companion not found');
    }

    console.log('[Add Companion] Found companion:', {
      companionId: companion.id,
      email: companion.email,
    });

    // Add companion to trip
    try {
      const tripCompanion = await TripCompanion.create({
        tripId,
        companionId,
        canEdit: canEdit || false,
        addedBy: req.user.id,
        canAddItems: false,
        permissionSource: 'explicit',
      });

      console.log('[Add Companion] Successfully created TripCompanion:', tripCompanion.dataValues);

      // Auto-add companion to all existing items in the trip
      await itemCompanionHelper.addCompanionToAllItems(companionId, tripId, req.user.id);
      console.log('[Add Companion] Successfully added companion to all items in trip');

      // Return the companion data with trip-specific info
      const result = {
        id: companion.id,
        email: companion.email,
        firstName: companion.firstName,
        lastName: companion.lastName,
        canEdit: tripCompanion.canEdit,
      };

      return apiResponse.created(res, result, 'Companion added successfully');
    } catch (createError) {
      // Check if this is a unique constraint violation (duplicate companion)
      if (createError.name === 'SequelizeUniqueConstraintError') {
        console.log('[Add Companion] Duplicate companion for trip:', { tripId, companionId });
        return apiResponse.conflict(res, `${companion.email} is already added to this trip`);
      }
      throw createError;
    }
  } catch (error) {
    console.error('[Add Companion Error]', {
      message: error.message,
      name: error.name,
      validationErrors: error.errors,
      stack: error.stack,
    });
    return apiResponse.internalError(res, 'Failed to add companion', error);
  }
});

/**
 * DELETE /api/v1/companions/trips/:tripId/:companionId
 * Remove a companion from a trip
 * Also removes the companion from all items in the trip (those inherited from trip level)
 */
router.delete('/trips/:tripId/:companionId', async (req, res) => {
  try {
    const { tripId, companionId } = req.params;
    const { TripCompanion } = require('../../../models');
    const { Trip } = require('../../../models');
    const itemCompanionHelper = require('../../../utils/itemCompanionHelper');

    // Verify trip belongs to user
    const trip = await Trip.findOne({
      where: { id: tripId, userId: req.user.id },
    });

    if (!trip) {
      return apiResponse.forbidden(res, 'Access denied');
    }

    // Remove companion from trip
    const deleted = await TripCompanion.destroy({
      where: { tripId, companionId },
    });

    if (!deleted) {
      return apiResponse.notFound(res, 'Trip companion not found');
    }

    // Auto-remove companion from all items in trip (those inherited from trip level)
    await itemCompanionHelper.removeCompanionFromAllItems(companionId, tripId);

    return apiResponse.noContent(res);
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to remove companion', error);
  }
});

module.exports = router;
