/**
 * Trip Service
 * Business logic for trip management
 * Phase 3 - Service Layer Pattern
 * Phase 6 - Performance (Caching)
 */

const { Op } = require('sequelize');
const BaseService = require('./BaseService');
const {
  Trip,
  Flight,
  Hotel,
  Transportation,
  CarRental,
  Event,
  TravelCompanion,
  TripCompanion,
  User,
  ItemCompanion,
} = require('../models');
const logger = require('../utils/logger');
const cacheService = require('./cacheService');

class TripService extends BaseService {
  constructor() {
    super(Trip, 'Trip');
  }

  /**
   * Get common include structure for trips
   * @returns {Array} Sequelize include array
   */
  getTripIncludes() {
    // Using a method instead of static to allow potential future customization per instance
    logger.debug(`${this.modelName}: Building trip includes`);

    return [
      { model: Flight, as: 'flights' },
      { model: Hotel, as: 'hotels' },
      { model: Transportation, as: 'transportation' },
      { model: CarRental, as: 'carRentals' },
      { model: Event, as: 'events' },
      {
        model: TripCompanion,
        as: 'tripCompanions',
        include: [
          {
            model: TravelCompanion,
            as: 'companion',
            include: [
              {
                model: User,
                as: 'linkedAccount',
                attributes: ['id', 'firstName', 'lastName'],
              },
            ],
          },
        ],
      },
    ];
  }

  /**
   * Get trips for a user with filtering and pagination
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @param {string} options.filter - 'upcoming', 'past', or 'all'
   * @param {number} options.page - Page number (for past trips)
   * @param {number} options.limit - Items per page (for past trips)
   * @returns {Promise<Object>} { ownedTrips, companionTrips, standalone, pagination }
   */
  async getUserTrips(userId, options = {}) {
    const { filter = 'upcoming', page = 1, limit = 20 } = options;

    // Try to get from cache first
    const cached = await cacheService.getCachedUserTrips(userId, filter, page);
    if (cached) {
      logger.debug('Cache HIT: User trips', { userId, filter, page });
      return cached;
    }

    logger.debug('Cache MISS: User trips', { userId, filter, page });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Build date filter
    let dateFilter = {};
    let orderDirection = 'ASC';

    if (filter === 'upcoming') {
      dateFilter = { departureDate: { [Op.gte]: today } };
      orderDirection = 'ASC'; // Soonest first
    } else if (filter === 'past') {
      dateFilter = { returnDate: { [Op.lt]: today } };
      orderDirection = 'DESC'; // Most recent first
    }

    const tripIncludes = this.getTripIncludes();

    // Get owned trips (with pagination for past trips)
    const ownedTripsQuery = {
      where: { userId, ...dateFilter },
      order: [['departureDate', orderDirection]],
      include: tripIncludes,
    };

    if (filter === 'past') {
      ownedTripsQuery.limit = limit;
      ownedTripsQuery.offset = (page - 1) * limit;
    }

    const ownedTrips = await Trip.findAll(ownedTripsQuery);

    // Get total count for pagination (past trips only)
    let totalCount = 0;
    if (filter === 'past') {
      totalCount = await Trip.count({
        where: { userId, ...dateFilter },
      });
    }

    // Get trips where user is a companion
    const companionTrips = await Trip.findAll({
      where: dateFilter,
      include: [
        ...tripIncludes,
        {
          model: TripCompanion,
          as: 'tripCompanions',
          required: true,
          include: [
            {
              model: TravelCompanion,
              as: 'companion',
              where: { userId },
              include: [
                {
                  model: User,
                  as: 'linkedAccount',
                  attributes: ['id', 'firstName', 'lastName'],
                },
              ],
            },
          ],
        },
      ],
      order: [['departureDate', orderDirection]],
    });

    // Get standalone items (for upcoming/past filters)
    let standaloneItems = {};
    if (filter !== 'all') {
      standaloneItems = await this.getStandaloneItems(userId, dateFilter);
    }

    // Calculate pagination metadata
    const pagination = {
      currentPage: page,
      totalPages: filter === 'past' ? Math.ceil(totalCount / limit) : 1,
      totalCount,
      hasNextPage: filter === 'past' && page < Math.ceil(totalCount / limit),
      hasPrevPage: filter === 'past' && page > 1,
    };

    const result = {
      ownedTrips,
      companionTrips,
      standalone: standaloneItems,
      pagination,
    };

    // Cache the result
    await cacheService.cacheUserTrips(userId, filter, page, result);

    return result;
  }

  /**
   * Get standalone items (not associated with trips)
   * @param {string} userId - User ID
   * @param {Object} dateFilter - Sequelize date filter
   * @returns {Promise<Object>} { flights, events }
   */
  async getStandaloneItems(userId, dateFilter = {}) {
    logger.debug(`${this.modelName}: Getting standalone items for user ${userId}`);

    const flights = await Flight.findAll({
      where: {
        userId,
        tripId: null,
        ...(dateFilter.departureDate && { departureDateTime: dateFilter.departureDate }),
      },
      order: [['departureDateTime', 'ASC']],
    });

    const events = await Event.findAll({
      where: {
        userId,
        tripId: null,
        ...(dateFilter.departureDate && { startDateTime: dateFilter.departureDate }),
      },
      order: [['startDateTime', 'ASC']],
    });

    return { flights, events };
  }

  /**
   * Get trip with all related data
   * @param {string} tripId - Trip ID
   * @param {string} userId - User ID (for ownership verification)
   * @returns {Promise<Object|null>}
   */
  async getTripWithDetails(tripId, userId) {
    const trip = await Trip.findByPk(tripId, {
      include: this.getTripIncludes(),
    });

    if (!trip) {
      logger.warn('Trip not found:', { tripId });
      return null;
    }

    // Verify ownership or companion access
    const isOwner = trip.userId === userId;
    const isCompanion = trip.tripCompanions?.some((tc) => tc.companion?.userId === userId);

    if (!isOwner && !isCompanion) {
      logger.warn('Trip access denied:', { tripId, userId });
      return null;
    }

    return trip;
  }

  /**
   * Create a new trip
   * @param {Object} data - Trip data
   * @param {string} userId - User ID
   * @returns {Promise<Object>}
   */
  async createTrip(data, userId) {
    const tripData = {
      ...data,
      userId,
    };

    const trip = await this.create(tripData);
    logger.info('Trip created:', { tripId: trip.id, userId });

    // Invalidate user caches
    await cacheService.invalidateUserTrips(userId);
    await cacheService.invalidateTripStats(userId);

    return trip;
  }

  /**
   * Update a trip
   * @param {string} tripId - Trip ID
   * @param {Object} data - Updated trip data
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>}
   */
  async updateTrip(tripId, data, userId) {
    const trip = await this.findByIdAndVerifyOwnership(tripId, userId);

    if (!trip) {
      return null;
    }

    await this.update(trip, data);
    logger.info('Trip updated:', { tripId, userId });

    // Invalidate caches
    await cacheService.invalidateUserTrips(userId);
    await cacheService.invalidateTripDetails(tripId);
    await cacheService.invalidateTripStats(userId);

    return trip;
  }

  /**
   * Delete a trip
   * @param {string} tripId - Trip ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>}
   */
  async deleteTrip(tripId, userId) {
    const trip = await this.findByIdAndVerifyOwnership(tripId, userId);

    if (!trip) {
      return false;
    }

    // Delete all associated item companions
    await ItemCompanion.destroy({
      where: { tripId },
    });

    // Delete all trip companions
    await TripCompanion.destroy({
      where: { tripId },
    });

    await this.delete(trip);
    logger.info('Trip deleted:', { tripId, userId });

    // Invalidate caches
    await cacheService.invalidateUserTrips(userId);
    await cacheService.invalidateTripDetails(tripId);
    await cacheService.invalidateTripStats(userId);

    return true;
  }

  /**
   * Get trip statistics for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>}
   */
  async getTripStatistics(userId) {
    // Try to get from cache first
    const cached = await cacheService.getCachedTripStats(userId);
    if (cached) {
      logger.debug('Cache HIT: Trip statistics', { userId });
      return cached;
    }

    logger.debug('Cache MISS: Trip statistics', { userId });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalTrips, upcomingTrips, pastTrips, activeTrips] = await Promise.all([
      this.count({ userId }),
      this.count({ userId, departureDate: { [Op.gte]: today } }),
      this.count({ userId, returnDate: { [Op.lt]: today } }),
      this.count({
        userId,
        departureDate: { [Op.lte]: today },
        returnDate: { [Op.gte]: today },
      }),
    ]);

    const result = {
      totalTrips,
      upcomingTrips,
      pastTrips,
      activeTrips,
    };

    // Cache the result
    await cacheService.cacheTripStats(userId, result);

    return result;
  }

  /**
   * Search trips by name or destination
   * @param {string} userId - User ID
   * @param {string} query - Search query
   * @param {number} limit - Max results
   * @returns {Promise<Array>}
   */
  async searchTrips(userId, query, limit = 10) {
    const searchTerm = query.toLowerCase().trim();

    logger.debug(`${this.modelName}: Searching trips for user ${userId} with query: ${query}`);

    const trips = await this.model.findAll({
      where: {
        userId,
        [Op.or]: [
          { name: { [Op.iLike]: `%${searchTerm}%` } },
          { destination: { [Op.iLike]: `%${searchTerm}%` } },
        ],
      },
      limit,
      order: [['departureDate', 'DESC']],
    });

    return trips;
  }
}

module.exports = new TripService();
