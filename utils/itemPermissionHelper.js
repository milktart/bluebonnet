/**
 * Item Permission Helper
 *
 * Provides centralized permission checking for travel items (flights, hotels, events, etc).
 * Single source of truth for determining if a user can edit an item based on:
 * - Item ownership (userId = req.user.id)
 * - Trip ownership (trip.userId = req.user.id)
 * - Trip companion permissions (TripCompanion.canEdit = true)
 *
 * Usage:
 *   const permissions = await getItemPermissions(item, req.user.id);
 *   res.json({ ...itemData, canEdit: permissions.canEdit, canDelete: permissions.canDelete });
 */

const { TripCompanion, TravelCompanion } = require('../models');

/**
 * Get permission flags for an item
 * Determines what the current user can do with a specific item
 *
 * @param {Object} item - The item object (must have userId, tripId, trip properties)
 * @param {string} userId - Current user's ID
 * @returns {Promise<Object>} Permission object { canEdit: boolean, canDelete: boolean }
 */
async function getItemPermissions(item, userId) {
  if (!item || !userId) {
    return { canEdit: false, canDelete: false };
  }

  // Item owner can always edit and delete
  const isItemOwner = item.userId === userId;
  if (isItemOwner) {
    return { canEdit: true, canDelete: true };
  }

  // Check trip-level permissions if item is part of a trip
  let canEditTrip = false;
  if (item.tripId) {
    // Check if user is trip owner
    const isTripOwner = item.trip?.userId === userId;
    if (isTripOwner) {
      canEditTrip = true;
    } else {
      // Check if user is a trip companion with canEdit permission
      // Need to find TripCompanion where the associated TravelCompanion's userId matches current user
      const tripCompanion = await TripCompanion.findOne({
        where: { tripId: item.tripId },
        include: [
          {
            model: TravelCompanion,
            as: 'companion',
            required: true,
            where: { userId }, // Match TravelCompanion.userId to current user
          },
        ],
      });

      if (tripCompanion) {
        canEditTrip = tripCompanion.canEdit === true;
      }
    }
  }

  return {
    canEdit: canEditTrip,
    canDelete: canEditTrip,
  };
}

/**
 * Verify user can edit an item
 * Throws 403 if user does not have permission
 *
 * @param {Object} item - The item object
 * @param {string} userId - Current user's ID
 * @param {string} itemType - Type of item for error messaging (flight, hotel, etc)
 * @throws {Error} Throws error if permission denied (for route handler error catching)
 * @returns {Promise<boolean>} Returns true if allowed
 */
async function requireItemEditPermission(item, userId, itemType = 'item') {
  const permissions = await getItemPermissions(item, userId);
  if (!permissions.canEdit) {
    const error = new Error(`Not authorized to edit ${itemType}`);
    error.statusCode = 403;
    throw error;
  }
  return true;
}

module.exports = {
  getItemPermissions,
  requireItemEditPermission,
};
