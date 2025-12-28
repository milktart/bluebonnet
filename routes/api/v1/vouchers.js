/**
 * API v1 Vouchers Routes
 * RESTful JSON API for voucher management
 */

const express = require('express');
const apiResponse = require('../../../utils/apiResponse');
const { ensureAuthenticated } = require('../../../middleware/auth');

const router = express.Router();

// Handle CORS preflight requests
router.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", req.get("Origin") || "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie");
  res.header("Access-Control-Allow-Credentials", "true");
  res.sendStatus(200);
});


// All voucher routes require authentication
router.use(ensureAuthenticated);

/**
 * GET /api/v1/vouchers/trips/:tripId
 * Get all vouchers for a trip
 */
router.get('/trips/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    const Voucher = require('../../../models').Voucher;
    const Trip = require('../../../models').Trip;

    // Verify trip belongs to user
    const trip = await Trip.findOne({
      where: { id: tripId, userId: req.user.id }
    });

    if (!trip) {
      return apiResponse.forbidden(res, 'Access denied');
    }

    const vouchers = await Voucher.findAll({
      where: { tripId },
      order: [['createdAt', 'DESC']]
    });

    return apiResponse.success(res, vouchers, `Retrieved ${vouchers.length} vouchers`);
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to retrieve vouchers', error);
  }
});

/**
 * GET /api/v1/vouchers/:id
 * Get voucher details
 */
router.get('/:id', async (req, res) => {
  try {
    const Voucher = require('../../../models').Voucher;
    const voucher = await Voucher.findByPk(req.params.id);

    if (!voucher) {
      return apiResponse.notFound(res, 'Voucher not found');
    }

    return apiResponse.success(res, voucher, 'Voucher retrieved successfully');
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to retrieve voucher', error);
  }
});

/**
 * POST /api/v1/vouchers/trips/:tripId
 * Create a voucher for a trip
 */
router.post('/trips/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    const Trip = require('../../../models').Trip;
    const Voucher = require('../../../models').Voucher;

    // Verify trip belongs to user
    const trip = await Trip.findOne({
      where: { id: tripId, userId: req.user.id }
    });

    if (!trip) {
      return apiResponse.forbidden(res, 'Access denied');
    }

    // Create voucher
    const voucher = await Voucher.create({
      ...req.body,
      tripId,
      createdBy: req.user.id
    });

    return apiResponse.created(res, voucher, 'Voucher created successfully');
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to create voucher', error);
  }
});

/**
 * PUT /api/v1/vouchers/:id
 * Update a voucher
 */
router.put('/:id', async (req, res) => {
  try {
    const Voucher = require('../../../models').Voucher;
    const voucher = await Voucher.findByPk(req.params.id);

    if (!voucher) {
      return apiResponse.notFound(res, 'Voucher not found');
    }

    // Update voucher
    const updated = await voucher.update(req.body);

    return apiResponse.success(res, updated, 'Voucher updated successfully');
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to update voucher', error);
  }
});

/**
 * DELETE /api/v1/vouchers/:id
 * Delete a voucher
 */
router.delete('/:id', async (req, res) => {
  try {
    const Voucher = require('../../../models').Voucher;
    const voucher = await Voucher.findByPk(req.params.id);

    if (!voucher) {
      return apiResponse.notFound(res, 'Voucher not found');
    }

    await voucher.destroy();

    return apiResponse.noContent(res);
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to delete voucher', error);
  }
});

module.exports = router;
