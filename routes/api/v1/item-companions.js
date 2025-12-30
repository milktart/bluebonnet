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
 * Update companion assignments for a specific travel item
 *
 * Replaces all companions for the item with the provided list
 * Supports flights, hotels, events, transportation, and car rentals
 *
 * @param {string} req.params.itemType - Type of travel item
 *   - Valid values: 'flight', 'hotel', 'event', 'transportation', 'car_rental'
 * @param {string} req.params.itemId - Item ID (UUID)
 * @param {Object} req.body - Request body
 * @param {Array<string>} req.body.companionIds - Array of companion IDs to assign
 *
 * @returns {Object} 200 OK response with updated assignment
 * @returns {string} returns.itemType - The item type
 * @returns {string} returns.itemId - The item ID
 * @returns {Array<string>} returns.companionIds - The assigned companion IDs
 *
 * @throws {400} Bad request - Invalid item type or companionIds is not an array
 * @throws {401} Unauthorized - User not authenticated
 * @throws {404} Not found - Item not found
 * @throws {500} Server error - Database error
 *
 * @requires authentication - User must be logged in
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
