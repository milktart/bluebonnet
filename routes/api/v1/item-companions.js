/**
 * API v1 Item Companions Routes
 * RESTful JSON API for managing companions associated with individual items
 */

const express = require('express');
const apiResponse = require('../../../utils/apiResponse');
const { ensureAuthenticated } = require('../../../middleware/auth');
const itemCompanionService = require('../../../services/itemCompanionService');

const router = express.Router();

// Handle CORS preflight requests
router.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// All item companion routes require authentication
router.use(ensureAuthenticated);

/**
 * PUT /api/v1/item-companions/:itemType/:itemId
 * Update companions for an item
 * Body: { companionIds: ['id1', 'id2', ...] }
 */
router.put('/:itemType/:itemId', async (req, res) => {
  try {
    const { itemType, itemId } = req.params;
    const { companionIds } = req.body;

    // Validate itemType
    const validItemTypes = ['flight', 'hotel', 'transportation', 'car_rental', 'event'];
    if (!validItemTypes.includes(itemType)) {
      return apiResponse.badRequest(res, `Invalid item type: ${itemType}`);
    }

    // Validate companionIds is an array
    if (!Array.isArray(companionIds)) {
      return apiResponse.badRequest(res, 'companionIds must be an array');
    }

    // Update companions for the item
    await itemCompanionService.updateItemCompanions(itemId, itemType, companionIds, req.user.id);

    return apiResponse.success(
      res,
      { itemType, itemId, companionIds },
      'Item companions updated successfully'
    );
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to update item companions', error);
  }
});

module.exports = router;
