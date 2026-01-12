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
  TripInvitation,
} = require('../models');
const logger = require('../utils/logger');
const airportService = require('../services/airportService');

/**
 * Get calendar sidebar content
 * Returns all trips and items for calendar display
 */
exports.getCalendarSidebar = async (req, res) => {
  try {
    // Simplified includes - only fetch what we need for calendar display
    const minimalTripIncludes = [
      {
        model: Flight,
        as: 'flights',
        attributes: [
          'id',
          'tripId',
          'departureDateTime',
          'arrivalDateTime',
          'origin',
          'destination',
          'originTimezone',
          'destinationTimezone',
        ],
      },
      {
        model: Hotel,
        as: 'hotels',
        attributes: [
          'id',
          'tripId',
          'checkInDateTime',
          'checkOutDateTime',
          'hotelName',
          'address',
          'phone',
        ],
      },
      {
        model: Transportation,
        as: 'transportation',
        attributes: [
          'id',
          'tripId',
          'departureDateTime',
          'arrivalDateTime',
          'origin',
          'destination',
          'method',
          'originTimezone',
          'destinationTimezone',
        ],
      },
      {
        model: CarRental,
        as: 'carRentals',
        attributes: ['id', 'tripId', 'pickupDateTime', 'dropoffDateTime', 'company'],
      },
      {
        model: Event,
        as: 'events',
        attributes: ['id', 'tripId', 'startDateTime', 'endDateTime', 'name', 'isConfirmed'],
      },
    ];

    // Get trips the user owns - simpler query without companion details
    const ownedTrips = await Trip.findAll({
      where: { userId: req.user.id },
      attributes: ['id', 'name', 'departureDate', 'returnDate', 'userId', 'purpose', 'isConfirmed'],
      order: [['departureDate', 'ASC']],
      include: minimalTripIncludes,
    });

    // Get trip IDs the user owns for quick filtering
    const ownedTripIds = new Set(ownedTrips.map((t) => t.id));

    // Get trips where the user is a companion (simpler query)
    const companionTripIds = await TripCompanion.findAll({
      include: [
        {
          model: TravelCompanion,
          as: 'companion',
          where: { userId: req.user.id },
          attributes: ['id'],
        },
      ],
      attributes: ['tripId'],
      raw: true,
    }).then((records) => [...new Set(records.map((r) => r.tripId))]);

    // Filter out trips we already have and exclude pending invitations
    const pendingTripIds = await TripInvitation.findAll({
      where: { invitedUserId: req.user.id, status: 'pending' },
      attributes: ['tripId'],
      raw: true,
    }).then((invitations) => new Set(invitations.map((inv) => inv.tripId)));

    const newCompanionTripIds = companionTripIds.filter(
      (id) => !ownedTripIds.has(id) && !pendingTripIds.has(id)
    );

    let companionTrips = [];
    if (newCompanionTripIds.length > 0) {
      companionTrips = await Trip.findAll({
        where: { id: { [Op.in]: newCompanionTripIds } },
        attributes: [
          'id',
          'name',
          'departureDate',
          'returnDate',
          'userId',
          'purpose',
          'isConfirmed',
        ],
        order: [['departureDate', 'ASC']],
        include: minimalTripIncludes,
      });
    }

    // Combine and deduplicate trips
    const uniqueTrips = [...ownedTrips, ...companionTrips];

    // Get all standalone items in parallel (minimal attributes)
    const [
      standaloneFlights,
      standaloneHotels,
      standaloneTransportation,
      standaloneCarRentals,
      standaloneEvents,
    ] = await Promise.all([
      Flight.findAll({
        where: { userId: req.user.id, tripId: null },
        attributes: [
          'id',
          'departureDateTime',
          'arrivalDateTime',
          'origin',
          'destination',
          'originTimezone',
          'destinationTimezone',
        ],
        order: [['departureDateTime', 'ASC']],
      }).catch(() => []),
      Hotel.findAll({
        where: { userId: req.user.id, tripId: null },
        attributes: ['id', 'checkInDateTime', 'checkOutDateTime', 'hotelName', 'address', 'phone'],
        order: [['checkInDateTime', 'ASC']],
      }).catch(() => []),
      Transportation.findAll({
        where: { userId: req.user.id, tripId: null },
        attributes: [
          'id',
          'departureDateTime',
          'arrivalDateTime',
          'origin',
          'destination',
          'method',
          'originTimezone',
          'destinationTimezone',
        ],
        order: [['departureDateTime', 'ASC']],
      }).catch(() => []),
      CarRental.findAll({
        where: { userId: req.user.id, tripId: null },
        attributes: ['id', 'pickupDateTime', 'dropoffDateTime', 'company'],
        order: [['pickupDateTime', 'ASC']],
      }).catch(() => []),
      Event.findAll({
        where: { userId: req.user.id, tripId: null },
        attributes: ['id', 'startDateTime', 'endDateTime', 'name', 'isConfirmed'],
        order: [['startDateTime', 'ASC']],
      }).catch(() => []),
    ]);

    // Helper function to enrich items with timezone info (bulk operation)
    const enrichItemsWithTimezone = (items) => {
      if (!items || items.length === 0) return items;
      return items.map((item) => {
        const itemData = item.dataValues || item;
        const itemWithTimezone = { ...itemData };

        // Enrich origin timezone
        if (itemWithTimezone.origin) {
          const originMatch = itemWithTimezone.origin.match(/^([A-Z]{3})/);
          if (originMatch) {
            const airportData = airportService.getAirportByCode(originMatch[1]);
            if (airportData) {
              itemWithTimezone.originTimezone =
                airportData.timezone || itemWithTimezone.originTimezone;
            }
          }
        }

        // Enrich destination timezone
        if (itemWithTimezone.destination) {
          const destinationMatch = itemWithTimezone.destination.match(/^([A-Z]{3})/);
          if (destinationMatch) {
            const airportData = airportService.getAirportByCode(destinationMatch[1]);
            if (airportData) {
              itemWithTimezone.destinationTimezone =
                airportData.timezone || itemWithTimezone.destinationTimezone;
            }
          }
        }

        return itemWithTimezone;
      });
    };

    // Enrich trips with timezone info
    const enrichedTrips = uniqueTrips.map((trip) => {
      let tripData;
      if (trip.dataValues) {
        tripData = { ...trip.dataValues };
      } else if (trip.toJSON) {
        tripData = trip.toJSON();
      } else {
        tripData = trip;
      }
      if (tripData.flights) {
        tripData.flights = enrichItemsWithTimezone(tripData.flights);
      }
      if (tripData.transportation) {
        tripData.transportation = enrichItemsWithTimezone(tripData.transportation);
      }
      // DEBUG: Log events structure
      console.log({
        hasEvents: !!tripData.events,
        eventsCount: tripData.events ? tripData.events.length : 0,
        firstEvent: tripData.events && tripData.events.length > 0 ? tripData.events[0] : 'none',
      });
      return tripData;
    });

    // Enrich standalone items with timezones
    const enrichedStandaloneFlights = enrichItemsWithTimezone(standaloneFlights);
    const enrichedStandaloneTransportation = enrichItemsWithTimezone(standaloneTransportation);

    // Aggregate all data for calendar (no longer need current month/year since we show all months)
    const calendarData = {
      trips: enrichedTrips || [],
      standaloneFlights: enrichedStandaloneFlights || [],
      standaloneHotels: standaloneHotels || [],
      standaloneTransportation: enrichedStandaloneTransportation || [],
      standaloneCarRentals: standaloneCarRentals || [],
      standaloneEvents: standaloneEvents || [],
    };

    // DEBUG: Log events
    uniqueTrips.forEach((trip, idx) => {
      console.log({
        hasEvents: !!trip.events,
        eventsProperty: typeof trip.events,
        eventsLength: trip.events ? trip.events.length : 0,
      });
      if (trip.events && trip.events.length > 0) {
        trip.events.forEach((event, eventIdx) => {
          console.log({
            id: event.id,
            name: event.name,
            startDateTime: event.startDateTime,
          });
        });
      }
    });
    standaloneEvents.forEach((event, idx) => {
      console.log({
        id: event.id,
        name: event.name,
        startDateTime: event.startDateTime,
      });
    });

    console.log({
      tripsCount: calendarData.trips.length,
      standaloneFlightsCount: calendarData.standaloneFlights.length,
      standaloneHotelsCount: calendarData.standaloneHotels.length,
      standaloneTransportationCount: calendarData.standaloneTransportation.length,
      standaloneCarRentalsCount: calendarData.standaloneCarRentals.length,
      standaloneEventsCount: calendarData.standaloneEvents.length,
    });

    // Debug: log trip details
    calendarData.trips.forEach((trip) => {
      console.log({
        id: trip.id,
        name: trip.name,
        departureDate: trip.departureDate,
        returnDate: trip.returnDate,
        departureType: typeof trip.departureDate,
        returnType: typeof trip.returnDate,
      });
    });

    // Return calendar data as JSON
    res.json({ success: true, ...calendarData });
  } catch (error) {
    logger.error('Error fetching calendar sidebar:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    res.status(500).send(`<p class="text-red-600">Error loading calendar: ${error.message}</p>`);
  }
};
