/**
 * API v1 Item Trips Routes
 * RESTful JSON API for managing item-to-trip relationships (many-to-many)
 */

const express = require('express');
const { body, param } = require('express-validator');
const itemTripController = require('../../../controllers/itemTripController');
const { ensureAuthenticated } = require('../../../middleware/auth');
const { attachAuthService } = require('../../../middleware/authorization');

const router = express.Router();

// All item-trip routes require authentication
router.use(ensureAuthenticated);

// Attach authorization service for item-trip checks
router.use(attachAuthService);

// Validation middleware
const itemTypeValidation = [
  param('itemType').isIn(['flight', 'hotel', 'event', 'transportation', 'car_rental']),
];

const setItemTripsValidation = [body('tripIds').isArray().notEmpty(), body('tripIds.*').isUUID()];

/**
 * GET /api/v1/items/:itemType/:itemId/trips
 * Get all trips an item belongs to
 */
router.get('/items/:itemType/:itemId/trips', itemTypeValidation, itemTripController.getItemTrips);

/**
 * PUT /api/v1/items/:itemType/:itemId/trips
 * Set which trips an item belongs to (replaces all associations)
 */
router.put(
  '/items/:itemType/:itemId/trips',
  itemTypeValidation,
  setItemTripsValidation,
  itemTripController.setItemTrips
);

/**
 * POST /api/v1/items/:itemType/:itemId/trips/:tripId
 * Add item to a specific trip
 */
router.post(
  '/items/:itemType/:itemId/trips/:tripId',
  itemTypeValidation,
  itemTripController.addItemToTrip
);

/**
 * DELETE /api/v1/items/:itemType/:itemId/trips/:tripId
 * Remove item from a specific trip
 */
router.delete(
  '/items/:itemType/:itemId/trips/:tripId',
  itemTypeValidation,
  itemTripController.removeItemFromTrip
);

module.exports = router;
