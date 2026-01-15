/**
 * Item Trip Service
 * Business logic for managing item-trip relationships
 *
 * Handles:
 * - Adding/removing items from trips
 * - Querying items by trip
 * - Managing multi-trip items
 */

const BaseService = require('./BaseService');
const { ItemTrip, Trip } = require('../models');
const logger = require('../utils/logger');

class ItemTripService extends BaseService {
  constructor() {
    super(ItemTrip, 'ItemTrip');
  }

  /**
   * Add item to trip
   * @param {string} itemType - Type of item ('flight', 'hotel', 'event', 'transportation', 'car_rental')
   * @param {string} itemId - Item ID
   * @param {string} tripId - Trip ID
   * @returns {Promise<Object>} Created ItemTrip record
   */
  async addItemToTrip(itemType, itemId, tripId) {
    logger.info(`${this.modelName}: Adding ${itemType} to trip`, {
      itemId,
      tripId,
    });

    // Verify trip exists
    const trip = await Trip.findByPk(tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    // Check if item already exists on trip
    const existing = await ItemTrip.findOne({
      where: {
        itemId,
        itemType,
        tripId,
      },
    });

    if (existing) {
      logger.warn(`${this.modelName}: Item already on trip`, {
        itemId,
        itemType,
        tripId,
      });
      throw new Error('This item is already on this trip');
    }

    // Create item-trip association
    const itemTrip = await ItemTrip.create({
      itemId,
      itemType,
      tripId,
    });

    logger.info(`${this.modelName}: Item added to trip`, {
      itemId,
      itemType,
      tripId,
    });

    return itemTrip;
  }

  /**
   * Remove item from trip (does not delete item)
   * @param {string} itemType - Type of item
   * @param {string} itemId - Item ID
   * @param {string} tripId - Trip ID
   * @returns {Promise<boolean>} Success
   */
  async removeItemFromTrip(itemType, itemId, tripId) {
    logger.info(`${this.modelName}: Removing ${itemType} from trip`, {
      itemId,
      tripId,
    });

    const result = await ItemTrip.destroy({
      where: {
        itemId,
        itemType,
        tripId,
      },
    });

    if (result === 0) {
      logger.warn(`${this.modelName}: Item not found on trip`, {
        itemId,
        itemType,
        tripId,
      });
      return false;
    }

    logger.info(`${this.modelName}: Item removed from trip`, {
      itemId,
      itemType,
      tripId,
    });

    return true;
  }

  /**
   * Get all trips an item belongs to
   * @param {string} itemType - Type of item
   * @param {string} itemId - Item ID
   * @returns {Promise<Array>} Array of trip IDs
   */
  async getItemTrips(itemType, itemId) {
    logger.debug(`${this.modelName}: Getting trips for ${itemType} ${itemId}`);

    const itemTrips = await ItemTrip.findAll({
      where: {
        itemId,
        itemType,
      },
      attributes: ['tripId'],
      include: [
        {
          model: Trip,
          as: 'trip',
          attributes: ['id', 'name', 'departureDate', 'returnDate'],
          required: false,
        },
      ],
      raw: false,
    });

    return itemTrips;
  }

  /**
   * Get all items in a trip
   * @param {string} tripId - Trip ID
   * @returns {Promise<Object>} Items grouped by type
   */
  async getTripItems(tripId) {
    logger.debug(`${this.modelName}: Getting items for trip ${tripId}`);

    const itemTrips = await ItemTrip.findAll({
      where: { tripId },
      order: [['createdAt', 'ASC']],
    });

    // Group by item type
    const itemsByType = {
      flight: [],
      hotel: [],
      event: [],
      transportation: [],
      car_rental: [],
    };

    itemTrips.forEach((it) => {
      if (itemsByType[it.itemType]) {
        itemsByType[it.itemType].push(it.itemId);
      }
    });

    return itemsByType;
  }

  /**
   * Set which trips an item belongs to (replaces existing associations)
   * @param {string} itemType - Type of item
   * @param {string} itemId - Item ID
   * @param {Array<string>} tripIds - Array of trip IDs
   * @returns {Promise<Array>} Created ItemTrip records
   */
  async setItemTrips(itemType, itemId, tripIds) {
    logger.info(`${this.modelName}: Setting trips for ${itemType}`, {
      itemId,
      tripCount: tripIds.length,
    });

    // Remove existing associations
    await ItemTrip.destroy({
      where: {
        itemId,
        itemType,
      },
    });

    // Create new associations
    const itemTrips = await ItemTrip.bulkCreate(
      tripIds.map((tripId) => ({
        itemId,
        itemType,
        tripId,
      }))
    );

    logger.info(`${this.modelName}: Item trips updated`, {
      itemId,
      itemType,
      tripCount: itemTrips.length,
    });

    return itemTrips;
  }

  /**
   * Remove item from all trips (used when deleting item)
   * @param {string} itemType - Type of item
   * @param {string} itemId - Item ID
   * @returns {Promise<boolean>} Success
   */
  async removeItemFromAllTrips(itemType, itemId) {
    logger.info(`${this.modelName}: Removing ${itemType} from all trips`, {
      itemId,
    });

    const result = await ItemTrip.destroy({
      where: {
        itemId,
        itemType,
      },
    });

    logger.info(`${this.modelName}: Item removed from ${result} trip(s)`, {
      itemId,
      itemType,
    });

    return result > 0;
  }

  /**
   * Update item's trip assignment (handles both adding and removing from trips)
   * This replaces the duplicated pattern in controllers:
   *   if (newTripId && oldTripId !== newTripId) { remove old, add new }
   * @param {string} itemType - Type of item
   * @param {string} itemId - Item ID
   * @param {string|null} newTripId - New trip ID (null if making standalone)
   * @param {string|null} oldTripId - Old trip ID (null if was standalone)
   * @returns {Promise<Object>} Result with added/removed flags
   * @example
   * // When updating a flight's trip assignment
   * await itemTripService.updateItemTrip('flight', flightId, newTripId, oldTripId);
   */
  async updateItemTrip(itemType, itemId, newTripId, oldTripId) {
    const changes = { added: false, removed: false };

    try {
      // Remove from old trip if provided and different from new
      if (oldTripId && oldTripId !== newTripId) {
        const removed = await this.removeItemFromTrip(itemType, itemId, oldTripId);
        if (removed) {
          changes.removed = true;
        }
      }

      // Add to new trip if provided
      if (newTripId) {
        const added = await this.addItemToTrip(itemType, itemId, newTripId);
        if (added) {
          changes.added = true;
        }
      }

      logger.info(`${this.modelName}: Trip assignment updated`, {
        itemType,
        itemId,
        oldTripId,
        newTripId,
        ...changes,
      });

      return changes;
    } catch (error) {
      logger.error(`${this.modelName}: Error updating trip assignment`, error);
      throw error;
    }
  }
}

module.exports = ItemTripService;
