const { Flight, Trip } = require('../models');
const airportService = require('../services/airportService');
const geocodingService = require('../services/geocodingService');
const { localToUTC } = require('../utils/timezoneHelper');

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

    // If tripId is provided, verify the trip exists and belongs to user
    if (tripId) {
      const trip = await Trip.findOne({
        where: { id: tripId, userId: req.user.id }
      });

      if (!trip) {
        req.flash('error_msg', 'Trip not found');
        return res.redirect('/trips');
      }
    }

    // Auto-populate airline from flight number if not provided
    if (!airline && flightNumber) {
      const airlineName = airportService.getAirlineNameFromFlightNumber(flightNumber);
      if (airlineName) {
        airline = airlineName;
      }
    }

    // Try to get airport details from codes
    let originData = null;
    let destData = null;
    let originCoords = null;
    let destCoords = null;

    // Check if origin is an airport code (3 letters)
    if (origin && origin.length === 3 && /^[A-Z]{3}$/i.test(origin.trim())) {
      originData = airportService.getAirportByCode(origin);
      if (originData) {
        originCoords = { lat: originData.lat, lng: originData.lng };
        if (!originTimezone) originTimezone = originData.timezone;
        // Keep the city name for better display
        origin = `${originData.iata} - ${originData.city}, ${originData.country}`;
      }
    }

    // Check if destination is an airport code
    if (destination && destination.length === 3 && /^[A-Z]{3}$/i.test(destination.trim())) {
      destData = airportService.getAirportByCode(destination);
      if (destData) {
        destCoords = { lat: destData.lat, lng: destData.lng };
        if (!destinationTimezone) destinationTimezone = destData.timezone;
        destination = `${destData.iata} - ${destData.city}, ${destData.country}`;
      }
    }

    // Fallback to geocoding if airport lookup didn't work
    if (!originCoords && origin) {
      originCoords = await geocodingService.geocodeLocation(origin);
    }
    if (!destCoords && destination) {
      destCoords = await geocodingService.geocodeLocation(destination);
    }

    // Convert datetime-local inputs to UTC using proper timezone
    const departureUTC = localToUTC(departureDateTime, originTimezone);
    const arrivalUTC = localToUTC(arrivalDateTime, destinationTimezone);

    await Flight.create({
      userId: req.user.id,
      tripId: tripId || null,
      airline,
      flightNumber: flightNumber?.toUpperCase(),
      departureDateTime: departureUTC,
      arrivalDateTime: arrivalUTC,
      origin,
      originTimezone,
      originLat: originCoords?.lat,
      originLng: originCoords?.lng,
      destination,
      destinationTimezone,
      destinationLat: destCoords?.lat,
      destinationLng: destCoords?.lng,
      pnr,
      seat
    });

    req.flash('success_msg', 'Flight added successfully');

    // Redirect to trip if attached, otherwise to trips list
    if (tripId) {
      res.redirect(`/trips/${tripId}?tab=flights`);
    } else {
      res.redirect('/trips');
    }
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error adding flight');
    if (req.params.tripId) {
      res.redirect(`/trips/${req.params.tripId}`);
    } else {
      res.redirect('/trips');
    }
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

    const flight = await Flight.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip', required: false }]
    });

    if (!flight) {
      console.error(`Flight not found with ID: ${req.params.id}`);
      req.flash('error_msg', 'Flight not found');
      return res.redirect('/trips');
    }

    // Convert both IDs to strings for comparison to avoid type mismatches
    const flightUserId = String(flight.userId || '');
    const currentUserId = String(req.user.id || '');

    if (flightUserId !== currentUserId) {
      console.error(`User ID mismatch: flight.userId=${flight.userId}, req.user.id=${req.user.id}`);
      req.flash('error_msg', 'Flight not found');
      return res.redirect('/trips');
    }

    // Auto-populate airline from flight number if not provided
    if (!airline && flightNumber) {
      const airlineName = airportService.getAirlineNameFromFlightNumber(flightNumber);
      if (airlineName) {
        airline = airlineName;
      }
    }

    // Geocode origin and destination if they changed
    let originCoords = null;
    let destCoords = null;

    if (origin !== flight.origin) {
      // Check if origin is an airport code
      if (origin && origin.length === 3 && /^[A-Z]{3}$/i.test(origin.trim())) {
        const originData = airportService.getAirportByCode(origin);
        if (originData) {
          originCoords = { lat: originData.lat, lng: originData.lng };
          if (!originTimezone) originTimezone = originData.timezone;
          origin = `${originData.iata} - ${originData.city}, ${originData.country}`;
        }
      }
      // Fallback to geocoding
      if (!originCoords) {
        originCoords = await geocodingService.geocodeLocation(origin);
      }
    } else {
      originCoords = { lat: flight.originLat, lng: flight.originLng };
    }

    if (destination !== flight.destination) {
      // Check if destination is an airport code
      if (destination && destination.length === 3 && /^[A-Z]{3}$/i.test(destination.trim())) {
        const destData = airportService.getAirportByCode(destination);
        if (destData) {
          destCoords = { lat: destData.lat, lng: destData.lng };
          if (!destinationTimezone) destinationTimezone = destData.timezone;
          destination = `${destData.iata} - ${destData.city}, ${destData.country}`;
        }
      }
      // Fallback to geocoding
      if (!destCoords) {
        destCoords = await geocodingService.geocodeLocation(destination);
      }
    } else {
      destCoords = { lat: flight.destinationLat, lng: flight.destinationLng };
    }

    // Convert datetime-local inputs to UTC using proper timezone
    const departureUTC = localToUTC(departureDateTime, originTimezone);
    const arrivalUTC = localToUTC(arrivalDateTime, destinationTimezone);

    await flight.update({
      airline,
      flightNumber: flightNumber?.toUpperCase(),
      departureDateTime: departureUTC,
      arrivalDateTime: arrivalUTC,
      origin,
      originTimezone,
      originLat: originCoords?.lat,
      originLng: originCoords?.lng,
      destination,
      destinationTimezone,
      destinationLat: destCoords?.lat,
      destinationLng: destCoords?.lng,
      pnr,
      seat
    });

    req.flash('success_msg', 'Flight updated successfully');

    // Redirect to trip if attached, otherwise to trips list
    if (flight.tripId) {
      res.redirect(`/trips/${flight.tripId}?tab=flights`);
    } else {
      res.redirect('/trips');
    }
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error updating flight');
    res.redirect('back');
  }
};

exports.deleteFlight = async (req, res) => {
  try {
    const flight = await Flight.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip', required: false }]
    });

    if (!flight || flight.userId !== req.user.id) {
      req.flash('error_msg', 'Flight not found');
      return res.redirect('/trips');
    }

    const tripId = flight.tripId;
    await flight.destroy();

    req.flash('success_msg', 'Flight deleted successfully');

    // Redirect to trip if attached, otherwise to trips list
    if (tripId) {
      res.redirect(`/trips/${tripId}?tab=flights`);
    } else {
      res.redirect('/trips');
    }
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error deleting flight');
    res.redirect('back');
  }
};