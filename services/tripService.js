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
const { sortCompanions } = require('../utils/itemCompanionHelper');

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

    // Get standalone items (always fetch them, filter determines which ones)
    let standaloneItems = {};
    standaloneItems = await this.getStandaloneItems(userId, dateFilter);

    // Calculate pagination metadata
    const pagination = {
      currentPage: page,
      totalPages: filter === 'past' ? Math.ceil(totalCount / limit) : 1,
      totalCount,
      hasNextPage: filter === 'past' && page < Math.ceil(totalCount / limit),
      hasPrevPage: filter === 'past' && page > 1,
    };

    // Convert trips to plain JSON objects to ensure associated items are serialized
    // Also convert standalone items to JSON to include itemCompanions
    // Must manually include itemCompanions since it's a custom property not in the model schema
    const convertedStandalone = {
      flights: standaloneItems.flights.map((item) => {
        const json = item.toJSON();
        json.itemCompanions = item.itemCompanions || [];
        return json;
      }),
      hotels: standaloneItems.hotels.map((item) => {
        const json = item.toJSON();
        json.itemCompanions = item.itemCompanions || [];
        return json;
      }),
      transportation: standaloneItems.transportation.map((item) => {
        const json = item.toJSON();
        json.itemCompanions = item.itemCompanions || [];
        return json;
      }),
      carRentals: standaloneItems.carRentals.map((item) => {
        const json = item.toJSON();
        json.itemCompanions = item.itemCompanions || [];
        return json;
      }),
      events: standaloneItems.events.map((item) => {
        const json = item.toJSON();
        json.itemCompanions = item.itemCompanions || [];
        // Determine if event is all-day based on time values (use UTC since dates are ISO strings)
        if (json.startDateTime && json.endDateTime) {
          const startDate = new Date(json.startDateTime);
          const endDate = new Date(json.endDateTime);
          const startHours = startDate.getUTCHours();
          const startMinutes = startDate.getUTCMinutes();
          const endHours = endDate.getUTCHours();
          const endMinutes = endDate.getUTCMinutes();
          logger.debug(
            `Event ${json.name}: start=${json.startDateTime} (UTC: ${startHours}:${startMinutes}), end=${json.endDateTime} (UTC: ${endHours}:${endMinutes})`
          );
          json.isAllDay =
            startHours === 0 && startMinutes === 0 && endHours === 23 && endMinutes === 59;
        } else {
          json.isAllDay = false;
        }
        return json;
      }),
    };

    // Helper function to add isAllDay flag to events
    const addIsAllDayToTrip = (trip) => {
      if (trip.events && Array.isArray(trip.events)) {
        trip.events.forEach((event) => {
          if (event.startDateTime && event.endDateTime) {
            const startDate = new Date(event.startDateTime);
            const endDate = new Date(event.endDateTime);
            const startHours = startDate.getUTCHours();
            const startMinutes = startDate.getUTCMinutes();
            const endHours = endDate.getUTCHours();
            const endMinutes = endDate.getUTCMinutes();
            event.isAllDay =
              startHours === 0 && startMinutes === 0 && endHours === 23 && endMinutes === 59;
          } else {
            event.isAllDay = false;
          }
        });
      }
      return trip;
    };

    const result = {
      ownedTrips: ownedTrips.map((trip) => addIsAllDayToTrip(trip.toJSON())),
      companionTrips: companionTrips.map((trip) => addIsAllDayToTrip(trip.toJSON())),
      standalone: convertedStandalone,
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
   * @returns {Promise<Object>} { flights, hotels, transportation, carRentals, events }
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

    const hotels = await Hotel.findAll({
      where: {
        userId,
        tripId: null,
        ...(dateFilter.departureDate && { checkOutDateTime: dateFilter.departureDate }),
      },
      order: [['checkInDateTime', 'ASC']],
    });

    const transportation = await Transportation.findAll({
      where: {
        userId,
        tripId: null,
        ...(dateFilter.departureDate && { departureDateTime: dateFilter.departureDate }),
      },
      order: [['departureDateTime', 'ASC']],
    });

    const carRentals = await CarRental.findAll({
      where: {
        userId,
        tripId: null,
        ...(dateFilter.departureDate && { dropoffDateTime: dateFilter.departureDate }),
      },
      order: [['pickupDateTime', 'ASC']],
    });

    const events = await Event.findAll({
      where: {
        userId,
        tripId: null,
        ...(dateFilter.departureDate && { startDateTime: dateFilter.departureDate }),
      },
      order: [['startDateTime', 'ASC']],
    });

    // Load item companions for standalone items (same pattern as getTripWithDetails)
    const loadAndTransformItemCompanions = async (items, itemType) => {
      if (!Array.isArray(items) || items.length === 0) {
        return;
      }

      try {
        const itemIds = items.map((item) => item.id);

        // Fetch all companions for these items
        const companions = await ItemCompanion.findAll({
          where: {
            itemType,
            itemId: itemIds,
          },
          include: [
            {
              model: TravelCompanion,
              as: 'companion',
              attributes: ['id', 'email', 'firstName', 'lastName', 'name'],
            },
          ],
        });

        // Handle case where companions might be undefined (e.g., in tests)
        if (!Array.isArray(companions)) {
          return;
        }

        // Create a map of itemId -> companions for quick lookup
        const companionsByItemId = {};
        companions.forEach((ic) => {
          if (!companionsByItemId[ic.itemId]) {
            companionsByItemId[ic.itemId] = [];
          }
          companionsByItemId[ic.itemId].push({
            id: ic.companion?.id,
            email: ic.companion?.email,
            firstName: ic.companion?.firstName,
            lastName: ic.companion?.lastName,
            name: ic.companion?.name,
            inheritedFromTrip: ic.inheritedFromTrip,
          });
        });

        // Attach companions to each item
        items.forEach((item) => {
          item.itemCompanions = companionsByItemId[item.id] || [];
        });
      } catch (error) {
        // Log error but don't fail - companions loading is not critical
        logger.debug(`Error loading item companions for type ${itemType}:`, error);
        // Ensure items have empty companions array
        items.forEach((item) => {
          if (!item.itemCompanions) {
            item.itemCompanions = [];
          }
        });
      }
    };

    // Load companions for all standalone item types in parallel
    await Promise.all([
      loadAndTransformItemCompanions(flights, 'flight'),
      loadAndTransformItemCompanions(hotels, 'hotel'),
      loadAndTransformItemCompanions(transportation, 'transportation'),
      loadAndTransformItemCompanions(carRentals, 'car_rental'),
      loadAndTransformItemCompanions(events, 'event'),
    ]);

    return { flights, hotels, transportation, carRentals, events };
  }

  /**
   * Get trip with all related data
   * @param {string} tripId - Trip ID
   * @param {string} userId - User ID (for ownership verification)
   * @returns {Promise<Object|null>}
   */
  async getTripWithDetails(tripId, userId) {
    logger.debug('getTripWithDetails - Starting', { tripId, userId });
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

    logger.debug('getTripWithDetails - Trip found, converting to JSON', {
      tripId,
      tripName: trip.name,
      flightCount: trip.flights?.length || 0,
      hotelCount: trip.hotels?.length || 0,
      eventCount: trip.events?.length || 0,
    });

    // Convert to plain JSON object to ensure associated items are serialized
    const tripData = trip.toJSON();

    // Load item companions for all items in the trip (polymorphic relationship)
    // Note: ItemCompanion uses itemType and itemId fields, not Sequelize associations
    const loadAndTransformItemCompanions = async (items, itemType) => {
      if (!Array.isArray(items) || items.length === 0) {
        return;
      }

      const itemIds = items.map((item) => item.id);

      // Fetch all companions for these items
      const companions = await ItemCompanion.findAll({
        where: {
          itemType,
          itemId: itemIds,
        },
        include: [
          {
            model: TravelCompanion,
            as: 'companion',
            attributes: ['id', 'email', 'firstName', 'lastName', 'name'],
          },
        ],
      });

      // Create a map of itemId -> companions for quick lookup
      const companionsByItemId = {};
      companions.forEach((ic) => {
        if (!companionsByItemId[ic.itemId]) {
          companionsByItemId[ic.itemId] = [];
        }
        companionsByItemId[ic.itemId].push({
          id: ic.companion?.id,
          email: ic.companion?.email,
          firstName: ic.companion?.firstName,
          lastName: ic.companion?.lastName,
          name: ic.companion?.name,
          inheritedFromTrip: ic.inheritedFromTrip,
        });
      });

      // Attach companions to each item
      items.forEach((item) => {
        item.itemCompanions = companionsByItemId[item.id] || [];
      });
    };

    // Load companions for all item types in parallel
    await Promise.all([
      loadAndTransformItemCompanions(tripData.flights, 'flight'),
      loadAndTransformItemCompanions(tripData.hotels, 'hotel'),
      loadAndTransformItemCompanions(tripData.transportation, 'transportation'),
      loadAndTransformItemCompanions(tripData.carRentals, 'car_rental'),
      loadAndTransformItemCompanions(tripData.events, 'event'),
    ]);

    // Add isAllDay flag to all events (use UTC since dates are ISO strings)
    if (tripData.events && Array.isArray(tripData.events)) {
      tripData.events.forEach((event) => {
        if (event.startDateTime && event.endDateTime) {
          const startDate = new Date(event.startDateTime);
          const endDate = new Date(event.endDateTime);
          const startHours = startDate.getUTCHours();
          const startMinutes = startDate.getUTCMinutes();
          const endHours = endDate.getUTCHours();
          const endMinutes = endDate.getUTCMinutes();
          event.isAllDay =
            startHours === 0 && startMinutes === 0 && endHours === 23 && endMinutes === 59;
        } else {
          event.isAllDay = false;
        }
      });
    }

    // Debug: Log companions attached to items
    logger.debug('getTripWithDetails - Companions loaded', {
      tripId,
      tripName: tripData.name,
      flightsWithCompanions:
        tripData.flights?.filter((f) => f.itemCompanions?.length > 0).length || 0,
      hotelsWithCompanions:
        tripData.hotels?.filter((h) => h.itemCompanions?.length > 0).length || 0,
      eventsWithCompanions:
        tripData.events?.filter((e) => e.itemCompanions?.length > 0).length || 0,
    });

    return tripData;
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

  /**
   * Get trip data for API (for async form refresh)
   * @param {string} tripId - Trip ID
   * @param {string} userId - User ID (for ownership verification)
   * @returns {Promise<Object|null>} Trip data with all related items
   * @throws {Error} If trip not found
   */
  async getTripData(tripId, userId) {
    logger.debug(`${this.modelName}: Getting trip data for API`, { tripId, userId });

    const trip = await Trip.findOne({
      where: { id: tripId, userId },
      include: [
        { model: Flight, as: 'flights', order: [['departureDateTime', 'ASC']] },
        { model: Hotel, as: 'hotels', order: [['checkInDateTime', 'ASC']] },
        { model: Transportation, as: 'transportation', order: [['departureDateTime', 'ASC']] },
        { model: CarRental, as: 'carRentals', order: [['pickupDateTime', 'ASC']] },
        { model: Event, as: 'events', order: [['startDateTime', 'ASC']] },
        {
          model: TripCompanion,
          as: 'tripCompanions',
          include: [
            {
              model: TravelCompanion,
              as: 'companion',
              attributes: ['id', 'name', 'email'],
            },
          ],
        },
      ],
    });

    if (!trip) {
      const error = new Error('Trip not found');
      error.status = 404;
      throw error;
    }

    return trip;
  }

  /**
   * Get trip companions for API
   * @param {string} tripId - Trip ID
   * @param {string} userId - User ID (for ownership verification)
   * @param {string} userEmail - User email (for sorting self first)
   * @returns {Promise<Array>} Sorted list of companions
   * @throws {Error} If trip not found or unauthorized
   */
  async getTripCompanions(tripId, userId, userEmail) {
    logger.debug(`${this.modelName}: Getting trip companions for API`, {
      tripId,
      userId,
      userEmail,
    });

    // Verify user owns the trip
    const trip = await Trip.findOne({
      where: { id: tripId, userId },
    });

    if (!trip) {
      const error = new Error('Trip not found');
      error.status = 404;
      throw error;
    }

    // Fetch companions for this trip
    const companions = await TripCompanion.findAll({
      where: { tripId },
      include: [
        {
          model: TravelCompanion,
          as: 'companion',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    logger.debug(`${this.modelName}: Raw TripCompanion records`, {
      count: companions.length,
      companions: companions.map((tc) => ({
        id: tc.id,
        companionId: tc.companionId,
        companion: tc.companion
          ? { id: tc.companion.id, name: tc.companion.name, email: tc.companion.email }
          : 'NULL',
      })),
    });

    // Transform to simpler format and filter null companions
    const companionList = companions
      .filter((tc) => tc.companion !== null)
      .map((tc) => ({
        id: tc.companion.id,
        name: tc.companion.name,
        email: tc.companion.email,
      }));

    logger.debug(`${this.modelName}: Mapped companion list`, {
      count: companionList.length,
      selfEmail: userEmail,
    });

    // Sort companions: self first, then alphabetically by first name
    const sortedCompanionList = sortCompanions(companionList, userEmail);

    logger.debug(`${this.modelName}: Final sorted list`, {
      count: sortedCompanionList.length,
    });

    return sortedCompanionList;
  }
}

module.exports = new TripService();
