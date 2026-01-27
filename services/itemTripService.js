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
const { ItemTrip, Trip, TripCompanion, ItemCompanion } = require('../models');

class ItemTripService extends BaseService {
  constructor() {
    super(ItemTrip, 'ItemTrip');
  }

  /**
   * Add item to trip
   * @param {string} itemType - Type of item ('flight', 'hotel', 'event', 'transportation', 'car_rental')
   * @param {string} itemId - Item ID
   * @param {string} tripId - Trip ID
   * @param {string} userId - User ID performing the action (for audit trail)
   * @returns {Promise<Object>} Created ItemTrip record
   */
  async addItemToTrip(itemType, itemId, tripId, userId) {
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
      throw new Error('This item is already on this trip');
    }

    // Create item-trip association
    const itemTrip = await ItemTrip.create({
      itemId,
      itemType,
      tripId,
    });

    // Cascade trip companions to the item
    if (userId) {
      await this.cascadeTripsCompanionsToItem(itemType, itemId, tripId, userId);
    }

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
    const result = await ItemTrip.destroy({
      where: {
        itemId,
        itemType,
        tripId,
      },
    });

    return result > 0;
  }

  /**
   * Get all trips an item belongs to
   * @param {string} itemType - Type of item
   * @param {string} itemId - Item ID
   * @returns {Promise<Array>} Array of trip IDs
   */
  async getItemTrips(itemType, itemId) {
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
   * @param {string} userId - User ID performing the action
   * @returns {Promise<Array>} Created ItemTrip records
   */
  async setItemTrips(itemType, itemId, tripIds, userId) {
    // Get existing trip IDs for this item
    const existingItemTrips = await ItemTrip.findAll({
      where: {
        itemId,
        itemType,
      },
      attributes: ['tripId'],
      raw: true,
    });
    const existingTripIds = existingItemTrips.map((it) => it.tripId);

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

    // Cascade companions for newly added trips
    if (userId) {
      const newTripIds = tripIds.filter((id) => !existingTripIds.includes(id));
      for (const tripId of newTripIds) {
        await this.cascadeTripsCompanionsToItem(itemType, itemId, tripId, userId);
      }
    }

    return itemTrips;
  }

  /**
   * Remove item from all trips (used when deleting item)
   * @param {string} itemType - Type of item
   * @param {string} itemId - Item ID
   * @returns {Promise<boolean>} Success
   */
  async removeItemFromAllTrips(itemType, itemId) {
    const result = await ItemTrip.destroy({
      where: {
        itemId,
        itemType,
      },
    });

    return result > 0;
  }

  /**
   * Cascade trip companions to an item
   * When an item is moved to a trip, add all trip companions to the item
   * @param {string} itemType - Type of item
   * @param {string} itemId - Item ID
   * @param {string} tripId - Trip ID
   * @param {string} userId - User ID performing the action
   * @returns {Promise<number>} Number of companions added
   * @private
   */
  async cascadeTripsCompanionsToItem(itemType, itemId, tripId, userId) {
    try {
      // Get all companions for this trip
      const tripCompanions = await TripCompanion.findAll({
        where: { tripId },
        attributes: ['companionId', 'canView', 'canEdit', 'canManageCompanions'],
      });

      if (tripCompanions.length === 0) {
        return 0;
      }

      // Build item companion records
      const itemCompanionRecords = tripCompanions.map((tc) => ({
        itemType,
        itemId,
        companionId: tc.companionId,
        status: 'attending',
        addedBy: userId,
        inheritedFromTrip: true,
        // Inherit permissions from trip companion, with sensible defaults
        canView: tc.canView !== undefined ? tc.canView : true,
        canEdit: tc.canEdit !== undefined ? tc.canEdit : false,
        canManageCompanions: tc.canManageCompanions !== undefined ? tc.canManageCompanions : false,
      }));

      // Bulk create, ignoring duplicates (in case companion already added)
      await ItemCompanion.bulkCreate(itemCompanionRecords, {
        ignoreDuplicates: true,
      });

      return tripCompanions.length;
    } catch (error) {
      // Don't throw - allow item to be added even if companion cascade fails
      return 0;
    }
  }

  /**
   * Update item's trip assignment (handles both adding and removing from trips)
   * This replaces the duplicated pattern in controllers:
   *   if (newTripId && oldTripId !== newTripId) { remove old, add new }
   * @param {string} itemType - Type of item
   * @param {string} itemId - Item ID
   * @param {string|null} newTripId - New trip ID (null if making standalone)
   * @param {string|null} oldTripId - Old trip ID (null if was standalone)
   * @param {string} userId - User ID performing the action
   * @returns {Promise<Object>} Result with added/removed flags
   * @example
   * // When updating a flight's trip assignment
   * await itemTripService.updateItemTrip('flight', flightId, newTripId, oldTripId, userId);
   */
  async updateItemTrip(itemType, itemId, newTripId, oldTripId, userId) {
    const changes = { added: false, removed: false };

    // Remove from old trip if provided and different from new
    if (oldTripId && oldTripId !== newTripId) {
      const removed = await this.removeItemFromTrip(itemType, itemId, oldTripId);
      if (removed) {
        changes.removed = true;
      }
    }

    // Add to new trip if provided
    if (newTripId) {
      const added = await this.addItemToTrip(itemType, itemId, newTripId, userId);
      if (added) {
        changes.added = true;
      }
    }

    return changes;
  }
}

module.exports = ItemTripService;
