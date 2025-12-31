/**
 * Trip Service
 * Business logic for trip management
 * Phase 3 - Service Layer Pattern
 * Phase 6 - Performance (Caching)
 */

import { Op, FindOptions, IncludeOptions } from 'sequelize';
import BaseService from './BaseService';
import {
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
} from '../models';
import logger from '../utils/logger';
import cacheService from './CacheService';
import { sortCompanions } from '../utils/itemCompanionHelper';

interface TripQueryOptions {
  filter?: string;
  page?: number;
  limit?: number;
}

interface UserTripsResult {
  ownedTrips: any[];
  companionTrips: any[];
  standalone: any;
  pagination: any;
}

interface StandaloneItems {
  flights: any[];
  hotels: any[];
  transportation: any[];
  carRentals: any[];
  events: any[];
}

interface TripStatistics {
  totalTrips: number;
  upcomingTrips: number;
  pastTrips: number;
  activeTrips: number;
}

interface CompanionInfo {
  id: string;
  name: string;
  email: string;
}

export class TripService extends BaseService<Trip> {
  constructor() {
    super(Trip as any, 'Trip');
  }

  /**
   * Get common include structure for trips
   */
  getTripIncludes(): IncludeOptions[] {
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
   */
  async getUserTrips(userId: string, options: TripQueryOptions = {}): Promise<UserTripsResult> {
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
    let dateFilter: any = {};
    let orderDirection: 'ASC' | 'DESC' = 'ASC';

    if (filter === 'upcoming') {
      dateFilter = { departureDate: { [Op.gte]: today } };
      orderDirection = 'ASC';
    } else if (filter === 'past') {
      dateFilter = { returnDate: { [Op.lt]: today } };
      orderDirection = 'DESC';
    }

    const tripIncludes = this.getTripIncludes();

    // Get owned trips (with pagination for past trips)
    const ownedTripsQuery: any = {
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
    let standaloneItems = await this.getStandaloneItems(userId, dateFilter);

    // Calculate pagination metadata
    const pagination = {
      currentPage: page,
      totalPages: filter === 'past' ? Math.ceil(totalCount / limit) : 1,
      totalCount,
      hasNextPage: filter === 'past' && page < Math.ceil(totalCount / limit),
      hasPrevPage: filter === 'past' && page > 1,
    };

    // Convert trips to plain JSON objects
    const convertedStandalone = {
      flights: standaloneItems.flights.map((item: any) => {
        const json = item.toJSON();
        json.itemCompanions = item.itemCompanions || [];
        return json;
      }),
      hotels: standaloneItems.hotels.map((item: any) => {
        const json = item.toJSON();
        json.itemCompanions = item.itemCompanions || [];
        return json;
      }),
      transportation: standaloneItems.transportation.map((item: any) => {
        const json = item.toJSON();
        json.itemCompanions = item.itemCompanions || [];
        return json;
      }),
      carRentals: standaloneItems.carRentals.map((item: any) => {
        const json = item.toJSON();
        json.itemCompanions = item.itemCompanions || [];
        return json;
      }),
      events: standaloneItems.events.map((item: any) => {
        const json = item.toJSON();
        json.itemCompanions = item.itemCompanions || [];
        if (json.startDateTime && json.endDateTime) {
          const startDate = new Date(json.startDateTime);
          const endDate = new Date(json.endDateTime);
          const startHours = startDate.getUTCHours();
          const startMinutes = startDate.getUTCMinutes();
          const endHours = endDate.getUTCHours();
          const endMinutes = endDate.getUTCMinutes();
          json.isAllDay = startHours === 0 && startMinutes === 0 && endHours === 23 && endMinutes === 59;
        } else {
          json.isAllDay = false;
        }
        return json;
      }),
    };

    // Helper function to add isAllDay flag to events
    const addIsAllDayToTrip = (trip: any) => {
      if (trip.events && Array.isArray(trip.events)) {
        trip.events.forEach((event: any) => {
          if (event.startDateTime && event.endDateTime) {
            const startDate = new Date(event.startDateTime);
            const endDate = new Date(event.endDateTime);
            const startHours = startDate.getUTCHours();
            const startMinutes = startDate.getUTCMinutes();
            const endHours = endDate.getUTCHours();
            const endMinutes = endDate.getUTCMinutes();
            event.isAllDay = startHours === 0 && startMinutes === 0 && endHours === 23 && endMinutes === 59;
          } else {
            event.isAllDay = false;
          }
        });
      }
      return trip;
    };

    const result: UserTripsResult = {
      ownedTrips: ownedTrips.map((trip: any) => addIsAllDayToTrip(trip.toJSON())),
      companionTrips: companionTrips.map((trip: any) => addIsAllDayToTrip(trip.toJSON())),
      standalone: convertedStandalone,
      pagination,
    };

    // Cache the result
    await cacheService.cacheUserTrips(userId, filter, page, result);

    return result;
  }

  /**
   * Get standalone items (not associated with trips)
   */
  async getStandaloneItems(userId: string, dateFilter: any = {}): Promise<StandaloneItems> {
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

    // Load item companions for standalone items
    const loadAndTransformItemCompanions = async (items: any[], itemType: string): Promise<void> => {
      if (!Array.isArray(items) || items.length === 0) {
        return;
      }

      try {
        const itemIds = items.map((item: any) => item.id);

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

        if (!Array.isArray(companions)) {
          return;
        }

        const companionsByItemId: { [key: string]: any[] } = {};
        companions.forEach((ic: any) => {
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

        items.forEach((item: any) => {
          item.itemCompanions = companionsByItemId[item.id] || [];
        });
      } catch (error) {
        logger.debug(`Error loading item companions for type ${itemType}:`, error);
        items.forEach((item: any) => {
          if (!item.itemCompanions) {
            item.itemCompanions = [];
          }
        });
      }
    };

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
   */
  async getTripWithDetails(tripId: string, userId: string): Promise<any> {
    logger.debug('getTripWithDetails - Starting', { tripId, userId });
    const trip = await Trip.findByPk(tripId, {
      include: this.getTripIncludes(),
    });

    if (!trip) {
      logger.warn('Trip not found:', { tripId });
      return null;
    }

    // Verify ownership or companion access
    const isOwner = (trip as any).userId === userId;
    const isCompanion = (trip as any).tripCompanions?.some((tc: any) => tc.companion?.userId === userId);

    if (!isOwner && !isCompanion) {
      logger.warn('Trip access denied:', { tripId, userId });
      return null;
    }

    logger.debug('getTripWithDetails - Trip found, converting to JSON', {
      tripId,
      tripName: (trip as any).name,
      flightCount: (trip as any).flights?.length || 0,
      hotelCount: (trip as any).hotels?.length || 0,
      eventCount: (trip as any).events?.length || 0,
    });

    const tripData = (trip as any).toJSON();

    // Load item companions for all items in the trip
    const loadAndTransformItemCompanions = async (items: any[], itemType: string): Promise<void> => {
      if (!Array.isArray(items) || items.length === 0) {
        return;
      }

      const itemIds = items.map((item: any) => item.id);

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

      const companionsByItemId: { [key: string]: any[] } = {};
      companions.forEach((ic: any) => {
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

      items.forEach((item: any) => {
        item.itemCompanions = companionsByItemId[item.id] || [];
      });
    };

    await Promise.all([
      loadAndTransformItemCompanions(tripData.flights, 'flight'),
      loadAndTransformItemCompanions(tripData.hotels, 'hotel'),
      loadAndTransformItemCompanions(tripData.transportation, 'transportation'),
      loadAndTransformItemCompanions(tripData.carRentals, 'car_rental'),
      loadAndTransformItemCompanions(tripData.events, 'event'),
    ]);

    // Add isAllDay flag to all events
    if (tripData.events && Array.isArray(tripData.events)) {
      tripData.events.forEach((event: any) => {
        if (event.startDateTime && event.endDateTime) {
          const startDate = new Date(event.startDateTime);
          const endDate = new Date(event.endDateTime);
          const startHours = startDate.getUTCHours();
          const startMinutes = startDate.getUTCMinutes();
          const endHours = endDate.getUTCHours();
          const endMinutes = endDate.getUTCMinutes();
          event.isAllDay = startHours === 0 && startMinutes === 0 && endHours === 23 && endMinutes === 59;
        } else {
          event.isAllDay = false;
        }
      });
    }

    logger.debug('getTripWithDetails - Companions loaded', {
      tripId,
      tripName: tripData.name,
      flightsWithCompanions: tripData.flights?.filter((f: any) => f.itemCompanions?.length > 0).length || 0,
      hotelsWithCompanions: tripData.hotels?.filter((h: any) => h.itemCompanions?.length > 0).length || 0,
      eventsWithCompanions: tripData.events?.filter((e: any) => e.itemCompanions?.length > 0).length || 0,
    });

    return tripData;
  }

  /**
   * Create a new trip
   */
  async createTrip(data: Record<string, any>, userId: string): Promise<Trip> {
    const tripData = {
      ...data,
      userId,
    };

    const trip = await this.create(tripData);
    logger.info('Trip created:', { tripId: (trip as any).id, userId });

    // Invalidate user caches
    await cacheService.invalidateUserTrips(userId);
    await cacheService.invalidateTripStats(userId);

    return trip;
  }

  /**
   * Update a trip
   */
  async updateTrip(tripId: string, data: Record<string, any>, userId: string): Promise<Trip | null> {
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
   */
  async deleteTrip(tripId: string, userId: string): Promise<boolean> {
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
   */
  async getTripStatistics(userId: string): Promise<TripStatistics> {
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

    const result: TripStatistics = {
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
   */
  async searchTrips(userId: string, query: string, limit: number = 10): Promise<Trip[]> {
    const searchTerm = query.toLowerCase().trim();

    logger.debug(`${this.modelName}: Searching trips for user ${userId} with query: ${query}`);

    const trips = await (this.model as any).findAll({
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
   */
  async getTripData(tripId: string, userId: string): Promise<any> {
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
      const error: any = new Error('Trip not found');
      error.status = 404;
      throw error;
    }

    return trip;
  }

  /**
   * Get trip companions for API
   */
  async getTripCompanions(tripId: string, userId: string, userEmail: string): Promise<CompanionInfo[]> {
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
      const error: any = new Error('Trip not found');
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
      companions: companions.map((tc: any) => ({
        id: tc.id,
        companionId: tc.companionId,
        companion: tc.companion
          ? { id: tc.companion.id, name: tc.companion.name, email: tc.companion.email }
          : 'NULL',
      })),
    });

    // Transform to simpler format and filter null companions
    const companionList: CompanionInfo[] = companions
      .filter((tc: any) => tc.companion !== null)
      .map((tc: any) => ({
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

export const tripService = new TripService();
export default tripService;
