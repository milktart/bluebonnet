const express = require('express');
const logger = require('../utils/logger');
const tripService = require('../services/tripService');
const itemCompanionService = require('../services/itemCompanionService');

const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');

// Allow CORS preflight requests to pass through without authentication
router.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Mount API v1 routes
const v1Routes = require('./api/v1');

router.use('/v1', v1Routes);

// Companion and item-specific API endpoints
router.use(ensureAuthenticated);

// API endpoint to fetch trip data (for async form refresh)
router.get('/trips/:id', async (req, res) => {
  try {
    const trip = await tripService.getTripData(req.params.id, req.user.id);
    res.json(trip);
  } catch (error) {
    logger.error('Error fetching trip data:', error);
    const statusCode = error.status || 500;
    res.status(statusCode).json({
      error: error.message || 'Error fetching trip data',
    });
  }
});

// API endpoint to fetch trip companions
router.get('/trips/:id/companions', async (req, res) => {
  try {
    const companions = await tripService.getTripCompanions(
      req.params.id,
      req.user.id,
      req.user.email
    );

    res.json({
      success: true,
      data: companions,
    });
  } catch (error) {
    logger.error('Error fetching trip companions:', error);
    const statusCode = error.status || 500;
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Error fetching trip companions',
    });
  }
});

// API endpoint to fetch item companions
router.get('/items/:itemType/:itemId/companions', async (req, res) => {
  try {
    const { itemType, itemId } = req.params;
    const companions = await itemCompanionService.getItemCompanions(
      itemId,
      itemType,
      req.user.email
    );

    res.json({
      success: true,
      data: companions,
    });
  } catch (error) {
    logger.error('Error fetching item companions:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching item companions',
    });
  }
});

// API endpoint to update item companions
router.put('/items/:itemType/:itemId/companions', async (req, res) => {
  try {
    const { itemType, itemId } = req.params;
    const { companionIds } = req.body;

    const result = await itemCompanionService.updateItemCompanions(
      itemId,
      itemType,
      companionIds,
      req.user.id
    );

    res.json(result);
  } catch (error) {
    logger.error('Error updating item companions:', error);
    const statusCode = error.status || 500;
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Error updating item companions',
    });
  }
});

module.exports = router;
