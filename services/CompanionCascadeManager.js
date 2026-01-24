const db = require('../models');
const logger = require('../utils/logger');

/**
 * CompanionCascadeManager
 * Single source of truth for cascading companion assignments
 *
 * When a companion is added to a trip, they should be added to all existing items in that trip.
 * When a companion is removed from a trip, they should be removed from all items (except independently added).
 *
 * This manager ensures consistent cascade behavior across all endpoints.
 */
class CompanionCascadeManager {
  /**
   * Add companion to all items in a trip
   * Called when:
   * - Companion is added to trip
   * - Companion is promoted to trip admin (canEdit: false → true)
   *
   * @param {string} companionId - Companion ID to add
   * @param {string} tripId - Trip ID whose items will get the companion
   * @param {string} addedBy - User ID who is adding (for audit trail)
   * @param {object} permissions - Optional permissions for the companion {canView, canEdit, canManageCompanions}
   * @returns {Promise<number>} Number of items companion was added to
   * @throws {Error} If trip or items not found
   */
  async cascadeAddToAllItems(companionId, tripId, addedBy, permissions = {}) {
    try {
      logger.debug(
        `[CompanionCascadeManager] Adding companion ${companionId} to all items in trip ${tripId}`
      );

      // Default permissions for cascaded companions
      const defaultPermissions = {
        canView: true,
        canEdit: permissions.canEdit ?? false,
        canManageCompanions: permissions.canManageCompanions ?? false,
      };

      // Find all items in the trip (5 item types)
      const [flights, hotels, transportation, carRentals, events] = await Promise.all([
        db.Flight.findAll({ where: { tripId }, attributes: ['id'] }),
        db.Hotel.findAll({ where: { tripId }, attributes: ['id'] }),
        db.Transportation.findAll({ where: { tripId }, attributes: ['id'] }),
        db.CarRental.findAll({ where: { tripId }, attributes: ['id'] }),
        db.Event.findAll({ where: { tripId }, attributes: ['id'] }),
      ]);

      // Build array of item companion records to create
      const itemCompanionRecords = [];

      // Add flights
      flights.forEach((f) => {
        itemCompanionRecords.push({
          itemType: 'flight',
          itemId: f.id,
          companionId,
          status: 'attending',
          addedBy,
          inheritedFromTrip: true,
          ...defaultPermissions,
        });
      });

      // Add hotels
      hotels.forEach((h) => {
        itemCompanionRecords.push({
          itemType: 'hotel',
          itemId: h.id,
          companionId,
          status: 'attending',
          addedBy,
          inheritedFromTrip: true,
          ...defaultPermissions,
        });
      });

      // Add transportation
      transportation.forEach((t) => {
        itemCompanionRecords.push({
          itemType: 'transportation',
          itemId: t.id,
          companionId,
          status: 'attending',
          addedBy,
          inheritedFromTrip: true,
          ...defaultPermissions,
        });
      });

      // Add car rentals
      carRentals.forEach((cr) => {
        itemCompanionRecords.push({
          itemType: 'car_rental',
          itemId: cr.id,
          companionId,
          status: 'attending',
          addedBy,
          inheritedFromTrip: true,
          ...defaultPermissions,
        });
      });

      // Add events
      events.forEach((e) => {
        itemCompanionRecords.push({
          itemType: 'event',
          itemId: e.id,
          companionId,
          status: 'attending',
          addedBy,
          inheritedFromTrip: true,
          ...defaultPermissions,
        });
      });

      // Create all records at once (ignore duplicates silently)
      if (itemCompanionRecords.length > 0) {
        await db.ItemCompanion.bulkCreate(itemCompanionRecords, {
          ignoreDuplicates: true,
        });
        logger.debug(
          `[CompanionCascadeManager] Successfully added companion ${companionId} to ${itemCompanionRecords.length} items`
        );
      } else {
        logger.debug(`[CompanionCascadeManager] No items found in trip ${tripId} to cascade to`);
      }

      return itemCompanionRecords.length;
    } catch (error) {
      logger.error(
        `[CompanionCascadeManager] Error cascading companion ${companionId} to items:`,
        error
      );
      throw error;
    }
  }

  /**
   * Remove companion from all items in a trip (only inherited ones)
   * Called when:
   * - Companion is removed from trip
   * - Companion is demoted from trip admin (canEdit: true → false)
   *
   * Only removes companions that were inherited from the trip (inheritedFromTrip: true).
   * Companions independently added to items are NOT removed.
   *
   * @param {string} companionId - Companion ID to remove
   * @param {string} tripId - Trip ID whose items will have the companion removed
   * @returns {Promise<number>} Number of items companion was removed from
   * @throws {Error} If trip or items not found
   */
  async cascadeRemoveFromAllItems(companionId, tripId) {
    try {
      logger.debug(
        `[CompanionCascadeManager] Removing companion ${companionId} from all inherited items in trip ${tripId}`
      );

      // Find all items in the trip
      const [flights, hotels, transportation, carRentals, events] = await Promise.all([
        db.Flight.findAll({ where: { tripId }, attributes: ['id'] }),
        db.Hotel.findAll({ where: { tripId }, attributes: ['id'] }),
        db.Transportation.findAll({ where: { tripId }, attributes: ['id'] }),
        db.CarRental.findAll({ where: { tripId }, attributes: ['id'] }),
        db.Event.findAll({ where: { tripId }, attributes: ['id'] }),
      ]);

      // Build array of item references
      const itemReferences = [];

      flights.forEach((f) => {
        itemReferences.push({ itemType: 'flight', itemId: f.id });
      });

      hotels.forEach((h) => {
        itemReferences.push({ itemType: 'hotel', itemId: h.id });
      });

      transportation.forEach((t) => {
        itemReferences.push({ itemType: 'transportation', itemId: t.id });
      });

      carRentals.forEach((cr) => {
        itemReferences.push({ itemType: 'car_rental', itemId: cr.id });
      });

      events.forEach((e) => {
        itemReferences.push({ itemType: 'event', itemId: e.id });
      });

      // Remove companion from all inherited items
      let totalRemoved = 0;
      if (itemReferences.length > 0) {
        for (const { itemType, itemId } of itemReferences) {
          const result = await db.ItemCompanion.destroy({
            where: {
              itemType,
              itemId,
              companionId,
              inheritedFromTrip: true,
            },
          });
          totalRemoved += result;
        }
        logger.debug(
          `[CompanionCascadeManager] Successfully removed companion ${companionId} from ${totalRemoved} inherited items`
        );
      } else {
        logger.debug(
          `[CompanionCascadeManager] No items found in trip ${tripId} to cascade removal from`
        );
      }

      return totalRemoved;
    } catch (error) {
      logger.error(
        `[CompanionCascadeManager] Error cascading removal of companion ${companionId} from items:`,
        error
      );
      throw error;
    }
  }

  /**
   * Update cascade permissions across all items
   * When trip-level permissions change, update all cascaded items
   *
   * @param {string} companionId - Companion ID whose permissions changed
   * @param {string} tripId - Trip ID
   * @param {object} permissions - New permissions {canView, canEdit, canManageCompanions}
   * @returns {Promise<number>} Number of items updated
   * @throws {Error} If update fails
   */
  async updateCascadedPermissions(companionId, tripId, permissions) {
    try {
      logger.debug(
        `[CompanionCascadeManager] Updating permissions for companion ${companionId} on all inherited items in trip ${tripId}`
      );

      // Find all items in the trip
      const [flights, hotels, transportation, carRentals, events] = await Promise.all([
        db.Flight.findAll({ where: { tripId }, attributes: ['id'] }),
        db.Hotel.findAll({ where: { tripId }, attributes: ['id'] }),
        db.Transportation.findAll({ where: { tripId }, attributes: ['id'] }),
        db.CarRental.findAll({ where: { tripId }, attributes: ['id'] }),
        db.Event.findAll({ where: { tripId }, attributes: ['id'] }),
      ]);

      // Build array of item references
      const itemReferences = [];

      flights.forEach((f) => {
        itemReferences.push({ itemType: 'flight', itemId: f.id });
      });

      hotels.forEach((h) => {
        itemReferences.push({ itemType: 'hotel', itemId: h.id });
      });

      transportation.forEach((t) => {
        itemReferences.push({ itemType: 'transportation', itemId: t.id });
      });

      carRentals.forEach((cr) => {
        itemReferences.push({ itemType: 'car_rental', itemId: cr.id });
      });

      events.forEach((e) => {
        itemReferences.push({ itemType: 'event', itemId: e.id });
      });

      // Update permissions for all inherited items
      let totalUpdated = 0;
      if (itemReferences.length > 0) {
        for (const { itemType, itemId } of itemReferences) {
          const result = await db.ItemCompanion.update(permissions, {
            where: {
              itemType,
              itemId,
              companionId,
              inheritedFromTrip: true,
            },
          });
          totalUpdated += result[0]; // Sequelize update returns [affectedCount, ...]
        }
        logger.debug(
          `[CompanionCascadeManager] Successfully updated permissions for companion ${companionId} on ${totalUpdated} inherited items`
        );
      }

      return totalUpdated;
    } catch (error) {
      logger.error(
        `[CompanionCascadeManager] Error updating cascaded permissions for companion ${companionId}:`,
        error
      );
      throw error;
    }
  }
}

module.exports = new CompanionCascadeManager();
