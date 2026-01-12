/**
 * Companion Service
 * Business logic for travel companion management
 * Phase 3 - Service Layer Pattern
 * Phase 6 - Performance (Caching)
 */
const { Op } = require('sequelize');
const BaseService = require('./BaseService');
const { TravelCompanion, User, Trip, TripCompanion } = require('../models');
const logger = require('../utils/logger');
const cacheService = require('./cacheService');

class CompanionService extends BaseService {
  constructor() {
    super(TravelCompanion, 'TravelCompanion');
  }

  /**
   * Get all companions for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async getUserCompanions(userId, options = {}) {
    // Try to get from cache first (only if no custom options)
    if (Object.keys(options).length === 0) {
      const cached = await cacheService.getCachedUserCompanions(userId);
      if (cached) {
        return cached;
      }
    }
    const companions = await TravelCompanion.findAll({
      where: { createdBy: userId },
      include: [
        {
          model: User,
          as: 'linkedAccount',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['name', 'ASC']],
      ...options,
    });
    // Cache the result (only if no custom options)
    if (Object.keys(options).length === 0) {
      await cacheService.cacheUserCompanions(userId, companions);
    }
    return companions;
  }

  /**
   * Create a new travel companion
   * @param {Object} data - Companion data
   * @param {string} userId - User ID who is creating the companion
   * @returns {Promise<Object>}
   */
  async createCompanion(data, userId) {
    logger.info(`${this.modelName}: Creating companion for user ${userId}`, {
      email: data.email,
    });
    // Check if companion with this email already exists for this user
    const existing = await TravelCompanion.findOne({
      where: {
        email: data.email,
        createdBy: userId,
      },
    });
    if (existing) {
      logger.warn(`${this.modelName}: Companion already exists`, {
        email: data.email,
        userId,
      });
      throw new Error('A companion with this email already exists');
    }
    // Check if there's a user account with this email
    const linkedUser = await User.findOne({
      where: { email: data.email },
    });
    const companion = await this.create({
      ...data,
      createdBy: userId,
      userId: linkedUser?.id || null, // Link to account if it exists
    });
    logger.info(`${this.modelName}: Companion created`, {
      companionId: companion.id,
      userId,
      linked: !!linkedUser,
    });
    // Invalidate cache
    await cacheService.invalidateUserCompanions(userId);
    return companion;
  }

  /**
   * Update a companion
   * @param {string} companionId - Companion ID
   * @param {Object} data - Updated companion data
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>}
   */
  async updateCompanion(companionId, data, userId) {
    const companion = await this.findByIdAndVerifyOwnership(companionId, userId, {
      include: [
        {
          model: User,
          as: 'linkedAccount',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });
    if (!companion) {
      return null;
    }
    // If email is changing, check for linked account
    if (data.email && data.email !== companion.email) {
      const linkedUser = await User.findOne({
        where: { email: data.email },
      });
      data.userId = linkedUser?.id || null;
    }
    await this.update(companion, data);
    logger.info(`${this.modelName}: Companion updated`, { companionId, userId });
    // Invalidate cache
    await cacheService.invalidateUserCompanions(userId);
    return companion;
  }

  /**
   * Delete a companion
   * @param {string} companionId - Companion ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>}
   */
  async deleteCompanion(companionId, userId) {
    const companion = await this.findByIdAndVerifyOwnership(companionId, userId);
    if (!companion) {
      return false;
    }
    // Check if companion is used in any trips
    const tripCount = await TripCompanion.count({
      where: { companionId },
    });
    if (tripCount > 0) {
      logger.warn(`${this.modelName}: Cannot delete companion - in use`, {
        companionId,
        tripCount,
      });
      throw new Error(
        `This companion is associated with ${tripCount} trip(s). Please remove them from all trips first.`
      );
    }
    await this.delete(companion);
    logger.info(`${this.modelName}: Companion deleted`, { companionId, userId });
    // Invalidate cache
    await cacheService.invalidateUserCompanions(userId);
    return true;
  }

  /**
   * Add a companion to a trip
   * @param {string} tripId - Trip ID
   * @param {string} companionId - Companion ID
   * @param {string} userId - User ID (trip owner)
   * @param {Object} options - Additional options (hasEditPermission)
   * @returns {Promise<Object>}
   */
  async addCompanionToTrip(tripId, companionId, userId, options = {}) {
    logger.info(`${this.modelName}: Adding companion to trip`, {
      tripId,
      companionId,
      userId,
    });
    // Verify trip ownership
    const trip = await Trip.findByPk(tripId);
    if (!trip || trip.userId !== userId) {
      throw new Error('Trip not found or access denied');
    }
    // Verify companion ownership or access
    const companion = await TravelCompanion.findByPk(companionId);
    if (!companion) {
      throw new Error('Companion not found');
    }
    // Check if companion is already on this trip
    const existing = await TripCompanion.findOne({
      where: { tripId, companionId },
    });
    if (existing) {
      logger.warn(`${this.modelName}: Companion already on trip`, { tripId, companionId });
      throw new Error('This companion is already on this trip');
    }
    // Create trip companion association
    const tripCompanion = await TripCompanion.create({
      tripId,
      companionId,
      hasEditPermission:
        options.hasEditPermission !== undefined
          ? options.hasEditPermission
          : trip.defaultCompanionEditPermission,
    });
    logger.info(`${this.modelName}: Companion added to trip`, {
      tripId,
      companionId,
      hasEditPermission: tripCompanion.hasEditPermission,
    });
    return tripCompanion;
  }

  /**
   * Remove a companion from a trip
   * @param {string} tripId - Trip ID
   * @param {string} companionId - Companion ID
   * @param {string} userId - User ID (trip owner)
   * @returns {Promise<boolean>}
   */
  async removeCompanionFromTrip(tripId, companionId, userId) {
    logger.info(`${this.modelName}: Removing companion from trip`, {
      tripId,
      companionId,
      userId,
    });
    // Verify trip ownership
    const trip = await Trip.findByPk(tripId);
    if (!trip || trip.userId !== userId) {
      throw new Error('Trip not found or access denied');
    }
    const result = await TripCompanion.destroy({
      where: { tripId, companionId },
    });
    if (result === 0) {
      logger.warn(`${this.modelName}: Companion not found on trip`, { tripId, companionId });
      return false;
    }
    logger.info(`${this.modelName}: Companion removed from trip`, { tripId, companionId });
    return true;
  }

  /**
   * Get companions for a specific trip
   * @param {string} tripId - Trip ID
   * @param {string} userId - User ID (for access verification)
   * @returns {Promise<Array>}
   */
  async getTripCompanions(tripId, userId) {
    // Verify access to trip
    const trip = await Trip.findByPk(tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }
    // Check if user is owner or a companion on the trip
    const isOwner = trip.userId === userId;
    const isCompanion = await TripCompanion.findOne({
      where: { tripId },
      include: [
        {
          model: TravelCompanion,
          as: 'companion',
          where: { userId },
        },
      ],
    });
    if (!isOwner && !isCompanion) {
      throw new Error('Access denied');
    }
    // Get all trip companions with full details
    const tripCompanions = await TripCompanion.findAll({
      where: { tripId },
      include: [
        {
          model: TravelCompanion,
          as: 'companion',
          include: [
            {
              model: User,
              as: 'linkedAccount',
              attributes: ['id', 'firstName', 'lastName', 'email'],
            },
          ],
        },
      ],
      order: [[{ model: TravelCompanion, as: 'companion' }, 'name', 'ASC']],
    });
    return tripCompanions;
  }

  /**
   * Search companions by name or email
   * @param {string} userId - User ID
   * @param {string} query - Search query
   * @param {number} limit - Max results
   * @returns {Promise<Array>}
   */
  async searchCompanions(userId, query, limit = 10) {
    const searchTerm = query.toLowerCase().trim();
    const companions = await TravelCompanion.findAll({
      where: {
        createdBy: userId,
        [Op.or]: [
          { name: { [Op.iLike]: `%${searchTerm}%` } },
          { email: { [Op.iLike]: `%${searchTerm}%` } },
        ],
      },
      include: [
        {
          model: User,
          as: 'linkedAccount',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      limit,
      order: [['name', 'ASC']],
    });
    return companions;
  }

  /**
   * Link a companion to a user account
   * @param {string} companionId - Companion ID
   * @param {string} userAccountId - User account ID to link
   * @returns {Promise<Object>}
   */
  async linkCompanionToAccount(companionId, userAccountId) {
    logger.info(`${this.modelName}: Linking companion to account`, {
      companionId,
      userAccountId,
    });
    const companion = await TravelCompanion.findByPk(companionId);
    if (!companion) {
      throw new Error('Companion not found');
    }
    const user = await User.findByPk(userAccountId);
    if (!user) {
      throw new Error('User account not found');
    }
    // Update companion with linked account
    await this.update(companion, { userId: userAccountId });
    logger.info(`${this.modelName}: Companion linked to account`, {
      companionId,
      userAccountId,
    });
    return companion;
  }
}
module.exports = new CompanionService();
