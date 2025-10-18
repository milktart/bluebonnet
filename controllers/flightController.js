const { Flight, Trip } = require('../models');
const airportService = require('../services/airportService');
const {
  verifyTripOwnership,
  redirectAfterSuccess,
  redirectAfterError,
  verifyResourceOwnership,
  convertToUTC,
  geocodeWithAirportFallback
} = require('./helpers/resourceController');

exports.searchAirports = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const airports = airportService.searchAirports(query, 10);

    const results = airports.map(airport => ({
      iata: airport.iata,
      name: airport.name,
      city: airport.city,
      country: airport.country,
      timezone: airport.timezone,
      label: `${airport.iata} - ${airport.city}, ${airport.country}`,
      value: airport.iata
    }));

    res.json({ success: true, data: results });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error searching airports' });
  }
};

exports.searchFlight = async (req, res) => {
  try {
    const { flightNumber } = req.query;

    if (!flightNumber) {
      return res.json({
        success: false,
        message: 'Please provide a flight number'
      });
    }

    // Parse flight number to get airline code
    const airlineCode = airportService.getAirlineCodeFromFlightNumber(flightNumber);

    if (!airlineCode) {
      return res.json({
        success: false,
        message: 'Could not identify airline from flight number. Please enter details manually.'
      });
    }

    // Get airline name
    const airlineName = airportService.getAirlineNameFromFlightNumber(flightNumber);

    // Return airline information - user will need to enter origin/destination
    return res.json({
      success: true,
      data: {
        airline: airlineName || airlineCode,
        flightNumber: flightNumber.trim().toUpperCase()
      },
      message: 'Airline identified. Please enter origin and destination airport codes.'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error searching flight' });
  }
};

exports.createFlight = async (req, res) => {
  try {
    const { tripId } = req.params;
    let {
      airline,
      flightNumber,
      departureDateTime,
      arrivalDateTime,
      origin,
      originTimezone,
      destination,
      destinationTimezone,
      pnr,
      seat
    } = req.body;

    // Verify trip ownership if tripId provided
    if (tripId) {
      const trip = await verifyTripOwnership(tripId, req.user.id, Trip);
      if (!trip) {
        const isAsync = req.headers['x-async-request'] === 'true';
        if (isAsync) {
          return res.status(403).json({ success: false, error: 'Trip not found' });
        }
        return redirectAfterError(res, req, null, 'Trip not found');
      }
    }

    // Auto-populate airline from flight number if not provided
    if (!airline && flightNumber) {
      const airlineName = airportService.getAirlineNameFromFlightNumber(flightNumber);
      if (airlineName) {
        airline = airlineName;
      }
    }

    // Sanitize timezone inputs (handle "undefined" string from forms)
    if (!originTimezone || originTimezone === 'undefined' || originTimezone.trim() === '') {
      originTimezone = null;
    }
    if (!destinationTimezone || destinationTimezone === 'undefined' || destinationTimezone.trim() === '') {
      destinationTimezone = null;
    }

    // Geocode origin and destination with airport fallback
    const originResult = await geocodeWithAirportFallback(origin, airportService, originTimezone);
    const destResult = await geocodeWithAirportFallback(destination, airportService, destinationTimezone);

    // Update locations and timezones if airport data was found
    origin = originResult.formattedLocation;
    destination = destResult.formattedLocation;
    if (!originTimezone) originTimezone = originResult.timezone;
    if (!destinationTimezone) destinationTimezone = destResult.timezone;

    await Flight.create({
      userId: req.user.id,
      tripId: tripId || null,
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
      seat
    });

    // Check if this is an async request
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.json({ success: true, message: 'Flight added successfully' });
    }

    redirectAfterSuccess(res, req, tripId, 'flights', 'Flight added successfully');
  } catch (error) {
    console.error('ERROR in createFlight:', error);
    console.error('Request body:', req.body);
    console.error('Request params:', req.params);
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.status(500).json({ success: false, error: error.message || 'Error adding flight' });
    }
    redirectAfterError(res, req, req.params.tripId, 'Error adding flight');
  }
};

exports.updateFlight = async (req, res) => {
  try {
    let {
      airline,
      flightNumber,
      departureDateTime,
      arrivalDateTime,
      origin,
      originTimezone,
      destination,
      destinationTimezone,
      pnr,
      seat
    } = req.body;

    // Find flight with trip
    const flight = await Flight.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip', required: false }]
    });

    // Verify ownership
    if (!verifyResourceOwnership(flight, req.user.id)) {
      const isAsync = req.headers['x-async-request'] === 'true';
      if (isAsync) {
        return res.status(403).json({ success: false, error: 'Flight not found' });
      }
      return redirectAfterError(res, req, null, 'Flight not found');
    }

    // Auto-populate airline from flight number if not provided
    if (!airline && flightNumber) {
      const airlineName = airportService.getAirlineNameFromFlightNumber(flightNumber);
      if (airlineName) {
        airline = airlineName;
      }
    }

    // Sanitize timezone inputs (handle "undefined" string from forms)
    if (!originTimezone || originTimezone === 'undefined' || originTimezone.trim() === '') {
      originTimezone = null;
    }
    if (!destinationTimezone || destinationTimezone === 'undefined' || destinationTimezone.trim() === '') {
      destinationTimezone = null;
    }

    // Geocode origin and destination if they changed
    let originResult, destResult;

    if (origin !== flight.origin) {
      originResult = await geocodeWithAirportFallback(origin, airportService, originTimezone);
      origin = originResult.formattedLocation;
      if (!originTimezone) originTimezone = originResult.timezone;
    } else {
      // Origin unchanged, but we might need to detect timezone for old flights
      if (!originTimezone && !flight.originTimezone) {
        // Try to detect timezone from airport code in existing origin
        originResult = await geocodeWithAirportFallback(origin, airportService, originTimezone);
        originTimezone = originResult.timezone;
      } else {
        originTimezone = originTimezone || flight.originTimezone;
      }

      originResult = {
        coords: { lat: flight.originLat, lng: flight.originLng },
        timezone: originTimezone,
        formattedLocation: flight.origin
      };
    }

    if (destination !== flight.destination) {
      destResult = await geocodeWithAirportFallback(destination, airportService, destinationTimezone);
      destination = destResult.formattedLocation;
      if (!destinationTimezone) destinationTimezone = destResult.timezone;
    } else {
      // Destination unchanged, but we might need to detect timezone for old flights
      if (!destinationTimezone && !flight.destinationTimezone) {
        // Try to detect timezone from airport code in existing destination
        destResult = await geocodeWithAirportFallback(destination, airportService, destinationTimezone);
        destinationTimezone = destResult.timezone;
      } else {
        destinationTimezone = destinationTimezone || flight.destinationTimezone;
      }

      destResult = {
        coords: { lat: flight.destinationLat, lng: flight.destinationLng },
        timezone: destinationTimezone,
        formattedLocation: flight.destination
      };
    }

    // Debug logging
    console.log('Update flight - timezones:', {
      originTimezone,
      destinationTimezone,
      departureDateTime,
      arrivalDateTime
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
      seat
    });

    // Check if this is an async request
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.json({ success: true, message: 'Flight updated successfully' });
    }

    redirectAfterSuccess(res, req, flight.tripId, 'flights', 'Flight updated successfully');
  } catch (error) {
    console.error('ERROR in updateFlight:', error);
    console.error('Request body:', req.body);
    console.error('Request params:', req.params);
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.status(500).json({ success: false, error: error.message || 'Error updating flight' });
    }
    req.flash('error_msg', 'Error updating flight');
    res.redirect('back');
  }
};

exports.deleteFlight = async (req, res) => {
  try {
    // Find flight with trip
    const flight = await Flight.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip', required: false }]
    });

    // Verify ownership
    if (!verifyResourceOwnership(flight, req.user.id)) {
      const isAsync = req.headers['x-async-request'] === 'true';
      if (isAsync) {
        return res.status(403).json({ success: false, error: 'Flight not found' });
      }
      return redirectAfterError(res, req, null, 'Flight not found');
    }

    const tripId = flight.tripId;
    await flight.destroy();

    // Check if this is an async request
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.json({ success: true, message: 'Flight deleted successfully' });
    }

    redirectAfterSuccess(res, req, tripId, 'flights', 'Flight deleted successfully');
  } catch (error) {
    console.error(error);
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.status(500).json({ success: false, error: 'Error deleting flight' });
    }
    req.flash('error_msg', 'Error deleting flight');
    res.redirect('back');
  }
};