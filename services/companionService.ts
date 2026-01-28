/**
 * Companion Service
 * Business logic for travel companion management
 * TypeScript version with full type safety
 */

import { Op, FindOptions } from 'sequelize';
import BaseService from './BaseService';
import { TravelCompanion, User, Trip, TripCompanion } from '../models';
import logger from '../utils/logger';
import cacheService from './cacheService';
import type { CompanionData, CreateCompanionRequest, UpdateCompanionRequest } from '../types';

interface TripCompanionOptions {
  hasEditPermission?: boolean;
}

interface SearchOptions {
  limit?: number;
}

class CompanionService extends BaseService {
  constructor() {
    super(TravelCompanion, 'TravelCompanion');
  }

  /**
   * Get all companions for a user
   * Excludes the user's own companion profile
   */
  async getUserCompanions(userId: string, options: FindOptions = {}): Promise<any[]> {
    // Try cache first if no custom options
    if (Object.keys(options).length === 0) {
      const cached = await cacheService.getCachedUserCompanions(userId);
      if (cached) {
        return cached;
      }
    }

    const companions = await TravelCompanion.findAll({
      where: {
        createdBy: userId,
        [Op.or]: [{ userId: { [Op.is]: null } }, { userId: { [Op.ne]: userId } }],
      },
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

    // Cache the result if no custom options
    if (Object.keys(options).length === 0) {
      await cacheService.cacheUserCompanions(userId, companions);
    }

    return companions;
  }

  /**
   * Create a new travel companion
   */
  async createCompanion(data: CreateCompanionRequest, userId: string): Promise<any> {
    logger.info(`${this.modelName}: Creating companion for user ${userId}`, {
      email: data.email,
    });

    // Check if companion with this email already exists
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
      userId: linkedUser?.id || null,
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
   */
  async updateCompanion(
    companionId: string,
    data: UpdateCompanionRequest,
    userId: string
  ): Promise<any> {
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
   */
  async deleteCompanion(companionId: string, userId: string): Promise<boolean> {
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
   */
  async addCompanionToTrip(
    tripId: string,
    companionId: string,
    userId: string,
    options: TripCompanionOptions = {}
  ): Promise<any> {
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

    // Verify companion exists
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
   */
  async removeCompanionFromTrip(
    tripId: string,
    companionId: string,
    userId: string
  ): Promise<boolean> {
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
   */
  async getTripCompanions(tripId: string, userId: string): Promise<any[]> {
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
   */
  async searchCompanions(
    userId: string,
    query: string,
    limit: number = 10
  ): Promise<any[]> {
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
   */
  async linkCompanionToAccount(companionId: string, userAccountId: string): Promise<any> {
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

export default new CompanionService();
