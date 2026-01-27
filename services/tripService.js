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
  ItemTrip,
  User,
  ItemCompanion,
} = require('../models');
const logger = require('../utils/logger');
const cacheService = require('./cacheService');
const { sortCompanions } = require('../utils/itemCompanionHelper');
// Note: These services will be used in Phase 3 continuation for getAccessibleTripIds and permission-aware queries
// const ItemTripService = require('./itemTripService');
// const itemTripService = new ItemTripService();
class TripService extends BaseService {
  constructor() {
    super(Trip, 'Trip');
  }

  /**
   * Get common include structure for trips (legacy - uses TripCompanion)
   * @returns {Array} Sequelize include array
   */
  getTripIncludes() {
    // Using a method instead of static to allow potential future customization per instance
    return [
      {
        model: Flight,
        as: 'flights',
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          },
        ],
      },
      {
        model: Hotel,
        as: 'hotels',
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          },
        ],
      },
      {
        model: Transportation,
        as: 'transportation',
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          },
        ],
      },
      {
        model: CarRental,
        as: 'carRentals',
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          },
        ],
      },
      {
        model: Event,
        as: 'events',
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          },
        ],
      },
      {
        model: TripCompanion,
        as: 'tripCompanions',
        attributes: ['id', 'tripId', 'companionId', 'canEdit', 'permissionSource'],
        include: [
          {
            model: TravelCompanion,
            as: 'companion',
            attributes: ['id', 'firstName', 'lastName', 'email', 'userId'],
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
   * Get items for a trip using ItemTrip junction table
   * @param {string} tripId - Trip ID
   * @returns {Promise<Object>} { flights, hotels, events, transportation, carRentals }
   */
  async getTripItemsFromJunction(tripId) {
    // Get all itemIds for this trip from ItemTrip
    const itemTripRecords = await ItemTrip.findAll({
      where: { tripId },
      attributes: ['itemId', 'itemType'],
      raw: true,
    });
    // Group by item type
    const itemsByType = {
      flight: [],
      hotel: [],
      event: [],
      transportation: [],
      car_rental: [],
    };
    itemTripRecords.forEach((record) => {
      itemsByType[record.itemType].push(record.itemId);
    });
    // Fetch each item type
    const [flights, hotels, events, transportation, carRentals] = await Promise.all([
      itemsByType.flight.length > 0
        ? Flight.findAll({ where: { id: { [Op.in]: itemsByType.flight } } })
        : [],
      itemsByType.hotel.length > 0
        ? Hotel.findAll({ where: { id: { [Op.in]: itemsByType.hotel } } })
        : [],
      itemsByType.event.length > 0
        ? Event.findAll({ where: { id: { [Op.in]: itemsByType.event } } })
        : [],
      itemsByType.transportation.length > 0
        ? Transportation.findAll({ where: { id: { [Op.in]: itemsByType.transportation } } })
        : [],
      itemsByType.car_rental.length > 0
        ? CarRental.findAll({ where: { id: { [Op.in]: itemsByType.car_rental } } })
        : [],
    ]);
    return {
      flights,
      hotels,
      events,
      transportation,
      carRentals,
    };
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
    // Need to find companions by BOTH userId (if account exists) AND email (for linking)
    let companionTrips = [];

    // Get user email for companion matching
    const currentUser = await User.findByPk(userId, {
      attributes: ['id', 'email'],
    });

    if (currentUser) {
      // Find all TravelCompanion records that reference this user
      const userCompanionRecords = await TravelCompanion.findAll({
        where: {
          [Op.or]: [
            { userId }, // User's own TravelCompanion record(s)
            { email: currentUser.email }, // Companions created with this user's email (before they registered)
          ],
        },
      });

      if (userCompanionRecords.length > 0) {
        const companionIds = userCompanionRecords.map((c) => c.id);
        const tripsWithCompanion = await TripCompanion.findAll({
          where: { companionId: { [Op.in]: companionIds } },
        });
        const tripIds = tripsWithCompanion.map((tc) => tc.tripId);
        if (tripIds.length > 0) {
          companionTrips = await Trip.findAll({
            where: {
              id: { [Op.in]: tripIds },
              ...dateFilter,
            },
            include: tripIncludes,
            order: [['departureDate', orderDirection]],
          });
        }
      }
    }
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
        json.canEdit = item.canEdit;
        json.canDelete = item.canDelete;
        json.isShared = item.isShared;
        return json;
      }),
      hotels: standaloneItems.hotels.map((item) => {
        const json = item.toJSON();
        json.itemCompanions = item.itemCompanions || [];
        json.canEdit = item.canEdit;
        json.canDelete = item.canDelete;
        json.isShared = item.isShared;
        return json;
      }),
      transportation: standaloneItems.transportation.map((item) => {
        const json = item.toJSON();
        json.itemCompanions = item.itemCompanions || [];
        json.canEdit = item.canEdit;
        json.canDelete = item.canDelete;
        json.isShared = item.isShared;
        return json;
      }),
      carRentals: standaloneItems.carRentals.map((item) => {
        const json = item.toJSON();
        json.itemCompanions = item.itemCompanions || [];
        json.canEdit = item.canEdit;
        json.canDelete = item.canDelete;
        json.isShared = item.isShared;
        return json;
      }),
      events: standaloneItems.events.map((item) => {
        const json = item.toJSON();
        json.itemCompanions = item.itemCompanions || [];
        json.canEdit = item.canEdit;
        json.canDelete = item.canDelete;
        json.isShared = item.isShared;
        // Determine if event is all-day based on time values (use UTC since dates are ISO strings)
        if (json.startDateTime && json.endDateTime) {
          const startDate = new Date(json.startDateTime);
          const endDate = new Date(json.endDateTime);
          const startHours = startDate.getUTCHours();
          const startMinutes = startDate.getUTCMinutes();
          const endHours = endDate.getUTCHours();
          const endMinutes = endDate.getUTCMinutes();
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
    // Process trips to ensure owner is always in tripCompanions
    const processTripsWithOwner = async (trips) => {
      return Promise.all(
        trips.map(async (trip) => {
          const tripJson = addIsAllDayToTrip(trip.toJSON());
          // Ensure trip owner is included in tripCompanions
          const ownerInCompanions = tripJson.tripCompanions?.some(
            (tc) => tc.companion?.userId === trip.userId
          );
          if (!ownerInCompanions && trip.userId) {
            // Find the owner's TravelCompanion record
            let ownerCompanion = await TravelCompanion.findOne({
              where: { userId: trip.userId },
              include: [
                {
                  model: User,
                  as: 'linkedAccount',
                  attributes: ['id', 'firstName', 'lastName'],
                },
              ],
            });
            // If no TravelCompanion exists, fetch the User directly
            if (!ownerCompanion) {
              const user = await User.findByPk(trip.userId, {
                attributes: ['id', 'firstName', 'lastName', 'email'],
              });
              if (user) {
                ownerCompanion = {
                  id: `virtual-companion-${user.id}`,
                  userId: user.id,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  email: user.email,
                  name: `${user.firstName} ${user.lastName}`.trim(),
                  toJSON: () => ({
                    id: `virtual-companion-${user.id}`,
                    userId: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    name: `${user.firstName} ${user.lastName}`.trim(),
                  }),
                };
              }
            }
            if (ownerCompanion) {
              if (!tripJson.tripCompanions) {
                tripJson.tripCompanions = [];
              }
              // Add owner as first companion
              tripJson.tripCompanions.unshift({
                id: `virtual-owner-${trip.userId}`,
                tripId: trip.id,
                companionId: ownerCompanion.id,
                companion: ownerCompanion.toJSON ? ownerCompanion.toJSON() : ownerCompanion,
                permissionSource: 'owner',
                canAddItems: true,
              });
            }
          }
          return tripJson;
        })
      );
    };
    const result = {
      ownedTrips: await processTripsWithOwner(ownedTrips),
      companionTrips: await processTripsWithOwner(companionTrips),
      standalone: convertedStandalone,
      pagination,
    };
    return result;
  }

  /**
   * Get standalone items (not associated with trips)
   * @param {string} userId - User ID
   * @param {Object} dateFilter - Sequelize date filter
   * @returns {Promise<Object>} { flights, hotels, transportation, carRentals, events }
   */
  async getStandaloneItems(userId, dateFilter = {}) {
    // Get the user's TravelCompanion record(s) to find items shared with them
    // Need to check both by userId AND email (for companions added before user registered)
    let userCompanionIds = [];

    // Get user email
    const currentUser = await User.findByPk(userId, {
      attributes: ['id', 'email'],
    });

    if (currentUser) {
      // Find all TravelCompanion records matching this user
      const userCompanionRecords = await TravelCompanion.findAll({
        where: {
          [Op.or]: [
            { userId }, // User's own TravelCompanion record(s)
            { email: currentUser.email }, // Companions created with this user's email (before they registered)
          ],
        },
        attributes: ['id'],
      });
      userCompanionIds = userCompanionRecords.map((c) => c.id);
    }

    // Helper function to get shared item IDs for a given item type
    const getSharedItemIds = async (itemType) => {
      if (userCompanionIds.length === 0) return [];
      const sharedCompanions = await ItemCompanion.findAll({
        attributes: ['itemId'],
        where: {
          companionId: { [Op.in]: userCompanionIds },
          itemType,
        },
      });
      return sharedCompanions.map((ic) => ic.itemId);
    };
    // Build OR condition for owned OR shared items
    const buildWhereCondition = (sharedIds) => {
      const orConditions = [{ userId }];
      if (sharedIds && sharedIds.length > 0) {
        orConditions.push({ id: { [Op.in]: sharedIds } });
      }
      return {
        tripId: null,
        [Op.or]: orConditions,
      };
    };
    // Get shared item IDs for each type (in parallel for performance)
    const [
      flightSharedIds,
      hotelSharedIds,
      transportationSharedIds,
      carRentalSharedIds,
      eventSharedIds,
    ] = await Promise.all([
      getSharedItemIds('flight'),
      getSharedItemIds('hotel'),
      getSharedItemIds('transportation'),
      getSharedItemIds('car_rental'),
      getSharedItemIds('event'),
    ]);
    const flights = await Flight.findAll({
      where: {
        ...buildWhereCondition(flightSharedIds),
        ...(dateFilter.departureDate && {
          departureDateTime: { [Op.gte]: dateFilter.departureDate },
        }),
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['departureDateTime', 'ASC']],
    });
    const hotels = await Hotel.findAll({
      where: {
        ...buildWhereCondition(hotelSharedIds),
        ...(dateFilter.departureDate && {
          checkOutDateTime: { [Op.gte]: dateFilter.departureDate },
        }),
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['checkInDateTime', 'ASC']],
    });
    const transportation = await Transportation.findAll({
      where: {
        ...buildWhereCondition(transportationSharedIds),
        ...(dateFilter.departureDate && {
          departureDateTime: { [Op.gte]: dateFilter.departureDate },
        }),
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['departureDateTime', 'ASC']],
    });
    const carRentals = await CarRental.findAll({
      where: {
        ...buildWhereCondition(carRentalSharedIds),
        ...(dateFilter.departureDate && {
          dropoffDateTime: { [Op.gte]: dateFilter.departureDate },
        }),
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['pickupDateTime', 'ASC']],
    });
    const events = await Event.findAll({
      where: {
        ...buildWhereCondition(eventSharedIds),
        ...(dateFilter.departureDate && { startDateTime: { [Op.gte]: dateFilter.departureDate } }),
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
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
              attributes: ['id', 'email', 'firstName', 'lastName', 'name', 'userId'],
            },
          ],
        });
        // Handle case where companions might be undefined (e.g., in tests)
        if (!Array.isArray(companions)) {
          return;
        }
        // Create a map of itemId -> companions for quick lookup
        const companionsByItemId = {};
        // Also create a map of itemId -> if it's shared with current user
        const sharedItemsMap = {};
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
            userId: ic.companion?.userId,
            inheritedFromTrip: ic.inheritedFromTrip,
          });
          // Mark if this item is shared with the current user
          if (userCompanionIds.includes(ic.companionId)) {
            sharedItemsMap[ic.itemId] = true;
          }
        });
        // Attach companions to each item and add permission metadata
        items.forEach((item) => {
          item.itemCompanions = companionsByItemId[item.id] || [];

          // Add the item owner as the first companion if they have user data
          if (item.user && item.userId) {
            const ownerCompanion = {
              id: item.user.id,
              email: item.user.email,
              firstName: item.user.firstName,
              lastName: item.user.lastName,
              name:
                item.user.firstName && item.user.lastName
                  ? `${item.user.firstName} ${item.user.lastName}`
                  : item.user.email,
              userId: item.user.id,
              isOwner: true,
              inheritedFromTrip: false,
            };
            // Only add owner if not already in companions list
            const ownerExists = item.itemCompanions.some((c) => c.userId === item.userId);
            if (!ownerExists) {
              item.itemCompanions.unshift(ownerCompanion);
            }
          }

          // Add permission flags
          const isItemOwner = item.userId === userId;
          const isSharedWithUser = sharedItemsMap[item.id];
          item.canEdit = isItemOwner;
          item.canDelete = isItemOwner;
          item.isShared = isSharedWithUser && !isItemOwner;
        });
      } catch (error) {
        // Log error but don't fail - companions loading is not critical
        // Ensure items have empty companions array
        items.forEach((item) => {
          if (!item.itemCompanions) {
            item.itemCompanions = [];
          }
          // Add default permission flags even on error
          item.canEdit = item.userId === userId;
          item.canDelete = item.userId === userId;
          item.isShared = false;
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
    const trip = await Trip.findByPk(tripId, {
      include: this.getTripIncludes(),
    });
    if (!trip) {
      logger.warn('Trip not found:', { tripId });
      return null;
    }
    // Verify ownership or companion access
    const isOwner = trip.userId === userId;

    // Check if user is a companion - need to check both by userId AND email
    let isCompanion = trip.tripCompanions?.some((tc) => tc.companion?.userId === userId);

    if (!isCompanion) {
      // Also check by email (for companions added before user registered)
      const currentUser = await User.findByPk(userId, {
        attributes: ['id', 'email'],
      });
      if (currentUser) {
        isCompanion = trip.tripCompanions?.some((tc) => tc.companion?.email === currentUser.email);
      }
    }

    if (!isOwner && !isCompanion) {
      logger.warn('Trip access denied:', { tripId, userId });
      return null;
    }
    // Convert to plain JSON object to ensure associated items are serialized
    const tripData = trip.toJSON();

    // Ensure trip owner is included in tripCompanions
    // (some older trips may not have the owner in the trip_companions table)
    const ownerInCompanions = tripData.tripCompanions?.some(
      (tc) => tc.companion?.userId === trip.userId
    );
    if (!ownerInCompanions && trip.userId) {
      // Find or create a TravelCompanion record for the owner
      let ownerCompanion = await TravelCompanion.findOne({
        where: { userId: trip.userId },
        include: [
          {
            model: User,
            as: 'linkedAccount',
            attributes: ['id', 'firstName', 'lastName'],
          },
        ],
      });
      // If no TravelCompanion exists, fetch the User directly
      if (!ownerCompanion) {
        const user = await User.findByPk(trip.userId, {
          attributes: ['id', 'firstName', 'lastName', 'email'],
        });
        if (user) {
          ownerCompanion = {
            id: `virtual-companion-${user.id}`,
            userId: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`.trim(),
            toJSON: () => ({
              id: `virtual-companion-${user.id}`,
              userId: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              name: `${user.firstName} ${user.lastName}`.trim(),
            }),
          };
        }
      }
      if (ownerCompanion) {
        // Add owner as a virtual trip companion
        if (!tripData.tripCompanions) {
          tripData.tripCompanions = [];
        }
        tripData.tripCompanions.unshift({
          id: `virtual-owner-${trip.userId}`,
          tripId: trip.id,
          companionId: ownerCompanion.id,
          companion: ownerCompanion.toJSON ? ownerCompanion.toJSON() : ownerCompanion,
          permissionSource: 'owner',
          canEdit: true,
          canAddItems: true,
        });
      }
    }
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
            attributes: ['id', 'email', 'firstName', 'lastName', 'name', 'userId'],
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
          userId: ic.companion?.userId,
          inheritedFromTrip: ic.inheritedFromTrip,
        });
      });
      // Attach companions to each item and add permission metadata
      items.forEach((item) => {
        item.itemCompanions = companionsByItemId[item.id] || [];

        // Add the item owner as the first companion if they have user data
        if (item.user && item.userId) {
          const ownerCompanion = {
            id: item.user.id,
            email: item.user.email,
            firstName: item.user.firstName,
            lastName: item.user.lastName,
            name:
              item.user.firstName && item.user.lastName
                ? `${item.user.firstName} ${item.user.lastName}`
                : item.user.email,
            userId: item.user.id,
            isOwner: true,
            inheritedFromTrip: false,
          };
          // Only add owner if not already in companions list
          const ownerExists = item.itemCompanions.some((c) => c.userId === item.userId);
          if (!ownerExists) {
            item.itemCompanions.unshift(ownerCompanion);
          }
        }

        // Add permission flags
        // For trip items: owner can edit, companions with canEdit on trip can also edit all items
        const isItemOwner = item.userId === userId;
        const isCompanionAttendeeThroughItem = item.itemCompanions?.some(
          (ic) => ic.userId === userId
        );
        // Check if user is a trip companion with canEdit permission
        const tripCompanionWithEdit = tripData.tripCompanions?.some((tc) => {
          const companionUserId = tc.companion?.userId;
          const canEditValue = tc.canEdit;
          const matches = companionUserId === userId && canEditValue === true;
          return matches;
        });
        item.canEdit = isItemOwner || tripCompanionWithEdit;
        item.canDelete = isItemOwner || tripCompanionWithEdit;
        item.isShared = !isItemOwner && isCompanionAttendeeThroughItem;
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
      return cached;
    }
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
    // Transform to simpler format and filter null companions
    const companionList = companions
      .filter((tc) => tc.companion !== null)
      .map((tc) => ({
        id: tc.companion.id,
        name: tc.companion.name,
        email: tc.companion.email,
      }));
    // Sort companions: self first, then alphabetically by first name
    const sortedCompanionList = sortCompanions(companionList, userEmail);
    return sortedCompanionList;
  }
}
module.exports = new TripService();
