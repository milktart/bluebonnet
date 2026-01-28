/**
 * Item Creation Helper
 * Shared logic for creating travel items (Flight, Hotel, Event, etc.)
 * Reduces duplication across item controllers while keeping them readable
 */

const itemTripService = require('../../services/itemTripService');
const itemCompanionService = require('../../services/itemCompanionService');

/**
 * Add item to trip and handle companions
 * Called after model instance is created in each controller's createItem method
 * @param {Object} params - Parameters
 * @param {string} params.itemType - Type of item ('flight', 'hotel', 'event', etc.)
 * @param {Object} params.item - The created model instance
 * @param {string} params.tripId - Trip ID (optional)
 * @param {string} params.userId - User ID
 * @param {Array|string} params.companions - Companions array (optional)
 */
async function finalizItemCreation(params) {
  const { itemType, item, tripId, userId, companions } = params;

  // Add item to trip via ItemTrip junction table
  if (tripId) {
    try {
      await itemTripService.addItemToTrip(itemType, item.id, tripId, userId);
    } catch (e) {
      // Don't fail item creation due to ItemTrip errors
      const logger = require('../../utils/logger');
      logger.error(`Error adding ${itemType} to trip:`, e);
    }
  }

  // Handle companions - unified method
  if (companions) {
    try {
      await itemCompanionService.handleItemCompanions(
        itemType,
        item.id,
        companions,
        tripId,
        userId
      );
    } catch (e) {
      const logger = require('../../utils/logger');
      logger.error(`Error managing companions for ${itemType}:`, e);
    }
  }
}

module.exports = {
  finalizItemCreation,
};
