const db = require('../models');
const { ITEM_TYPE_MAP } = require('../constants/companionConstants');

/**
 * CompanionPermissionManager
 * Single source of truth for all companion permission checks and updates
 *
 * Permission Hierarchy:
 * - Global permissions set baseline (what you allow each companion to do)
 * - Trip-level permissions can override/extend global (specific trip restrictions)
 * - Item-level permissions can override trip-level (specific item restrictions)
 *
 * Fallback chain: Item → Trip → Global
 */
class CompanionPermissionManager {
  /**
   * Check if user can view trips of target user
   * @param {string} userId - Current user ID
   * @param {string} targetUserId - Target user ID
   * @returns {Promise<boolean>}
   */
  async canViewTripsOf(userId, targetUserId) {
    const permission = await db.CompanionPermission.findOne({
      where: {
        companionId: {
          [db.Sequelize.Op.in]: await this._getCompanionIdsByUserId(targetUserId, userId),
        },
        grantedBy: userId,
      },
    });
    return permission?.canView ?? false;
  }

  /**
   * Check if user can edit trips of target user
   * @param {string} userId - Current user ID
   * @param {string} targetUserId - Target user ID
   * @returns {Promise<boolean>}
   */
  async canEditTripsOf(userId, targetUserId) {
    const permission = await db.CompanionPermission.findOne({
      where: {
        companionId: {
          [db.Sequelize.Op.in]: await this._getCompanionIdsByUserId(targetUserId, userId),
        },
        grantedBy: userId,
      },
    });
    return permission?.canEdit ?? false;
  }

  /**
   * Check if user can manage companions of target user
   * @param {string} userId - Current user ID
   * @param {string} targetUserId - Target user ID
   * @returns {Promise<boolean>}
   */
  async canManageCompanionsOf(userId, targetUserId) {
    const permission = await db.CompanionPermission.findOne({
      where: {
        companionId: {
          [db.Sequelize.Op.in]: await this._getCompanionIdsByUserId(targetUserId, userId),
        },
        grantedBy: userId,
      },
    });
    return permission?.canManageCompanions ?? false;
  }

  /**
   * Check if user can view a trip
   * @param {string} userId - User ID
   * @param {string} tripId - Trip ID
   * @returns {Promise<boolean>}
   */
  async canViewTrip(userId, tripId) {
    const trip = await db.Trip.findByPk(tripId);
    if (!trip) return false;

    // Owner can always view
    if (trip.userId === userId) return true;

    // Check trip companion permissions
    const tripCompanion = await db.TripCompanion.findOne({
      where: {
        tripId,
        companionId: {
          [db.Sequelize.Op.in]: await this._getCompanionIdsByUserId(trip.userId, userId),
        },
      },
    });

    return tripCompanion?.canView ?? false;
  }

  /**
   * Check if user can edit a trip
   * @param {string} userId - User ID
   * @param {string} tripId - Trip ID
   * @returns {Promise<boolean>}
   */
  async canEditTrip(userId, tripId) {
    const trip = await db.Trip.findByPk(tripId);
    if (!trip) return false;

    // Owner can always edit
    if (trip.userId === userId) return true;

    // Check trip companion permissions
    const tripCompanion = await db.TripCompanion.findOne({
      where: {
        tripId,
        companionId: {
          [db.Sequelize.Op.in]: await this._getCompanionIdsByUserId(trip.userId, userId),
        },
      },
    });

    return tripCompanion?.canEdit ?? false;
  }

  /**
   * Check if user can manage companions on a trip
   * @param {string} userId - User ID
   * @param {string} tripId - Trip ID
   * @returns {Promise<boolean>}
   */
  async canManageCompanionsOnTrip(userId, tripId) {
    const trip = await db.Trip.findByPk(tripId);
    if (!trip) return false;

    // Owner can always manage companions
    if (trip.userId === userId) return true;

    // Check trip companion permissions
    const tripCompanion = await db.TripCompanion.findOne({
      where: {
        tripId,
        companionId: {
          [db.Sequelize.Op.in]: await this._getCompanionIdsByUserId(trip.userId, userId),
        },
      },
    });

    return tripCompanion?.canManageCompanions ?? false;
  }

  /**
   * Check if user can view an item
   * @param {string} userId - User ID
   * @param {string} itemType - Item type (flight, hotel, etc)
   * @param {string} itemId - Item ID
   * @returns {Promise<boolean>}
   */
  async canViewItem(userId, itemType, itemId) {
    // Get item to find owner
    const itemModel = this._getItemModel(itemType);
    const item = await itemModel.findByPk(itemId);
    if (!item) return false;

    // Owner can always view
    if (item.userId === userId) return true;

    // Check item companion permissions first
    const itemCompanion = await db.ItemCompanion.findOne({
      where: {
        itemType,
        itemId,
        companionId: {
          [db.Sequelize.Op.in]: await this._getCompanionIdsByUserId(item.userId, userId),
        },
      },
    });

    if (itemCompanion) return itemCompanion.canView;

    // Fall back to trip companion permissions if this is a trip item
    if (item.tripId) {
      const tripCompanion = await db.TripCompanion.findOne({
        where: {
          tripId: item.tripId,
          companionId: {
            [db.Sequelize.Op.in]: await this._getCompanionIdsByUserId(item.userId, userId),
          },
        },
      });

      if (tripCompanion) return tripCompanion.canView;
    }

    return false;
  }

  /**
   * Check if user can edit an item
   * @param {string} userId - User ID
   * @param {string} itemType - Item type (flight, hotel, etc)
   * @param {string} itemId - Item ID
   * @returns {Promise<boolean>}
   */
  async canEditItem(userId, itemType, itemId) {
    // Get item to find owner
    const itemModel = this._getItemModel(itemType);
    const item = await itemModel.findByPk(itemId);
    if (!item) return false;

    // Owner can always edit
    if (item.userId === userId) return true;

    // Check item companion permissions first
    const itemCompanion = await db.ItemCompanion.findOne({
      where: {
        itemType,
        itemId,
        companionId: {
          [db.Sequelize.Op.in]: await this._getCompanionIdsByUserId(item.userId, userId),
        },
      },
    });

    if (itemCompanion) return itemCompanion.canEdit;

    // Fall back to trip companion permissions if this is a trip item
    if (item.tripId) {
      const tripCompanion = await db.TripCompanion.findOne({
        where: {
          tripId: item.tripId,
          companionId: {
            [db.Sequelize.Op.in]: await this._getCompanionIdsByUserId(item.userId, userId),
          },
        },
      });

      if (tripCompanion) return tripCompanion.canEdit;
    }

    return false;
  }

  /**
   * Check if user can manage companions on an item
   * @param {string} userId - User ID
   * @param {string} itemType - Item type (flight, hotel, etc)
   * @param {string} itemId - Item ID
   * @returns {Promise<boolean>}
   */
  async canManageCompanionsOnItem(userId, itemType, itemId) {
    // Get item to find owner
    const itemModel = this._getItemModel(itemType);
    const item = await itemModel.findByPk(itemId);
    if (!item) return false;

    // Owner can always manage companions
    if (item.userId === userId) return true;

    // Check item companion permissions first
    const itemCompanion = await db.ItemCompanion.findOne({
      where: {
        itemType,
        itemId,
        companionId: {
          [db.Sequelize.Op.in]: await this._getCompanionIdsByUserId(item.userId, userId),
        },
      },
    });

    if (itemCompanion) return itemCompanion.canManageCompanions;

    // Fall back to trip companion permissions if this is a trip item
    if (item.tripId) {
      const tripCompanion = await db.TripCompanion.findOne({
        where: {
          tripId: item.tripId,
          companionId: {
            [db.Sequelize.Op.in]: await this._getCompanionIdsByUserId(item.userId, userId),
          },
        },
      });

      if (tripCompanion) return tripCompanion.canManageCompanions;
    }

    return false;
  }

  /**
   * Update global companion permissions
   * @param {string} grantingUserId - User granting permissions
   * @param {string} companionId - Companion ID
   * @param {object} permissions - {canView, canEdit, canManageCompanions}
   * @returns {Promise<void>}
   */
  async updateCompanionPermissions(grantingUserId, companionId, permissions) {
    const [record] = await db.CompanionPermission.findOrCreate({
      where: { companionId, grantedBy: grantingUserId },
      defaults: { companionId, grantedBy: grantingUserId, ...permissions },
    });

    await record.update(permissions);
  }

  /**
   * Update trip-level companion permissions
   * @param {string} userId - Trip owner or admin
   * @param {string} tripId - Trip ID
   * @param {string} companionId - Companion ID
   * @param {object} permissions - {canView, canEdit, canManageCompanions}
   * @returns {Promise<void>}
   */
  async updateTripCompanionPermissions(userId, tripId, companionId, permissions) {
    const tripCompanion = await db.TripCompanion.findOne({
      where: { tripId, companionId },
    });

    if (tripCompanion) {
      await tripCompanion.update(permissions);
    }
  }

  /**
   * Update item-level companion permissions
   * @param {string} userId - Item owner
   * @param {string} itemType - Item type
   * @param {string} itemId - Item ID
   * @param {string} companionId - Companion ID
   * @param {object} permissions - {canView, canEdit, canManageCompanions}
   * @returns {Promise<void>}
   */
  async updateItemCompanionPermissions(userId, itemType, itemId, companionId, permissions) {
    const itemCompanion = await db.ItemCompanion.findOne({
      where: { itemType, itemId, companionId },
    });

    if (itemCompanion) {
      await itemCompanion.update(permissions);
    }
  }

  /**
   * Get companion IDs for a user (companions they created or are related to)
   * @private
   * @param {string} ownerUserId - User ID to find companions for
   * @param {string} requesterUserId - User requesting the information
   * @returns {Promise<string[]>}
   */
  async _getCompanionIdsByUserId(ownerUserId, requesterUserId) {
    const companions = await db.TravelCompanion.findAll({
      where: { [db.Sequelize.Op.or]: [{ createdBy: ownerUserId }, { userId: ownerUserId }] },
      attributes: ['id'],
      raw: true,
    });

    return companions.map((c) => c.id);
  }

  /**
   * Get item model by type
   * @private
   * @param {string} itemType - Item type
   * @returns {object} Sequelize model
   */
  _getItemModel(itemType) {
    const model = ITEM_TYPE_MAP[itemType];

    if (!model) {
      throw new Error(`Unknown item type: ${itemType}`);
    }

    return model;
  }
}

module.exports = new CompanionPermissionManager();
