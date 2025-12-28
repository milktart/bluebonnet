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
const vouchersRoutes = require('./vouchers');

// Mount route modules
router.use('/trips', tripsRoutes);
router.use('/flights', flightsRoutes);
router.use('/hotels', hotelsRoutes);
router.use('/events', eventsRoutes);
router.use('/transportation', transportationRoutes);
router.use('/car-rentals', carRentalsRoutes);
router.use('/companions', companionsRoutes);
router.use('/vouchers', vouchersRoutes);
router.use('/airports', airportsRoutes);
router.use('/geocode', geocodeRoutes);

// API health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API v1 is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

module.exports = router;
