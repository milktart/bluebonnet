/**
 * Geocoding API v1 Routes
 * Provides geocoding and timezone inference endpoints
 */

const express = require('express');
const logger = require('../../../utils/logger');
const { geocodeLocation, inferTimezone } = require('../../../services/geocodingService');

const router = express.Router();

/**
 * GET /api/v1/geocode
 * Geocode an address and return coordinates and timezone
 * Query params: address (required)
 */
router.get('/', async (req, res) => {
  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Address parameter is required',
      });
    }

    // Geocode the address to get coordinates
    const coords = await geocodeLocation(address);

    if (!coords) {
      return res.status(404).json({
        success: false,
        error: 'Could not geocode address',
      });
    }

    // Infer timezone from coordinates
    let timezone = null;
    try {
      timezone = await inferTimezone(coords.lat, coords.lng);
    } catch (error) {
      logger.warn('Could not infer timezone:', error.message);
      // Return coordinates even if timezone inference fails
    }

    return res.json({
      success: true,
      address,
      lat: coords.lat,
      lng: coords.lng,
      timezone: timezone || 'UTC',
    });
  } catch (error) {
    logger.error('Error in geocoding API:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

module.exports = router;
