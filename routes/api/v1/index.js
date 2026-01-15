/**
 * API v1 Routes
 * Base router for all v1 API endpoints
 * Phase 3 - API Versioning
 */

const express = require('express');

const router = express.Router();

// Handle CORS preflight requests BEFORE all other routes
router.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Import v1 route modules
const tripsRoutes = require('./trips');
const airportsRoutes = require('./airports');
const geocodeRoutes = require('./geocode');
const flightsRoutes = require('./flights');
const hotelsRoutes = require('./hotels');
const eventsRoutes = require('./events');
const transportationRoutes = require('./transportation');
const carRentalsRoutes = require('./car-rentals');
const companionsRoutes = require('./companions');
const itemCompanionsRoutes = require('./item-companions');
const companionPermissionsRoutes = require('./companion-permissions');
const itemTripsRoutes = require('./item-trips');
const vouchersRoutes = require('./vouchers');
const usersRoutes = require('./users');

// Mount route modules
router.use('/trips', tripsRoutes);
router.use('/flights', flightsRoutes);
router.use('/hotels', hotelsRoutes);
router.use('/events', eventsRoutes);
router.use('/transportation', transportationRoutes);
router.use('/car-rentals', carRentalsRoutes);
router.use('/companions', companionsRoutes);
router.use('/item-companions', itemCompanionsRoutes);
router.use('/user/companion-permissions', companionPermissionsRoutes);
router.use('/item-trips', itemTripsRoutes);
router.use('/vouchers', vouchersRoutes);
router.use('/airports', airportsRoutes);
router.use('/geocode', geocodeRoutes);
router.use('/users', usersRoutes);

/**
 * GET /api/v1/health
 * Check API health status
 *
 * No authentication required - useful for monitoring and load balancers
 *
 * @returns {Object} 200 OK response with health status
 * @returns {boolean} returns.success - Always true if endpoint responds
 * @returns {string} returns.message - Status message (e.g., "API v1 is healthy")
 * @returns {string} returns.timestamp - Current server timestamp in ISO format
 * @returns {string} returns.version - API version (e.g., "1.0.0")
 *
 * @example
 * GET /api/v1/health
 * Response: {
 *   "success": true,
 *   "message": "API v1 is healthy",
 *   "timestamp": "2025-12-30T12:34:56.789Z",
 *   "version": "1.0.0"
 * }
 *
 * @throws {500} Internal server error if database or critical services are down
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API v1 is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

module.exports = router;
