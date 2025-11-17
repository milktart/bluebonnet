/**
 * API v1 Routes
 * Base router for all v1 API endpoints
 * Phase 3 - API Versioning
 */

const express = require('express');

const router = express.Router();

// Import v1 route modules
const tripsRoutes = require('./trips');

// Mount route modules
router.use('/trips', tripsRoutes);

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
