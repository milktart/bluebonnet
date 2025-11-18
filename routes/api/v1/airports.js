/**
 * API v1 - Airport Routes
 * AJAX endpoints for airport autocomplete and lookup
 */

const express = require('express');
const airportService = require('../../../services/airportService');
const logger = require('../../../utils/logger');

const router = express.Router();

/**
 * GET /api/v1/airports/search
 * Search airports by query string (IATA code, name, or city)
 * Used for autocomplete in flight forms
 *
 * Query params:
 *   - q: search query (required, min 2 chars)
 *   - limit: max results (optional, default 10)
 *
 * Returns: Array of airport objects with format:
 *   [{ iata, name, city, country, timezone, ... }]
 */
router.get('/search', async (req, res) => {
  try {
    const { q: query, limit } = req.query;

    // Validate query parameter
    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required and must be at least 2 characters',
      });
    }

    // Parse limit with default and bounds
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);

    // Search airports using service
    const airports = await airportService.searchAirports(query, parsedLimit);

    // Return results
    return res.json({
      success: true,
      query,
      count: airports.length,
      airports,
    });
  } catch (error) {
    logger.error('Error in airport search API', { error: error.message, query: req.query });
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/v1/airports/:iata
 * Get airport details by IATA code
 *
 * Params:
 *   - iata: 3-letter IATA code (e.g., "JFK")
 *
 * Returns: Airport object or 404 if not found
 */
router.get('/:iata', async (req, res) => {
  try {
    const { iata } = req.params;

    // Validate IATA code format
    if (!iata || !/^[A-Z]{3}$/i.test(iata)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid IATA code. Must be 3 letters.',
      });
    }

    // Get airport by code
    const airport = await airportService.getAirportByCode(iata);

    if (!airport) {
      return res.status(404).json({
        success: false,
        error: 'Airport not found',
      });
    }

    return res.json({
      success: true,
      airport,
    });
  } catch (error) {
    logger.error('Error in airport lookup API', { error: error.message, iata: req.params.iata });
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

module.exports = router;
