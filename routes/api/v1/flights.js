/**
 * API v1 Flights Routes
 * RESTful JSON API for flight management
 */

const express = require('express');
const flightController = require('../../../controllers/flightController');
const apiResponse = require('../../../utils/apiResponse');
const { ensureAuthenticated } = require('../../../middleware/auth');

const router = express.Router();

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
 * NOTE: This must come BEFORE /trips/:tripId to avoid being matched as /trips/[id]
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
 * Create a flight for a trip
 * Auto-adds trip-level companions to the new flight
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
 * Get all flights for a trip
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
 * Get flight details
 */
router.get('/:id', async (req, res) => {
  try {
    const { Flight, TravelCompanion, ItemCompanion } = require('../../../models');
    const flight = await Flight.findByPk(req.params.id);

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
          attributes: ['id', 'email', 'firstName', 'lastName', 'name'],
        },
      ],
    });

    // Add companions to response
    const flightData = flight.toJSON();
    flightData.itemCompanions = itemCompanions.map((ic) => ({
      id: ic.companion.id,
      email: ic.companion.email,
      firstName: ic.companion.firstName,
      lastName: ic.companion.lastName,
      name: ic.companion.name,
      inheritedFromTrip: ic.inheritedFromTrip,
    }));

    return apiResponse.success(res, flightData, 'Flight retrieved successfully');
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to retrieve flight', error);
  }
});

/**
 * PUT /api/v1/flights/:id
 * Update a flight
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
 * Look up airline name from flight number
 * Flight numbers typically start with IATA code (e.g., AA123, KL668)
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
