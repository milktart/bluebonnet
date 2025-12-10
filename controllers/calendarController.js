const { Op } = require('sequelize');
const {
  Trip,
  Flight,
  Hotel,
  Transportation,
  CarRental,
  Event,
  TripCompanion,
  TravelCompanion,
  User,
  TripInvitation,
} = require('../models');
const logger = require('../utils/logger');
const airportService = require('../services/airportService');
const { formatInTimezone } = require('../utils/timezoneHelper');

/**
 * Get calendar sidebar content
 * Returns all trips and items for calendar display
 */
exports.getCalendarSidebar = async (req, res) => {
  try {
    // Get all trips the user owns or is a companion on
    const tripIncludes = [
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

    // Get trips the user owns
    const ownedTrips = await Trip.findAll({
      where: { userId: req.user.id },
      order: [['departureDate', 'ASC']],
      include: tripIncludes,
    });

    // Get trips where the user is a companion (exclude trips with pending invitations)
    const pendingTripIds = await TripInvitation.findAll({
      where: {
        invitedUserId: req.user.id,
        status: 'pending',
      },
      attributes: ['tripId'],
      raw: true,
    }).then(invitations => invitations.map(inv => inv.tripId));

    const companionTrips = await Trip.findAll({
      where: {
        ...(pendingTripIds.length > 0 && {
          id: {
            [Op.notIn]: pendingTripIds
          }
        })
      },
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
              where: { userId: req.user.id },
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
      order: [['departureDate', 'ASC']],
    });

    // Combine and deduplicate trips
    const allTrips = [...ownedTrips, ...companionTrips];
    const uniqueTrips = allTrips.filter(
      (trip, index, self) => index === self.findIndex((t) => t.id === trip.id)
    );

    // Get all standalone items (not attached to any trip)
    const [standaloneFlights, standaloneHotels, standaloneTransportation, standaloneCarRentals, standaloneEvents] = await Promise.all([
      Flight.findAll({
        where: { userId: req.user.id, tripId: null },
        order: [['departureDateTime', 'ASC']],
      }).catch(() => []),
      Hotel.findAll({
        where: { userId: req.user.id, tripId: null },
        order: [['checkInDateTime', 'ASC']],
      }).catch(() => []),
      Transportation.findAll({
        where: { userId: req.user.id, tripId: null },
        order: [['departureDateTime', 'ASC']],
      }).catch(() => []),
      CarRental.findAll({
        where: { userId: req.user.id, tripId: null },
        order: [['pickupDateTime', 'ASC']],
      }).catch(() => []),
      Event.findAll({
        where: { userId: req.user.id, tripId: null },
        order: [['startDateTime', 'ASC']],
      }).catch(() => []),
    ]);

    // Enrich flights and transportation with airport timezones
    const enrichedTrips = uniqueTrips.map(trip => {
      const tripData = trip.dataValues ? { ...trip.dataValues } : { ...trip.toJSON ? trip.toJSON() : trip };
      if (tripData.flights) {
        tripData.flights = tripData.flights.map(flight => {
          const flightWithTimezone = { ...flight.dataValues || flight };
          const originMatch = flightWithTimezone.origin.match(/^([A-Z]{3})/);
          if (originMatch) {
            const airportData = airportService.getAirportByCode(originMatch[1]);
            if (airportData) {
              flightWithTimezone.originTimezone = airportData.timezone || flightWithTimezone.originTimezone;
            }
          }
          return flightWithTimezone;
        });
      }
      if (tripData.transportation) {
        tripData.transportation = tripData.transportation.map(item => {
          const itemWithTimezone = { ...item.dataValues || item };
          const originMatch = itemWithTimezone.origin.match(/^([A-Z]{3})/);
          if (originMatch) {
            const airportData = airportService.getAirportByCode(originMatch[1]);
            if (airportData) {
              itemWithTimezone.originTimezone = airportData.timezone || itemWithTimezone.originTimezone;
            }
          }
          return itemWithTimezone;
        });
      }
      return tripData;
    });

    // Enrich standalone items with timezones
    const enrichedStandaloneFlights = (standaloneFlights || []).map(flight => {
      const flightData = flight.dataValues || flight;
      const flightWithTimezone = { ...flightData };
      if (flightWithTimezone.origin) {
        const originMatch = flightWithTimezone.origin.match(/^([A-Z]{3})/);
        if (originMatch) {
          const airportData = airportService.getAirportByCode(originMatch[1]);
          if (airportData) {
            flightWithTimezone.originTimezone = airportData.timezone || flightWithTimezone.originTimezone;
          }
        }
      }
      return flightWithTimezone;
    });

    const enrichedStandaloneTransportation = (standaloneTransportation || []).map(item => {
      const itemData = item.dataValues || item;
      const itemWithTimezone = { ...itemData };
      if (itemWithTimezone.origin) {
        const originMatch = itemWithTimezone.origin.match(/^([A-Z]{3})/);
        if (originMatch) {
          const airportData = airportService.getAirportByCode(originMatch[1]);
          if (airportData) {
            itemWithTimezone.originTimezone = airportData.timezone || itemWithTimezone.originTimezone;
          }
        }
      }
      return itemWithTimezone;
    });

    // Aggregate all data for calendar (no longer need current month/year since we show all months)
    const calendarData = {
      trips: enrichedTrips || [],
      standaloneFlights: enrichedStandaloneFlights || [],
      standaloneHotels: standaloneHotels || [],
      standaloneTransportation: enrichedStandaloneTransportation || [],
      standaloneCarRentals: standaloneCarRentals || [],
      standaloneEvents: standaloneEvents || [],
      formatInTimezone,
    };

    logger.debug('Calendar data prepared:', {
      tripsCount: calendarData.trips.length,
      standaloneFlightsCount: calendarData.standaloneFlights.length,
      standaloneHotelsCount: calendarData.standaloneHotels.length,
      standaloneTransportationCount: calendarData.standaloneTransportation.length,
      standaloneCarRentalsCount: calendarData.standaloneCarRentals.length,
      standaloneEventsCount: calendarData.standaloneEvents.length,
    });

    // Debug: log trip details
    logger.debug('=== CALENDAR CONTROLLER TRIPS ===');
    calendarData.trips.forEach(trip => {
      logger.debug('Calendar Trip:', {
        id: trip.id,
        name: trip.name,
        departureDate: trip.departureDate,
        returnDate: trip.returnDate,
        departureType: typeof trip.departureDate,
        returnType: typeof trip.returnDate,
      });
    });

    // Render as partial with minimal HTML wrapper for AJAX injection
    res.render('partials/calendar-sidebar', {
      ...calendarData,
      layout: false, // Don't use main layout
    });
  } catch (error) {
    logger.error('Error fetching calendar sidebar:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    res.status(500).send(`<p class="text-red-600">Error loading calendar: ${error.message}</p>`);
  }
};
