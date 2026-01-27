/**
 * Item Trip Controller
 * API endpoints for managing item-trip relationships
 */

const { validationResult } = require('express-validator');
const ItemTripService = require('../services/itemTripService');
const { Trip } = require('../models');
const logger = require('../utils/logger');

const itemTripService = new ItemTripService();

/**
 * GET /api/items/:itemType/:itemId/trips
 * Get all trips an item belongs to
 */
exports.getItemTrips = async (req, res) => {
  try {
    const { itemType, itemId } = req.params;

    const itemTrips = await itemTripService.getItemTrips(itemType, itemId);

    res.json({ success: true, trips: itemTrips });
  } catch (error) {
    logger.error('GET_ITEM_TRIPS_ERROR', { error: error.message });
    res.status(500).json({ success: false, error: 'Error fetching item trips' });
  }
};

/**
 * PUT /api/items/:itemType/:itemId/trips
 * Set which trips an item belongs to
 */
exports.setItemTrips = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { itemType, itemId } = req.params;
    const { tripIds } = req.body;

    // Verify user has access to all trips
    for (const tripId of tripIds) {
      const trip = await Trip.findByPk(tripId);
      if (!trip || trip.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied to one or more trips',
        });
      }
    }

    const itemTrips = await itemTripService.setItemTrips(itemType, itemId, tripIds, req.user.id);

    res.json({ success: true, trips: itemTrips });
  } catch (error) {
    logger.error('SET_ITEM_TRIPS_ERROR', { error: error.message });
    res.status(500).json({ success: false, error: 'Error updating item trips' });
  }
};

/**
 * POST /api/items/:itemType/:itemId/trips/:tripId
 * Add item to a trip
 */
exports.addItemToTrip = async (req, res) => {
  try {
    const { itemType, itemId, tripId } = req.params;

    // Verify trip exists and user has access
    const trip = await Trip.findByPk(tripId);
    if (!trip || trip.userId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const itemTrip = await itemTripService.addItemToTrip(itemType, itemId, tripId, req.user.id);

    res.status(201).json({ success: true, itemTrip });
  } catch (error) {
    logger.error('ADD_ITEM_TO_TRIP_ERROR', { error: error.message });

    if (error.message.includes('already on trip')) {
      return res.status(409).json({ success: false, error: error.message });
    }

    res.status(500).json({ success: false, error: 'Error adding item to trip' });
  }
};

/**
 * DELETE /api/items/:itemType/:itemId/trips/:tripId
 * Remove item from a trip
 */
exports.removeItemFromTrip = async (req, res) => {
  try {
    const { itemType, itemId, tripId } = req.params;

    // Verify trip exists and user has access
    const trip = await Trip.findByPk(tripId);
    if (!trip || trip.userId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const success = await itemTripService.removeItemFromTrip(itemType, itemId, tripId);

    if (!success) {
      return res.status(404).json({ success: false, error: 'Item not found on trip' });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('REMOVE_ITEM_FROM_TRIP_ERROR', { error: error.message });
    res.status(500).json({ success: false, error: 'Error removing item from trip' });
  }
};
