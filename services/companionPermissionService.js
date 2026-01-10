/**
 * Companion Permission Service
 * Business logic for managing full-access trip permissions
 *
 * Handles:
 * - Granting/revoking full access to trips
 * - Checking permission levels
 */

const BaseService = require('./BaseService');
const { CompanionPermission, User } = require('../models');
const logger = require('../utils/logger');

class CompanionPermissionService extends BaseService {
  constructor() {
    super(CompanionPermission, 'CompanionPermission');
  }

  /**
   * Grant full access to trips
   * @param {string} ownerId - User granting access (trip owner)
   * @param {string} trustedUserId - User receiving access
   * @param {Object} options - { canManageAllTrips, canViewAllTrips }
   * @returns {Promise<Object>} Created CompanionPermission record
   */
  async grantFullAccess(ownerId, trustedUserId, options = {}) {
    const { canManageAllTrips = true, canViewAllTrips = true } = options;

    logger.info(`${this.modelName}: Granting full access`, {
      ownerId,
      trustedUserId,
      canManageAllTrips,
      canViewAllTrips,
    });

    if (ownerId === trustedUserId) {
      throw new Error('Cannot grant permissions to yourself');
    }

    // Check if users exist
    const owner = await User.findByPk(ownerId);
    const trustedUser = await User.findByPk(trustedUserId);

    if (!owner || !trustedUser) {
      throw new Error('One or both users not found');
    }

    // Check if permission already exists
    const existing = await CompanionPermission.findOne({
      where: {
        ownerId,
        trustedUserId,
      },
    });

    if (existing) {
      // Update existing permission
      existing.canManageAllTrips = canManageAllTrips;
      existing.canViewAllTrips = canViewAllTrips;
      await existing.save();

      logger.info(`${this.modelName}: Permission updated`, {
        ownerId,
        trustedUserId,
      });

      return existing;
    }

    // Create new permission
    const permission = await CompanionPermission.create({
      ownerId,
      trustedUserId,
      canManageAllTrips,
      canViewAllTrips,
    });

    logger.info(`${this.modelName}: Permission granted`, {
      ownerId,
      trustedUserId,
      canManageAllTrips,
      canViewAllTrips,
    });

    return permission;
  }

  /**
   * Revoke full access
   * @param {string} ownerId - Trip owner revoking access
   * @param {string} trustedUserId - User losing access
   * @returns {Promise<boolean>} Success
   */
  async revokeFullAccess(ownerId, trustedUserId) {
    logger.info(`${this.modelName}: Revoking full access`, {
      ownerId,
      trustedUserId,
    });

    const result = await CompanionPermission.destroy({
      where: {
        ownerId,
        trustedUserId,
      },
    });

    if (result === 0) {
      logger.warn(`${this.modelName}: Permission not found`, {
        ownerId,
        trustedUserId,
      });
      return false;
    }

    logger.info(`${this.modelName}: Permission revoked`, {
      ownerId,
      trustedUserId,
    });

    return true;
  }

  /**
   * Get all full-access grants for a user (trips they can manage)
   * @param {string} trustedUserId - User ID
   * @returns {Promise<Array>} Array of owners this user has full access to
   */
  async getFullAccessGrants(trustedUserId) {
    logger.debug(`${this.modelName}: Getting full access grants for user ${trustedUserId}`);

    const permissions = await CompanionPermission.findAll({
      where: { trustedUserId },
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: true,
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return permissions;
  }

  /**
   * Get all users with full access to a given owner's trips
   * @param {string} ownerId - Owner user ID
   * @returns {Promise<Array>} Array of users with access
   */
  async getFullAccessUsers(ownerId) {
    logger.debug(`${this.modelName}: Getting full access users for owner ${ownerId}`);

    const permissions = await CompanionPermission.findAll({
      where: { ownerId },
      include: [
        {
          model: User,
          as: 'trustedUser',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: true,
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return permissions;
  }

  /**
   * Check if user has permission level on owner's trips
   * @param {string} userId - User checking access
   * @param {string} ownerId - Trip owner
   * @param {string} permissionType - 'manage' or 'view'
   * @returns {Promise<boolean>} True if user has permission
   */
  async checkPermission(userId, ownerId, permissionType = 'view') {
    logger.debug(`${this.modelName}: Checking ${permissionType} permission`, {
      userId,
      ownerId,
    });

    if (userId === ownerId) {
      return true; // Owner always has access
    }

    const permission = await CompanionPermission.findOne({
      where: { trustedUserId: userId, ownerId },
    });

    if (!permission) {
      return false;
    }

    if (permissionType === 'manage') {
      return permission.canManageAllTrips;
    }

    return permission.canViewAllTrips || permission.canManageAllTrips;
  }

  /**
   * Get all trip owners a user has access to
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of owner user IDs
   */
  async getAccessibleOwners(userId) {
    logger.debug(`${this.modelName}: Getting accessible owners for user ${userId}`);

    const permissions = await CompanionPermission.findAll({
      where: { trustedUserId: userId },
      attributes: ['ownerId'],
      raw: true,
    });

    return permissions.map((p) => p.ownerId);
  }
}

module.exports = CompanionPermissionService;
