const { Flight, Trip, VoucherAttachment, Voucher } = require('../models');
const logger = require('../utils/logger');
const airportService = require('../services/airportService');
const { utcToLocal } = require('../utils/timezoneHelper');
const itemCompanionHelper = require('../utils/itemCompanionHelper');
const {
  verifyTripOwnership,
  redirectAfterSuccess,
  redirectAfterError,
  verifyResourceOwnership,
  convertToUTC,
  geocodeWithAirportFallback,
} = require('./helpers/resourceController');
const { storeDeletedItem, retrieveDeletedItem } = require('./helpers/deleteManager');

exports.searchAirports = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const airports = await airportService.searchAirports(query, 10);

    const results = airports.map((airport) => ({
      iata: airport.iata,
      name: airport.name,
      city: airport.city,
      country: airport.country,
      timezone: airport.timezone,
      label: `${airport.iata} - ${airport.city}, ${airport.country}`,
      value: airport.iata,
    }));

    res.json({ success: true, data: results });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: 'Error searching airports' });
  }
};

exports.searchFlight = async (req, res) => {
  try {
    const { flightNumber } = req.query;

    if (!flightNumber) {
      return res.json({
        success: false,
        message: 'Please provide a flight number',
      });
    }

    // Parse flight number to get airline code
    const airlineCode = airportService.getAirlineCodeFromFlightNumber(flightNumber);

    if (!airlineCode) {
      return res.json({
        success: false,
        message: 'Could not identify airline from flight number. Please enter details manually.',
      });
    }

    // Get airline name
    const airlineName = airportService.getAirlineNameFromFlightNumber(flightNumber);

    // Return airline information - user will need to enter origin/destination
    return res.json({
      success: true,
      data: {
        airline: airlineName || airlineCode,
        flightNumber: flightNumber.trim().toUpperCase(),
      },
      message: 'Airline identified. Please enter origin and destination airport codes.',
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: 'Error searching flight' });
  }
};

exports.createFlight = async (req, res) => {
  try {
    const { tripId } = req.params;
    const {
      flightNumber,
      departureDate,
      departureTime,
      arrivalDate,
      arrivalTime,
      pnr,
      seat,
      companions,
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
      seat,
    });

    // Add companions to this flight
    try {
      if (tripId) {
        let companionIds = [];

        // Try to parse companions if provided
        if (companions) {
          try {
            companionIds = typeof companions === 'string' ? JSON.parse(companions) : companions;
            companionIds = Array.isArray(companionIds) ? companionIds : [];
          } catch (e) {
            logger.error('Error parsing companions:', e);
            companionIds = [];
          }
        }

        // If companions were provided and not empty, use them; otherwise use fallback
        if (companionIds.length > 0) {
          await itemCompanionHelper.updateItemCompanions(
            'flight',
            flight.id,
            companionIds,
            tripId,
            req.user.id
          );
        } else {
          // Fallback: auto-add trip-level companions
          await itemCompanionHelper.autoAddTripCompanions('flight', flight.id, tripId, req.user.id);
        }
      }
    } catch (e) {
      logger.error('Error managing companions for flight:', e);
      // Don't fail the flight creation due to companion errors
    }

    // Check if this is an async request
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.json({ success: true, message: 'Flight added successfully' });
    }

    redirectAfterSuccess(res, req, tripId, 'flights', 'Flight added successfully');
  } catch (error) {
    logger.error('ERROR in createFlight:', error);
    logger.error('Request body:', req.body);
    logger.error('Request params:', req.params);
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res
        .status(500)
        .json({ success: false, error: error.message || 'Error adding flight' });
    }
    redirectAfterError(res, req, req.params.tripId, 'Error adding flight');
  }
};

exports.updateFlight = async (req, res) => {
  try {
    const {
      flightNumber,
      departureDate,
      departureTime,
      arrivalDate,
      arrivalTime,
      pnr,
      seat,
      companions,
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

    // Find flight with trip
    const flight = await Flight.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip', required: false }],
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

    // Geocode origin and destination if they changed
    let originResult;
    let destResult;

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
        formattedLocation: flight.origin,
      };
    }

    if (destination !== flight.destination) {
      destResult = await geocodeWithAirportFallback(
        destination,
        airportService,
        destinationTimezone
      );
      destination = destResult.formattedLocation;
      if (!destinationTimezone) destinationTimezone = destResult.timezone;
    } else {
      // Destination unchanged, but we might need to detect timezone for old flights
      if (!destinationTimezone && !flight.destinationTimezone) {
        // Try to detect timezone from airport code in existing destination
        destResult = await geocodeWithAirportFallback(
          destination,
          airportService,
          destinationTimezone
        );
        destinationTimezone = destResult.timezone;
      } else {
        destinationTimezone = destinationTimezone || flight.destinationTimezone;
      }

      destResult = {
        coords: { lat: flight.destinationLat, lng: flight.destinationLng },
        timezone: destinationTimezone,
        formattedLocation: flight.destination,
      };
    }

    // Debug logging
    logger.info('Update flight - input data:', {
      flightId: req.params.id,
      airline,
      flightNumber,
      origin,
      destination,
      departureDateTime,
      arrivalDateTime,
      originTimezone,
      destinationTimezone,
    });

    logger.info('Update flight - converted data:', {
      departureDateTime: convertToUTC(departureDateTime, originTimezone),
      arrivalDateTime: convertToUTC(arrivalDateTime, destinationTimezone),
      originResult: { coords: originResult.coords, timezone: originResult.timezone },
      destResult: { coords: destResult.coords, timezone: destResult.timezone },
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
    });

    // Update companions for this flight
    if (companions) {
      let companionIds = [];
      try {
        companionIds = typeof companions === 'string' ? JSON.parse(companions) : companions;
      } catch (e) {
        companionIds = Array.isArray(companions) ? companions : [];
      }

      if (companionIds.length > 0) {
        await itemCompanionHelper.updateItemCompanions(
          'flight',
          flight.id,
          companionIds,
          flight.tripId,
          req.user.id
        );
      } else {
        // No companions provided, remove all
        await itemCompanionHelper.removeItemCompanions('flight', flight.id);
      }
    }

    logger.info('Flight updated successfully:', { flightId: req.params.id });

    // Check if this is an async request
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.json({ success: true, message: 'Flight updated successfully' });
    }

    redirectAfterSuccess(res, req, flight.tripId, 'flights', 'Flight updated successfully');
  } catch (error) {
    logger.error('ERROR in updateFlight:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      flightId: req.params.id,
      requestBody: req.body,
    });
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      const errorMessage = error.message || 'Error updating flight';
      logger.error('Returning error response:', errorMessage);
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
      include: [{ model: Trip, as: 'trip', required: false }],
    });

    // Verify ownership
    if (!verifyResourceOwnership(flight, req.user.id)) {
      const isAsync = req.headers['x-async-request'] === 'true';
      if (isAsync) {
        return res.status(403).json({ success: false, error: 'Flight not found' });
      }
      return redirectAfterError(res, req, null, 'Flight not found');
    }

    const { tripId } = flight;
    const flightData = flight.get({ plain: true });
    const flightName = `${flight.airline} ${flight.flightNumber}`;

    // Store the deleted flight in session for potential restoration
    storeDeletedItem(req.session, 'flight', flight.id, flightData, flightName);

    // Remove all item companions
    await itemCompanionHelper.removeItemCompanions('flight', flight.id);

    await flight.destroy();

    // Check if this is an async request
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.json({ success: true, message: 'Flight deleted successfully', itemId: flight.id });
    }

    redirectAfterSuccess(res, req, tripId, 'flights', 'Flight deleted successfully');
  } catch (error) {
    logger.error(error);
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
    logger.error('Error restoring flight:', error);
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

    // Render form partial for sidebar (not modal)
    // Airport and airline data will be loaded via AJAX
    res.render('partials/flight-form', {
      tripId,
      isEditing: false,
      data: null,
      isModal: false, // This tells the partial to render for sidebar
    });
  } catch (error) {
    logger.error('Error fetching add form:', error);
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
              attributes: [
                'id',
                'type',
                'issuer',
                'voucherNumber',
                'currency',
                'totalValue',
                'usedAmount',
                'status',
              ],
            },
          ],
        },
      ],
    });

    // Verify ownership first
    if (!flight || flight.userId !== req.user.id) {
      return res.status(403).send('Unauthorized');
    }

    // If flight has voucher attachments, augment with traveler info
    let voucherAttachmentsWithTravelers = [];
    if (flight.voucherAttachments && flight.voucherAttachments.length > 0) {
      try {
        for (const attachment of flight.voucherAttachments) {
          let traveler = null;
          if (attachment.travelerType === 'USER') {
            traveler = await User.findByPk(attachment.travelerId, {
              attributes: ['id', 'firstName', 'lastName', 'email'],
            });
          } else if (attachment.travelerType === 'COMPANION') {
            traveler = await TravelCompanion.findByPk(attachment.travelerId, {
              attributes: ['id', 'name', 'email'],
            });
          }

          // Convert attachment to plain object and add traveler
          const attachmentData = attachment.toJSON();
          attachmentData.traveler = traveler ? traveler.toJSON() : null;
          voucherAttachmentsWithTravelers.push(attachmentData);

          logger.info('Attachment traveler data:', {
            travelerId: attachment.travelerId,
            travelerType: attachment.travelerType,
            travelerData: traveler,
          });
        }
      } catch (travelerError) {
        // Log error but don't fail - allow form to render even if traveler data fetch fails
        logger.error('Error fetching traveler data for attachments:', travelerError);
        voucherAttachmentsWithTravelers = flight.voucherAttachments.map((att) => att.toJSON());
      }
    }

    // Use the augmented attachments
    const flightData = flight.toJSON();
    flightData.voucherAttachments = voucherAttachmentsWithTravelers;

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

    // Render form partial for sidebar (not modal)
    // Airport and airline data will be loaded via AJAX
    res.render('partials/flight-form', {
      tripId: flight.tripId || '', // Use tripId if available, empty string otherwise
      trip: flight.trip ? { id: flight.trip.id } : { id: flight.tripId }, // Pass trip object for voucher panel
      isEditing: true,
      isOwner: true, // User is owner since we already verified ownership above
      data: {
        ...flightData,
        departureDate,
        departureTime,
        arrivalDate,
        arrivalTime,
      },
      isModal: false, // This tells the partial to render for sidebar
    });
  } catch (error) {
    logger.error('Error fetching edit form:', error);
    logger.error('Stack:', error.stack);
    res.status(500).send(`Error loading form: ${error.message}`);
  }
};
