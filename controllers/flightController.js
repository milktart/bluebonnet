const { Flight, Trip, VoucherAttachment, Voucher } = require('../models');
const airportService = require('../services/airportService');
const { utcToLocal } = require('../utils/timezoneHelper');
const {
  verifyTripOwnership,
  redirectAfterSuccess,
  redirectAfterError,
  verifyResourceOwnership,
  convertToUTC,
  geocodeWithAirportFallback
} = require('./helpers/resourceController');
const { storeDeletedItem, retrieveDeletedItem } = require('./helpers/deleteManager');

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
      departureDate,
      departureTime,
      arrivalDate,
      arrivalTime,
      origin,
      originTimezone,
      destination,
      destinationTimezone,
      pnr,
      seat
    } = req.body;

    // Handle both combined and separate date/time fields
    if (!departureDateTime && departureDate && departureTime) {
      departureDateTime = `${departureDate}T${departureTime}`;
    }
    if (!arrivalDateTime && arrivalDate && arrivalTime) {
      arrivalDateTime = `${arrivalDate}T${arrivalTime}`;
    }

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
    if (!originTimezone || originTimezone === 'undefined' || (typeof originTimezone === 'string' && originTimezone.trim() === '')) {
      originTimezone = null;
    }
    if (!destinationTimezone || destinationTimezone === 'undefined' || (typeof destinationTimezone === 'string' && destinationTimezone.trim() === '')) {
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
      departureDate,
      departureTime,
      arrivalDate,
      arrivalTime,
      origin,
      originTimezone,
      destination,
      destinationTimezone,
      pnr,
      seat
    } = req.body;

    // Handle both combined and separate date/time fields
    if (!departureDateTime && departureDate && departureTime) {
      departureDateTime = `${departureDate}T${departureTime}`;
    }
    if (!arrivalDateTime && arrivalDate && arrivalTime) {
      arrivalDateTime = `${arrivalDate}T${arrivalTime}`;
    }

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
    if (!originTimezone || originTimezone === 'undefined' || (typeof originTimezone === 'string' && originTimezone.trim() === '')) {
      originTimezone = null;
    }
    if (!destinationTimezone || destinationTimezone === 'undefined' || (typeof destinationTimezone === 'string' && destinationTimezone.trim() === '')) {
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
    console.log('Update flight - input data:', {
      flightId: req.params.id,
      airline,
      flightNumber,
      origin,
      destination,
      departureDateTime,
      arrivalDateTime,
      originTimezone,
      destinationTimezone
    });

    console.log('Update flight - converted data:', {
      departureDateTime: convertToUTC(departureDateTime, originTimezone),
      arrivalDateTime: convertToUTC(arrivalDateTime, destinationTimezone),
      originResult: { coords: originResult.coords, timezone: originResult.timezone },
      destResult: { coords: destResult.coords, timezone: destResult.timezone }
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

    console.log('Flight updated successfully:', { flightId: req.params.id });

    // Check if this is an async request
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.json({ success: true, message: 'Flight updated successfully' });
    }

    redirectAfterSuccess(res, req, flight.tripId, 'flights', 'Flight updated successfully');
  } catch (error) {
    console.error('ERROR in updateFlight:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      flightId: req.params.id,
      requestBody: req.body
    });
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      const errorMessage = error.message || 'Error updating flight';
      console.error('Returning error response:', errorMessage);
      return res.status(500).json({ success: false, error: errorMessage });
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
    const flightData = flight.get({ plain: true });
    const flightName = `${flight.airline} ${flight.flightNumber}`;

    // Store the deleted flight in session for potential restoration
    storeDeletedItem(req.session, 'flight', flight.id, flightData, flightName);

    await flight.destroy();

    // Check if this is an async request
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.json({ success: true, message: 'Flight deleted successfully', itemId: flight.id });
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

exports.restoreFlight = async (req, res) => {
  try {
    const { id } = req.params;

    // Retrieve the deleted flight from session
    const deletedItem = retrieveDeletedItem(req.session, 'flight', id);

    if (!deletedItem) {
      return res.status(404).json({ success: false, error: 'Flight not found in undo history' });
    }

    // Verify user owns the flight
    if (deletedItem.itemData.userId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    // Recreate the flight
    await Flight.create(deletedItem.itemData);

    res.json({ success: true, message: 'Flight restored successfully' });
  } catch (error) {
    console.error('Error restoring flight:', error);
    res.status(500).json({ success: false, error: 'Error restoring flight' });
  }
};

// Get add flight form (for sidebar)
exports.getAddForm = async (req, res) => {
  try {
    const { tripId } = req.params;

    // Verify trip ownership
    const trip = await Trip.findByPk(tripId);
    if (!trip || trip.userId !== req.user.id) {
      return res.status(403).send('Unauthorized');
    }

    // Get all airlines and airports for autocomplete
    const airlines = airportService.getAllAirlines();
    const airports = require('../data/airports.json');

    // Render form partial for sidebar (not modal)
    res.render('partials/flight-form', {
      tripId: tripId,
      isEditing: false,
      data: null,
      isModal: false,  // This tells the partial to render for sidebar
      airlines: airlines,
      airports: airports
    });
  } catch (error) {
    console.error('Error fetching add form:', error);
    res.status(500).send('Error loading form');
  }
};

// Get edit flight form (for sidebar)
exports.getEditForm = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the flight with voucher attachments
    const { User, TravelCompanion } = require('../models');
    const flight = await Flight.findByPk(id, {
      include: [
        { model: Trip, as: 'trip', required: false },
        {
          model: VoucherAttachment,
          as: 'voucherAttachments',
          include: [
            {
              model: Voucher,
              as: 'voucher',
              attributes: ['id', 'type', 'issuer', 'voucherNumber', 'currency', 'totalValue', 'usedAmount', 'status']
            }
          ]
        }
      ]
    });

    // Verify ownership first
    if (!flight || flight.userId !== req.user.id) {
      return res.status(403).send('Unauthorized');
    }

    // If flight has voucher attachments, augment with traveler info
    if (flight.voucherAttachments && flight.voucherAttachments.length > 0) {
      try {
        for (const attachment of flight.voucherAttachments) {
          if (attachment.travelerType === 'USER') {
            const user = await User.findByPk(attachment.travelerId, {
              attributes: ['id', 'firstName', 'lastName', 'email']
            });
            attachment.traveler = user;
          } else if (attachment.travelerType === 'COMPANION') {
            const companion = await TravelCompanion.findByPk(attachment.travelerId, {
              attributes: ['id', 'name', 'email']
            });
            attachment.traveler = companion;
          }
        }
      } catch (travelerError) {
        // Log error but don't fail - allow form to render even if traveler data fetch fails
        console.error('Error fetching traveler data for attachments:', travelerError);
      }
    }

    // Ensure voucherAttachments is an array even if undefined
    if (!flight.voucherAttachments) {
      flight.voucherAttachments = [];
    }

    // Convert UTC times to local timezone for display
    // utcToLocal returns "YYYY-MM-DDTHH:mm" format, so we split it into date and time
    const departureDateTimeLocal = utcToLocal(flight.departureDateTime, flight.originTimezone);
    const arrivalDateTimeLocal = utcToLocal(flight.arrivalDateTime, flight.destinationTimezone);

    // Split the combined datetime into separate date and time fields for form input
    const departureDateTime = departureDateTimeLocal.split('T');
    const arrivalDateTime = arrivalDateTimeLocal.split('T');

    const departureDate = departureDateTime[0] || '';
    const departureTime = departureDateTime[1] || '';
    const arrivalDate = arrivalDateTime[0] || '';
    const arrivalTime = arrivalDateTime[1] || '';

    // Get all airlines and airports for autocomplete
    const airlines = airportService.getAllAirlines();
    const airports = require('../data/airports.json');

    // Render form partial for sidebar (not modal)
    res.render('partials/flight-form', {
      tripId: flight.tripId || '', // Use tripId if available, empty string otherwise
      trip: flight.trip ? { id: flight.trip.id } : { id: flight.tripId }, // Pass trip object for voucher panel
      isEditing: true,
      isOwner: true,  // User is owner since we already verified ownership above
      data: {
        id: flight.id,  // Explicitly include the flight ID for voucher attachments
        ...flight.toJSON(),
        departureDate,
        departureTime,
        arrivalDate,
        arrivalTime
      },
      isModal: false,  // This tells the partial to render for sidebar
      airlines: airlines,
      airports: airports
    });
  } catch (error) {
    console.error('Error fetching edit form:', error);
    console.error('Stack:', error.stack);
    res.status(500).send(`Error loading form: ${error.message}`);
  }
};