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
 *
 * Returns companions created by user + companion profiles (where user was added by others)
 * Combines both directions of companion relationships with flags indicating direction
 *
 * @returns {Object} 200 OK response with companions array
 * @returns {Array} returns - Array of companion objects
 * @returns {string} returns[].id - Companion ID (UUID)
 * @returns {string} returns[].firstName - Companion first name
 * @returns {string} returns[].lastName - Companion last name
 * @returns {string} returns[].email - Companion email
 * @returns {boolean} returns[].youInvited - Whether you invited them
 * @returns {boolean} returns[].theyInvited - Whether they invited you
 *
 * @throws {401} Unauthorized - User not authenticated
 * @throws {500} Server error - Database error
 *
 * @requires authentication - User must be logged in
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
      attributes: ['id', 'firstName', 'lastName', 'email'],
      raw: true,
    });

    // Fetch companion profiles (where user was added by others)
    const companionProfiles = await TravelCompanion.findAll({
      where: {
        userId,
        createdBy: { [Op.ne]: userId },
      },
      attributes: ['id', 'firstName', 'lastName', 'email'],
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
 * Get all companions associated with a specific trip
 *
 * Returns trip-level companions with their edit permissions
 * Validates that requesting user owns the trip
 *
 * @param {string} req.params.tripId - Trip ID (UUID)
 *
 * @returns {Object} 200 OK response with trip companions array
 * @returns {Array} returns - Array of companion objects
 * @returns {string} returns[].id - Relationship ID (TripCompanion)
 * @returns {string} returns[].tripId - Associated trip ID
 * @returns {string} returns[].companionId - Companion ID
 * @returns {string} returns[].permissionSource - How permission was granted
 * @returns {Object} returns[].companion - Companion details
 * @returns {string} returns[].companion.id - Companion ID
 * @returns {string} returns[].companion.email - Companion email
 * @returns {string} returns[].companion.firstName - First name
 * @returns {string} returns[].companion.lastName - Last name
 * @returns {string} returns[].companion.name - Full name
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
 * Get detailed information about a companion
 *
 * @param {string} req.params.id - Companion ID (UUID)
 *
 * @returns {Object} 200 OK response with companion details
 * @returns {string} returns.id - Companion ID
 * @returns {string} returns.email - Companion email address
 * @returns {string} returns.firstName - Companion first name
 * @returns {string} returns.lastName - Companion last name
 * @returns {string} returns.name - Full name
 * @returns {string} [returns.phone] - Phone number if available
 * @returns {string} [returns.avatar] - Avatar URL if available
 * @returns {string} returns.createdAt - Creation timestamp (ISO format)
 * @returns {string} returns.updatedAt - Last update timestamp (ISO format)
 *
 * @throws {401} Unauthorized - User not authenticated
 * @throws {404} Not found - Companion not found
 * @throws {500} Server error - Database error
 *
 * @requires authentication - User must be logged in
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
 * PUT /api/v1/companions/:id/permissions
 * Update companion permissions (canShareTrips, canManageTrips)
 *
 * @param {string} req.params.id - Companion ID (UUID)
 * @param {Object} req.body - Request body
 * @param {boolean} [req.body.canShareTrips] - Whether to share trips with companion
 * @param {boolean} [req.body.canManageTrips] - Whether to allow companion to manage trips
 *
 * @returns {Object} 200 OK response
 * @returns {boolean} returns.success - Always true
 * @returns {Object} returns.data - Updated permission data
 * @returns {string} returns.data.companionId - Companion ID
 * @returns {boolean} returns.data.canShareTrips - Share trips flag
 * @returns {boolean} returns.data.canManageTrips - Manage trips flag
 *
 * @throws {401} Unauthorized - User not authenticated
 * @throws {404} Not found - Companion not found
 * @throws {500} Server error - Database error
 *
 * @requires authentication - User must be logged in and be the companion creator
 */
router.put('/:id/permissions', async (req, res) => {
  try {
    const companionController = require('../../../controllers/companionController');
    return companionController.updateCompanionPermissions(req, res);
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to update permissions', error);
  }
});

/**
 * POST /api/v1/companions/trips/:tripId
 * Add a companion to a trip
 *
 * Creates trip-level companion relationship and automatically adds companion to all existing items
 * Handles cascading companion assignment with optional edit permissions
 *
 * @param {string} req.params.tripId - Trip ID (UUID)
 * @param {Object} req.body - Request body
 * @param {string} req.body.companionId - Companion ID to add
 *
 * @returns {Object} 201 Created response with companion relationship
 * @returns {string} returns.id - Companion ID
 * @returns {string} returns.email - Companion email
 * @returns {string} returns.firstName - Companion first name
 * @returns {string} returns.lastName - Companion last name
 *
 * @throws {400} Bad request - Invalid companion ID
 * @throws {401} Unauthorized - User not authenticated
 * @throws {403} Forbidden - User does not own the trip
 * @throws {404} Not found - Trip or companion not found
 * @throws {409} Conflict - Companion already added to trip
 * @throws {500} Server error - Database or item assignment failure
 *
 * @requires authentication - User must be logged in
 */
router.post('/trips/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    const { companionId } = req.body;
    const { TripCompanion } = require('../../../models');
    const { TravelCompanion } = require('../../../models');
    const { Trip } = require('../../../models');
    const itemCompanionHelper = require('../../../utils/itemCompanionHelper');

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

    // Add companion to trip
    try {
      const tripCompanion = await TripCompanion.create({
        tripId,
        companionId,
        addedBy: req.user.id,
        canAddItems: false,
        permissionSource: 'explicit',
      });

      // Auto-add companion to all existing items in the trip
      await itemCompanionHelper.addCompanionToAllItems(companionId, tripId, req.user.id);

      // Return the companion data with trip-specific info
      const result = {
        id: companion.id,
        email: companion.email,
        firstName: companion.firstName,
        lastName: companion.lastName,
      };

      return apiResponse.created(res, result, 'Companion added successfully');
    } catch (createError) {
      // Check if this is a unique constraint violation (duplicate companion)
      if (createError.name === 'SequelizeUniqueConstraintError') {
        return apiResponse.conflict(res, `${companion.email} is already added to this trip`);
      }
      throw createError;
    }
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to add companion', error);
  }
});

/**
 * DELETE /api/v1/companions/trips/:tripId/:companionId
 * Remove a companion from a trip
 *
 * Removes trip-level relationship and cascades deletion from all trip items
 * Only removes item-level assignments that were inherited from trip level
 *
 * @param {string} req.params.tripId - Trip ID (UUID)
 * @param {string} req.params.companionId - Companion ID to remove
 *
 * @returns {Object} 204 No Content - successful deletion (no response body)
 *
 * @throws {401} Unauthorized - User not authenticated
 * @throws {403} Forbidden - User does not own the trip
 * @throws {404} Not found - Trip, companion, or trip companion relationship not found
 * @throws {500} Server error - Database or item removal failure
 *
 * @requires authentication - User must be logged in
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
