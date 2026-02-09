const { ItemCompanion, TravelCompanion, Trip } = require('../models');
const { sortCompanions } = require('../utils/companionSortingService');
const { ITEM_TYPE_MAP } = require('../constants/companionConstants');
const logger = require('../utils/logger');
/**
 * Service for managing item companion assignments
 * Handles CRUD operations for companions attached to specific trip items
 * (flights, hotels, transportation, car rentals, events)
 */
class ItemCompanionService {
  /**
   * Get all companions assigned to a specific item
   * @param {string} itemId - UUID of the item
   * @param {string} itemType - Type of item (flight, hotel, transportation, car_rental, event)
   * @param {string} userEmail - Email of current user (for sorting self first)
   * @returns {Promise<Array>} Sorted list of companions
   */
  async getItemCompanions(itemId, itemType, userEmail) {
    try {
      const itemCompanions = await ItemCompanion.findAll({
        where: {
          itemType,
          itemId,
        },
        include: [
          {
            model: TravelCompanion,
            as: 'companion',
            attributes: ['id', 'name', 'email'],
          },
        ],
      });
      // Transform to simpler format
      const companionList = itemCompanions.map((ic) => ({
        id: ic.companion.id,
        name: ic.companion.name,
        email: ic.companion.email,
      }));
      // Sort companions: self first, then alphabetically by first name
      const sortedCompanionList = sortCompanions(companionList, userEmail, 'email');
      return sortedCompanionList;
    } catch (error) {
      logger.error('ItemCompanionService.getItemCompanions - Error:', error);
      throw error;
    }
  }

  /**
   * Update companions assigned to a specific item
   * @param {string} itemId - UUID of the item
   * @param {string} itemType - Type of item (flight, hotel, transportation, car_rental, event)
   * @param {Array<string>} companionIds - Array of companion UUIDs to assign
   * @param {string} userId - UUID of current user (for authorization and tracking)
   * @returns {Promise<Object>} Success result
   * @throws {Error} If item not found, unauthorized, or invalid input
   */
  async updateItemCompanions(itemId, itemType, companionIds, userId) {
    try {
      // Validate input
      if (!Array.isArray(companionIds)) {
        throw new Error('companionIds must be an array');
      }
      // Filter out virtual companion IDs (non-UUID display-only IDs from trip owner)
      const validCompanionIds = companionIds.filter(
        (id) => !String(id).startsWith('virtual-companion-')
      );
      // Get the item model based on type
      const itemModel = ItemCompanionService._getItemModel(itemType);
      if (!itemModel) {
        throw new Error('Invalid itemType');
      }
      // Verify item exists
      const item = await itemModel.findOne({ where: { id: itemId } });
      if (!item) {
        const error = new Error('Item not found');
        error.status = 404;
        throw error;
      }
      // Verify user owns the item or the trip containing this item
      if (item.tripId) {
        // Trip-associated item: verify user owns the trip
        const trip = await Trip.findOne({
          where: { id: item.tripId, userId },
        });
        if (!trip) {
          const error = new Error('Not authorized to modify this item');
          error.status = 403;
          throw error;
        }
      } else if (item.userId !== userId) {
        // Standalone item: verify user owns the item directly
        const error = new Error('Not authorized to modify this item');
        error.status = 403;
        throw error;
      }
      // Get existing companions
      const existingCompanions = await ItemCompanion.findAll({
        where: { itemType, itemId },
      });
      const existingIds = existingCompanions.map((ic) => ic.companionId);
      // Remove companions that are no longer in the list
      const toRemove = existingIds.filter((id) => !validCompanionIds.includes(id));
      if (toRemove.length > 0) {
        await ItemCompanion.destroy({
          where: {
            itemType,
            itemId,
            companionId: toRemove,
          },
        });
      }
      // Add new companions that aren't already there
      const toAdd = validCompanionIds.filter((id) => !existingIds.includes(id));
      if (toAdd.length > 0) {
        const newCompanions = toAdd.map((companionId) => ({
          itemType,
          itemId,
          companionId,
          status: 'attending',
          addedBy: userId,
          inheritedFromTrip: false,
        }));
        await ItemCompanion.bulkCreate(newCompanions);
      }
      logger.info('ItemCompanionService.updateItemCompanions - Success', {
        itemId,
        itemType,
        added: toAdd.length,
        removed: toRemove.length,
      });
      return {
        success: true,
        message: 'Item companions updated successfully',
        changes: {
          added: toAdd.length,
          removed: toRemove.length,
        },
      };
    } catch (error) {
      logger.error('ItemCompanionService.updateItemCompanions - Error:', error);
      throw error;
    }
  }

  /**
   * Handle companion assignment for a newly created or updated item
   * This is the unified method called from all controllers to avoid duplication
   * @param {string} itemType - Type of item (flight, hotel, event, transportation, carRental)
   * @param {string} itemId - UUID of the item
   * @param {Array<string>|string} companions - Companion IDs (can be array, JSON string, or single ID)
   * @param {string} tripId - Optional trip ID (for auto-adding trip companions)
   * @param {string} userId - UUID of user making the change
   * @returns {Promise<void>}
   * @example
   * // Called from controller after item creation:
   * await itemCompanionService.handleItemCompanions('flight', flight.id, req.body.companions, tripId, req.user.id);
   */
  async handleItemCompanions(itemType, itemId, companions, tripId, userId) {
    try {
      // Parse companions input - could be array, JSON string, or single value
      let companionIds = [];

      if (companions) {
        try {
          if (typeof companions === 'string') {
            // Try to parse as JSON
            companionIds = JSON.parse(companions);
          } else if (Array.isArray(companions)) {
            companionIds = companions;
          } else {
            companionIds = [companions];
          }

          // Ensure it's an array and filter out empty values
          companionIds = Array.isArray(companionIds) ? companionIds.filter((c) => c) : [];
        } catch (e) {
          logger.warn('Error parsing companions, using empty array:', e);
          companionIds = [];
        }
      }

      // If companions explicitly provided, use them
      if (companionIds.length > 0) {
        await this.updateItemCompanions(itemId, itemType, companionIds, userId);
      } else if (tripId) {
        // Otherwise, auto-add all trip-level companions
        const tripCompanions = await ItemCompanion.sequelize.models.TripCompanion.findAll({
          where: { tripId },
          attributes: ['companionId'],
        });

        const tripCompanionIds = tripCompanions.map((tc) => tc.companionId);

        if (tripCompanionIds.length > 0) {
          // Create ItemCompanion records with inheritedFromTrip flag
          const itemCompanionRecords = tripCompanionIds.map((companionId) => ({
            itemType,
            itemId,
            companionId,
            status: 'attending',
            addedBy: userId,
            inheritedFromTrip: true,
          }));

          await ItemCompanion.bulkCreate(itemCompanionRecords, {
            ignoreDuplicates: true,
          });
        }
      }

      logger.info('handleItemCompanions - Success', {
        itemType,
        itemId,
        companionCount: companionIds.length,
        tripId,
      });
    } catch (error) {
      logger.error('ItemCompanionService.handleItemCompanions - Error:', error);
      // Don't throw - companion errors shouldn't fail item creation
      // Log for debugging but continue silently
    }
  }

  /**
   * Get the Sequelize model for a given item type
   * @private
   * @param {string} itemType - Type of item
   * @returns {Model|null} Sequelize model or null if invalid
   */
  static _getItemModel(itemType) {
    return ITEM_TYPE_MAP[itemType] || null;
  }
}
module.exports = new ItemCompanionService();
