/**
 * API v1 Flights Routes
 * RESTful JSON API for flight management
 */

const express = require('express');
const flightController = require('../../../controllers/flightController');
const apiResponse = require('../../../utils/apiResponse');
const { ensureAuthenticated } = require('../../../middleware/auth');

const router = express.Router();

/**
 * Helper function to load trip companions with trip owner listed first
 */
async function loadTripCompanions(tripId, trip) {
  if (!tripId || !trip) return [];

  const { TripCompanion, TravelCompanion, User } = require('../../../models');
  const tripCompanions = [];

  const tripCompanionRecords = await TripCompanion.findAll({
    where: { tripId },
    include: [
      {
        model: TravelCompanion,
        as: 'companion',
        attributes: ['id', 'email', 'firstName', 'lastName', 'name', 'userId'],
      },
    ],
  });

  // Add trip owner as first companion if not already in list
  const tripOwnerInList = tripCompanionRecords.some(tc => tc.companion?.userId === trip.userId);
  if (!tripOwnerInList && trip.userId) {
    const owner = await User.findByPk(trip.userId, {
      attributes: ['id', 'firstName', 'lastName', 'email']
    });
    if (owner) {
      tripCompanions.push({
        id: owner.id,
        email: owner.email,
        firstName: owner.firstName,
        lastName: owner.lastName,
        name: `${owner.firstName} ${owner.lastName}`.trim(),
        userId: owner.id,
        isOwner: true
      });
    }
  }

  // Add other trip companions
  tripCompanions.push(...tripCompanionRecords.map(tc => ({
    id: tc.companion.id,
    email: tc.companion.email,
    firstName: tc.companion.firstName,
    lastName: tc.companion.lastName,
    name: tc.companion.name,
    userId: tc.companion.userId,
  })));

  return tripCompanions;
}

// Handle CORS preflight requests
router.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// All flight routes require authentication
router.use(ensureAuthenticated);

/**
 * POST /api/v1/flights
 * Create a standalone flight (not associated with a trip)
 *
 * NOTE: This route must come BEFORE /trips/:tripId to avoid being matched as /trips/[id]
 * Automatically geocodes origin and destination to get coordinates and timezones
 * Flight numbers are auto-converted to uppercase
 *
 * @param {Object} req.body - Request body
 * @param {string} req.body.flightNumber - Flight number (e.g., "AA123")
 * @param {string} req.body.airline - Airline name (auto-populated from flight number if not provided)
 * @param {string} req.body.origin - Departure city/airport code
 * @param {string} [req.body.originTimezone] - Timezone for origin (e.g., "America/New_York")
 * @param {string} req.body.destination - Arrival city/airport code
 * @param {string} [req.body.destinationTimezone] - Timezone for destination
 * @param {string} [req.body.departureDateTime] - ISO datetime (or use departureDate + departureTime)
 * @param {string} [req.body.departureDate] - Date in YYYY-MM-DD format
 * @param {string} [req.body.departureTime] - Time in HH:mm format
 * @param {string} [req.body.arrivalDateTime] - ISO datetime (or use arrivalDate + arrivalTime)
 * @param {string} [req.body.arrivalDate] - Date in YYYY-MM-DD format
 * @param {string} [req.body.arrivalTime] - Time in HH:mm format
 * @param {string} [req.body.pnr] - Booking reference number
 * @param {string} [req.body.seat] - Seat number
 *
 * @returns {Object} 201 Created response with flight object
 * @returns {string} returns.id - Flight ID (UUID)
 * @returns {string} returns.flightNumber - Flight number (uppercase)
 * @returns {string} returns.airline - Airline name
 * @returns {string} returns.origin - Formatted origin location
 * @returns {string} returns.originTimezone - IANA timezone string
 * @returns {number} returns.originLat - Latitude of origin
 * @returns {number} returns.originLng - Longitude of origin
 * @returns {string} returns.destination - Formatted destination location
 * @returns {string} returns.destinationTimezone - IANA timezone string
 * @returns {number} returns.destinationLat - Latitude of destination
 * @returns {number} returns.destinationLng - Longitude of destination
 * @returns {string} returns.departureDateTime - Departure time in UTC ISO format
 * @returns {string} returns.arrivalDateTime - Arrival time in UTC ISO format
 * @returns {string} [returns.pnr] - Booking reference if provided
 * @returns {string} [returns.seat] - Seat number if provided
 *
 * @throws {400} Bad request - Missing required fields or invalid timezone
 * @throws {401} Unauthorized - User not authenticated
 * @throws {500} Server error - Geocoding failure or database error
 *
 * @requires authentication - User must be logged in (session cookie)
 */
router.post('/', async (req, res) => {
  try {
    const { Flight, Trip } = require('../../../models');
    const airportService = require('../../../services/airportService');
    const {
      geocodeWithAirportFallback,
      convertToUTC,
    } = require('../../../controllers/helpers/resourceController');

    const { flightNumber, departureDate, departureTime, arrivalDate, arrivalTime, pnr, seat } =
      req.body;
    let {
      airline,
      departureDateTime,
      arrivalDateTime,
      origin,
      originTimezone,
      destination,
      destinationTimezone,
    } = req.body;

    // Handle both combined and separate date/time fields
    if (!departureDateTime && departureDate && departureTime) {
      departureDateTime = `${departureDate}T${departureTime}`;
    }
    if (!arrivalDateTime && arrivalDate && arrivalTime) {
      arrivalDateTime = `${arrivalDate}T${arrivalTime}`;
    }

    // Auto-populate airline from flight number if not provided
    if (!airline && flightNumber) {
      const airlineName = airportService.getAirlineNameFromFlightNumber(flightNumber);
      if (airlineName) {
        airline = airlineName;
      }
    }

    // Sanitize timezone inputs
    if (
      !originTimezone ||
      originTimezone === 'undefined' ||
      (typeof originTimezone === 'string' && originTimezone.trim() === '')
    ) {
      originTimezone = null;
    }
    if (
      !destinationTimezone ||
      destinationTimezone === 'undefined' ||
      (typeof destinationTimezone === 'string' && destinationTimezone.trim() === '')
    ) {
      destinationTimezone = null;
    }

    // Geocode origin and destination with airport fallback
    const originResult = await geocodeWithAirportFallback(origin, airportService, originTimezone);
    const destResult = await geocodeWithAirportFallback(
      destination,
      airportService,
      destinationTimezone
    );

    // Update locations and timezones if airport data was found
    origin = originResult.formattedLocation;
    destination = destResult.formattedLocation;
    if (!originTimezone) originTimezone = originResult.timezone;
    if (!destinationTimezone) destinationTimezone = destResult.timezone;

    const flight = await Flight.create({
      userId: req.user.id,
      tripId: null,
      airline,
      flightNumber: flightNumber?.toUpperCase(),
      departureDateTime: convertToUTC(departureDateTime, originTimezone),
      arrivalDateTime: convertToUTC(arrivalDateTime, destinationTimezone),
      origin,
      originTimezone,
      originLat: originResult.coords?.lat,
      originLng: originResult.coords?.lng,
      destination,
      destinationTimezone,
      destinationLat: destResult.coords?.lat,
      destinationLng: destResult.coords?.lng,
      pnr,
      seat,
    });

    return apiResponse.created(res, flight, 'Flight created successfully');
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to create flight', error);
  }
});

/**
 * POST /api/v1/flights/trips/:tripId
 * Create a flight for a specific trip
 *
 * Automatically adds all trip-level companions to the new flight
 * Geocodes origin/destination and validates trip ownership
 *
 * @param {string} req.params.tripId - Trip ID (UUID)
 * @param {Object} req.body - Request body (same as POST /api/v1/flights)
 * @param {string} req.body.flightNumber - Flight number
 * @param {string} req.body.airline - Airline name (auto-populated if omitted)
 * @param {string} req.body.origin - Departure city/airport
 * @param {string} [req.body.originTimezone] - Origin timezone
 * @param {string} req.body.destination - Arrival city/airport
 * @param {string} [req.body.destinationTimezone] - Destination timezone
 * @param {string} [req.body.departureDateTime] - ISO datetime or separate date/time
 * @param {string} [req.body.departureDate] - Date in YYYY-MM-DD format
 * @param {string} [req.body.departureTime] - Time in HH:mm format
 * @param {string} [req.body.arrivalDateTime] - ISO datetime
 * @param {string} [req.body.arrivalDate] - Date in YYYY-MM-DD format
 * @param {string} [req.body.arrivalTime] - Time in HH:mm format
 * @param {string} [req.body.pnr] - Booking reference
 * @param {string} [req.body.seat] - Seat number
 *
 * @returns {Object} 201 Created response with flight and companion info
 * @returns {string} returns.id - Flight ID
 * @returns {string} returns.tripId - Associated trip ID
 * @returns {Array} returns.itemCompanions - Auto-added companions from trip level
 *
 * @throws {400} Bad request - Invalid parameters
 * @throws {401} Unauthorized - User not authenticated
 * @throws {403} Forbidden - User does not own the trip
 * @throws {404} Not found - Trip not found
 * @throws {500} Server error - Database or geocoding failure
 *
 * @requires authentication - User must be logged in
 */
router.post('/trips/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    const { Trip, Flight } = require('../../../models');
    const airportService = require('../../../services/airportService');
    const {
      geocodeWithAirportFallback,
      convertToUTC,
      verifyTripOwnership,
    } = require('../../../controllers/helpers/resourceController');
    const itemCompanionHelper = require('../../../utils/itemCompanionHelper');

    // Verify trip ownership
    const trip = await verifyTripOwnership(tripId, req.user.id, Trip);
    if (!trip) {
      return apiResponse.forbidden(res, 'Access denied');
    }

    const { flightNumber, departureDate, departureTime, arrivalDate, arrivalTime, pnr, seat } =
      req.body;
    let {
      airline,
      departureDateTime,
      arrivalDateTime,
      origin,
      originTimezone,
      destination,
      destinationTimezone,
    } = req.body;

    // Handle both combined and separate date/time fields
    if (!departureDateTime && departureDate && departureTime) {
      departureDateTime = `${departureDate}T${departureTime}`;
    }
    if (!arrivalDateTime && arrivalDate && arrivalTime) {
      arrivalDateTime = `${arrivalDate}T${arrivalTime}`;
    }

    // Auto-populate airline from flight number if not provided
    if (!airline && flightNumber) {
      const airlineName = airportService.getAirlineNameFromFlightNumber(flightNumber);
      if (airlineName) {
        airline = airlineName;
      }
    }

    // Sanitize timezone inputs
    if (
      !originTimezone ||
      originTimezone === 'undefined' ||
      (typeof originTimezone === 'string' && originTimezone.trim() === '')
    ) {
      originTimezone = null;
    }
    if (
      !destinationTimezone ||
      destinationTimezone === 'undefined' ||
      (typeof destinationTimezone === 'string' && destinationTimezone.trim() === '')
    ) {
      destinationTimezone = null;
    }

    // Geocode origin and destination with airport fallback
    const originResult = await geocodeWithAirportFallback(origin, airportService, originTimezone);
    const destResult = await geocodeWithAirportFallback(
      destination,
      airportService,
      destinationTimezone
    );

    // Update locations and timezones if airport data was found
    origin = originResult.formattedLocation;
    destination = destResult.formattedLocation;
    if (!originTimezone) originTimezone = originResult.timezone;
    if (!destinationTimezone) destinationTimezone = destResult.timezone;

    const flight = await Flight.create({
      userId: req.user.id,
      tripId,
      airline,
      flightNumber: flightNumber?.toUpperCase(),
      departureDateTime: convertToUTC(departureDateTime, originTimezone),
      arrivalDateTime: convertToUTC(arrivalDateTime, destinationTimezone),
      origin,
      originTimezone,
      originLat: originResult.coords?.lat,
      originLng: originResult.coords?.lng,
      destination,
      destinationTimezone,
      destinationLat: destResult.coords?.lat,
      destinationLng: destResult.coords?.lng,
      pnr,
      seat,
    });

    // Auto-add trip-level companions to the new flight
    try {
      await itemCompanionHelper.autoAddTripCompanions('flight', flight.id, tripId, req.user.id);
    } catch (companionError) {
      // Log error but don't fail the flight creation
      console.error('[Flight Creation] Error auto-adding companions:', companionError);
    }

    return apiResponse.created(res, flight, 'Flight created successfully');
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to create flight', error);
  }
});

/**
 * GET /api/v1/flights/trips/:tripId
 * Retrieve all flights associated with a specific trip
 *
 * Returns flights ordered by departure date/time (earliest first)
 * Validates that requesting user owns the trip
 *
 * @param {string} req.params.tripId - Trip ID (UUID)
 *
 * @returns {Object} 200 OK response with flights array
 * @returns {Array} returns - Array of flight objects
 * @returns {string} returns[].id - Flight ID
 * @returns {string} returns[].tripId - Associated trip ID
 * @returns {string} returns[].flightNumber - Flight number
 * @returns {string} returns[].airline - Airline name
 * @returns {string} returns[].origin - Origin location
 * @returns {string} returns[].destination - Destination location
 * @returns {string} returns[].departureDateTime - Departure in UTC ISO format
 * @returns {string} returns[].arrivalDateTime - Arrival in UTC ISO format
 *
 * @throws {401} Unauthorized - User not authenticated
 * @throws {403} Forbidden - User does not own the trip
 * @throws {404} Not found - Trip not found
 * @throws {500} Server error - Database error
 *
 * @requires authentication - User must be logged in
 */
router.get('/trips/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    const { Flight } = require('../../../models');
    const { Trip } = require('../../../models');

    // Verify trip belongs to user
    const trip = await Trip.findOne({
      where: { id: tripId, userId: req.user.id },
    });

    if (!trip) {
      return apiResponse.forbidden(res, 'Access denied');
    }

    const flights = await Flight.findAll({
      where: { tripId },
      order: [['departureDateTime', 'ASC']],
    });

    return apiResponse.success(res, flights, `Retrieved ${flights.length} flights`);
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to retrieve flights', error);
  }
});

/**
 * GET /api/v1/flights/:id
 * Retrieve a specific flight with its companion assignments
 *
 * Includes all companions assigned to this flight (both direct and inherited from trip)
 *
 * @param {string} req.params.id - Flight ID (UUID)
 *
 * @returns {Object} 200 OK response with flight details
 * @returns {string} returns.id - Flight ID
 * @returns {string} returns.flightNumber - Flight number
 * @returns {string} returns.airline - Airline name
 * @returns {string} returns.origin - Origin city/airport
 * @returns {string} returns.destination - Destination city/airport
 * @returns {string} returns.departureDateTime - Departure in UTC ISO format
 * @returns {string} returns.arrivalDateTime - Arrival in UTC ISO format
 * @returns {string} returns.originTimezone - Origin IANA timezone
 * @returns {string} returns.destinationTimezone - Destination IANA timezone
 * @returns {number} returns.originLat - Origin latitude
 * @returns {number} returns.originLng - Origin longitude
 * @returns {number} returns.destinationLat - Destination latitude
 * @returns {number} returns.destinationLng - Destination longitude
 * @returns {string} [returns.pnr] - Booking reference if available
 * @returns {string} [returns.seat] - Seat number if available
 * @returns {Array} returns.itemCompanions - Array of assigned companions
 * @returns {string} returns.itemCompanions[].id - Companion ID
 * @returns {string} returns.itemCompanions[].email - Companion email
 * @returns {string} returns.itemCompanions[].firstName - Companion first name
 * @returns {string} returns.itemCompanions[].lastName - Companion last name
 * @returns {boolean} returns.itemCompanions[].inheritedFromTrip - Whether companion was added at trip level
 *
 * @throws {401} Unauthorized - User not authenticated
 * @throws {404} Not found - Flight not found
 * @throws {500} Server error - Database error
 *
 * @requires authentication - User must be logged in
 */
router.get('/:id', async (req, res) => {
  try {
    const { Flight, Trip, TripCompanion, TravelCompanion, ItemCompanion } = require('../../../models');
    const flight = await Flight.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip', required: false }]
    });

    if (!flight) {
      return apiResponse.notFound(res, 'Flight not found');
    }

    // Get companions for this flight
    const itemCompanions = await ItemCompanion.findAll({
      where: { itemType: 'flight', itemId: flight.id },
      include: [
        {
          model: TravelCompanion,
          as: 'companion',
          attributes: ['id', 'email', 'firstName', 'lastName', 'name', 'userId'],
        },
      ],
    });

    // Get trip companions if item is part of a trip
    const tripCompanions = await loadTripCompanions(flight.tripId, flight.trip);

    // Add companions to response
    const flightData = flight.toJSON();
    flightData.itemCompanions = itemCompanions.map((ic) => ({
      id: ic.companion.id,
      companionId: ic.companion.id,
      email: ic.companion.email,
      firstName: ic.companion.firstName,
      lastName: ic.companion.lastName,
      name: ic.companion.name,
      userId: ic.companion.userId,
      inheritedFromTrip: ic.inheritedFromTrip,
    }));

    // Add trip companions if available
    if (tripCompanions.length > 0) {
      flightData.tripCompanions = tripCompanions;
    }

    // Set canEdit flag: allow if user is item creator, trip owner, or trip companion with edit permission
    const userId = req.user?.id;
    const isItemOwner = flight.userId === userId;
    let canEditTrip = false;

    if (flight.tripId) {
      // Check if user is trip owner
      const isTripOwner = flight.trip?.userId === userId;
      if (isTripOwner) {
        canEditTrip = true;
      } else {
        // Check if user is a trip companion with canEdit permission
        const tripCompanion = await TripCompanion.findOne({
          where: { tripId: flight.tripId },
          include: [
            {
              model: TravelCompanion,
              as: 'companion',
              where: { userId },
              required: true,
            },
          ],
        });
        canEditTrip = tripCompanion?.canEdit === true;
      }
    }

    flightData.canEdit = isItemOwner || canEditTrip;
    flightData.canDelete = isItemOwner || canEditTrip;

    return apiResponse.success(res, flightData, 'Flight retrieved successfully');
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to retrieve flight', error);
  }
});

/**
 * PUT /api/v1/flights/:id
 * Update an existing flight
 *
 * Validates ownership, geocodes location changes, and handles both combined and separate date/time formats
 * Can reassign flight to a different trip via tripId parameter
 *
 * @param {string} req.params.id - Flight ID (UUID)
 * @param {Object} req.body - Request body with updatable fields
 * @param {string} [req.body.flightNumber] - Flight number to update
 * @param {string} [req.body.airline] - Airline name
 * @param {string} [req.body.origin] - Origin location (will be geocoded if changed)
 * @param {string} [req.body.originTimezone] - Origin timezone
 * @param {string} [req.body.destination] - Destination location (will be geocoded if changed)
 * @param {string} [req.body.destinationTimezone] - Destination timezone
 * @param {string} [req.body.departureDateTime] - ISO datetime or separate date/time
 * @param {string} [req.body.departureDate] - Date in YYYY-MM-DD format
 * @param {string} [req.body.departureTime] - Time in HH:mm format
 * @param {string} [req.body.arrivalDateTime] - ISO datetime
 * @param {string} [req.body.arrivalDate] - Date in YYYY-MM-DD format
 * @param {string} [req.body.arrivalTime] - Time in HH:mm format
 * @param {string} [req.body.pnr] - Booking reference
 * @param {string} [req.body.seat] - Seat number
 * @param {string} [req.body.tripId] - Trip ID to reassign flight
 *
 * @returns {Object} 200 OK response with updated flight
 * @returns {string} returns.id - Flight ID
 * @returns {string} returns.flightNumber - Updated flight number
 * @returns {string} returns.airline - Updated airline
 * @returns {string} returns.origin - Updated/geocoded origin
 * @returns {string} returns.destination - Updated/geocoded destination
 * @returns {number} returns.originLat - Updated latitude (geocoded if location changed)
 * @returns {number} returns.originLng - Updated longitude
 * @returns {number} returns.destinationLat - Updated latitude
 * @returns {number} returns.destinationLng - Updated longitude
 * @returns {string} returns.departureDateTime - Updated departure in UTC ISO format
 * @returns {string} returns.arrivalDateTime - Updated arrival in UTC ISO format
 *
 * @throws {400} Bad request - Invalid parameters or timezone
 * @throws {401} Unauthorized - User not authenticated
 * @throws {403} Forbidden - User does not own the flight
 * @throws {404} Not found - Flight not found
 * @throws {500} Server error - Geocoding or database failure
 *
 * @requires authentication - User must be logged in
 */
router.put('/:id', async (req, res) => {
  try {
    const logger = require('../../../utils/logger');
    const { Flight, Trip } = require('../../../models');
    const airportService = require('../../../services/airportService');
    const {
      geocodeWithAirportFallback,
      convertToUTC,
      verifyResourceOwnership,
    } = require('../../../controllers/helpers/resourceController');

    const flight = await Flight.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip', required: false }],
    });

    if (!flight) {
      return apiResponse.notFound(res, 'Flight not found');
    }

    // Verify ownership
    if (!verifyResourceOwnership(flight, req.user.id)) {
      return apiResponse.forbidden(res, 'Access denied');
    }

    logger.info('[API v1] Flight update request:', {
      flightId: req.params.id,
      origin: req.body.origin,
      destination: req.body.destination,
    });

    const {
      flightNumber,
      departureDate,
      departureTime,
      arrivalDate,
      arrivalTime,
      pnr,
      seat,
      tripId: newTripId,
    } = req.body;
    let {
      airline,
      departureDateTime,
      arrivalDateTime,
      origin,
      originTimezone,
      destination,
      destinationTimezone,
    } = req.body;

    // Handle both combined and separate date/time fields
    if (!departureDateTime && departureDate && departureTime) {
      departureDateTime = `${departureDate}T${departureTime}`;
    }
    if (!arrivalDateTime && arrivalDate && arrivalTime) {
      arrivalDateTime = `${arrivalDate}T${arrivalTime}`;
    }

    // Auto-populate airline from flight number if not provided
    if (!airline && flightNumber) {
      const airlineName = airportService.getAirlineNameFromFlightNumber(flightNumber);
      if (airlineName) {
        airline = airlineName;
      }
    }

    // Sanitize timezone inputs
    if (
      !originTimezone ||
      originTimezone === 'undefined' ||
      (typeof originTimezone === 'string' && originTimezone.trim() === '')
    ) {
      originTimezone = null;
    }
    if (
      !destinationTimezone ||
      destinationTimezone === 'undefined' ||
      (typeof destinationTimezone === 'string' && destinationTimezone.trim() === '')
    ) {
      destinationTimezone = null;
    }

    // Geocode origin and destination if they changed OR if coordinates are missing
    let originResult;
    let destResult;

    logger.info('[API v1] Before geocoding:', {
      origin: {
        new: origin,
        old: flight.origin,
        changed: origin !== flight.origin,
        hasCoors: !!flight.originLat,
      },
      destination: {
        new: destination,
        old: flight.destination,
        changed: destination !== flight.destination,
        hasCoords: !!flight.destinationLat,
      },
    });

    // Always geocode if coordinates are NULL, even if location hasn't changed
    if (origin !== flight.origin || !flight.originLat || !flight.originLng) {
      originResult = await geocodeWithAirportFallback(origin, airportService, originTimezone);
      logger.info('[API v1] Origin geocoded:', originResult);
      origin = originResult.formattedLocation;
      if (!originTimezone) originTimezone = originResult.timezone;
    } else {
      originTimezone = originTimezone || flight.originTimezone;
      originResult = {
        coords: { lat: flight.originLat, lng: flight.originLng },
        timezone: originTimezone,
        formattedLocation: flight.origin,
      };
    }

    // Always geocode if coordinates are NULL, even if location hasn't changed
    if (destination !== flight.destination || !flight.destinationLat || !flight.destinationLng) {
      destResult = await geocodeWithAirportFallback(
        destination,
        airportService,
        destinationTimezone
      );
      logger.info('[API v1] Destination geocoded:', destResult);
      destination = destResult.formattedLocation;
      if (!destinationTimezone) destinationTimezone = destResult.timezone;
    } else {
      destinationTimezone = destinationTimezone || flight.destinationTimezone;
      destResult = {
        coords: { lat: flight.destinationLat, lng: flight.destinationLng },
        timezone: destinationTimezone,
        formattedLocation: flight.destination,
      };
    }

    logger.info('[API v1] After geocoding:', {
      originResult,
      destResult,
    });

    await flight.update({
      airline,
      flightNumber: flightNumber?.toUpperCase(),
      departureDateTime: convertToUTC(departureDateTime, originTimezone),
      arrivalDateTime: convertToUTC(arrivalDateTime, destinationTimezone),
      origin,
      originTimezone,
      originLat: originResult.coords?.lat,
      originLng: originResult.coords?.lng,
      destination,
      destinationTimezone,
      destinationLat: destResult.coords?.lat,
      destinationLng: destResult.coords?.lng,
      pnr,
      seat,
      tripId: newTripId || null,
    });

    return apiResponse.success(res, flight, 'Flight updated successfully');
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to update flight', error);
  }
});

/**
 * DELETE /api/v1/flights/:id
 * Delete a flight
 *
 * Soft delete - cascades companion assignments, but trip data remains intact
 * Validates flight exists before deletion
 *
 * @param {string} req.params.id - Flight ID (UUID)
 *
 * @returns {Object} 204 No Content - successful deletion (no response body)
 *
 * @throws {401} Unauthorized - User not authenticated
 * @throws {404} Not found - Flight not found
 * @throws {500} Server error - Database error
 *
 * @requires authentication - User must be logged in
 */
router.delete('/:id', async (req, res) => {
  try {
    const { Flight } = require('../../../models');
    const flight = await Flight.findByPk(req.params.id);

    if (!flight) {
      return apiResponse.notFound(res, 'Flight not found');
    }

    await flight.destroy();

    return apiResponse.noContent(res);
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to delete flight', error);
  }
});

/**
 * GET /api/v1/flights/lookup/airline/:flightNumber
 * Look up airline details from flight number
 *
 * Extracts IATA code from flight number and returns airline information
 * Flight numbers typically start with 2-3 letter IATA code (e.g., AA123, KL668)
 *
 * @param {string} req.params.flightNumber - Flight number (must start with IATA code)
 *
 * @returns {Object} 200 OK response with airline details
 * @returns {string} returns.iata - IATA airline code (e.g., "AA")
 * @returns {string} returns.name - Airline name (e.g., "American Airlines")
 * @returns {string} returns.country - Country of airline operation
 * @returns {string} returns.alliance - Airline alliance (e.g., "Oneworld", "Star Alliance")
 *
 * @throws {400} Bad request - Invalid flight number format (too short or missing IATA code)
 * @throws {404} Not found - IATA code not recognized
 * @throws {500} Server error - File system or data loading error
 *
 * @note No authentication required for this lookup endpoint
 *
 * @example
 * GET /api/v1/flights/lookup/airline/AA123
 * Response: {
 *   "success": true,
 *   "data": {
 *     "iata": "AA",
 *     "name": "American Airlines",
 *     "country": "United States",
 *     "alliance": "Oneworld"
 *   }
 * }
 */
router.get('/lookup/airline/:flightNumber', async (req, res) => {
  try {
    const { flightNumber } = req.params;

    if (!flightNumber || flightNumber.length < 2) {
      return apiResponse.badRequest(res, 'Invalid flight number');
    }

    // Extract IATA code from flight number (first 2-3 characters, letters only)
    const iataMatch = flightNumber.match(/^[A-Z]{2,3}/);
    if (!iataMatch) {
      return apiResponse.badRequest(res, 'Invalid flight number format');
    }

    const iataCode = iataMatch[0];

    // Load airlines data
    const fs = require('fs');
    const path = require('path');
    const airlinesPath = path.join(__dirname, '../../../data/airlines.json');
    const airlinesData = JSON.parse(fs.readFileSync(airlinesPath, 'utf8'));

    // Find airline by IATA code
    const airline = airlinesData.find((a) => a.iata === iataCode);

    if (!airline) {
      return apiResponse.notFound(res, 'Airline not found for this IATA code');
    }

    return apiResponse.success(
      res,
      {
        iata: airline.iata,
        name: airline.name,
        country: airline.country,
        alliance: airline.alliance,
      },
      'Airline found'
    );
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to lookup airline', error);
  }
});

module.exports = router;
