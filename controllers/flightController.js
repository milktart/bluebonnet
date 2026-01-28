const { Flight, Trip, VoucherAttachment, Voucher, ItemTrip } = require('../models');
const logger = require('../utils/logger');
const airportService = require('../services/airportService');
const itemCompanionService = require('../services/itemCompanionService');
const itemTripService = require('../services/itemTripService');
const { utcToLocal } = require('../utils/timezoneHelper');
const { sendAsyncOrRedirect } = require('../utils/asyncResponseHandler');
const { combineDateTimeFields, sanitizeTimezones } = require('../utils/dateTimeParser');
const {
  verifyTripOwnership,
  verifyResourceOwnership,
  verifyTripItemEditAccess,
  convertToUTC,
  geocodeWithAirportFallback,
} = require('./helpers/resourceController');
const { getTripSelectorData, verifyTripEditAccess } = require('./helpers/tripSelectorHelper');
const { storeDeletedItem, retrieveDeletedItem } = require('./helpers/deleteManager');
const { finalizItemCreation } = require('./helpers/itemFactory');
const { ITEM_TYPE_FLIGHT } = require('../constants/companionConstants');

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
    const { flightNumber, pnr, seat, companions } = req.body;
    let {
      airline,
      departureDateTime,
      arrivalDateTime,
      origin,
      originTimezone,
      destination,
      destinationTimezone,
    } = req.body;

    // Verify trip ownership if tripId provided
    if (tripId) {
      const trip = await verifyTripOwnership(tripId, req.user.id, Trip);
      if (!trip) {
        return sendAsyncOrRedirect(req, res, {
          error: 'Trip not found',
          status: 403,
          redirectUrl: '/',
        });
      }
    }

    // Auto-populate airline from flight number if not provided
    if (!airline && flightNumber) {
      const airlineName = airportService.getAirlineNameFromFlightNumber(flightNumber);
      if (airlineName) {
        airline = airlineName;
      }
    }

    // Centralized datetime and timezone handling
    let data = {
      departureDateTime,
      arrivalDateTime,
      originTimezone,
      destinationTimezone,
      ...req.body,
    };
    data = combineDateTimeFields(data, ['departure', 'arrival']);
    data = sanitizeTimezones(data, ['originTimezone', 'destinationTimezone']);
    departureDateTime = data.departureDateTime;
    arrivalDateTime = data.arrivalDateTime;
    originTimezone = data.originTimezone;
    destinationTimezone = data.destinationTimezone;

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

    // Add to trip and handle companions
    await finalizItemCreation({
      itemType: ITEM_TYPE_FLIGHT,
      item: flight,
      tripId,
      userId: req.user.id,
      companions,
    });

    // Centralized async/redirect response handling
    return sendAsyncOrRedirect(req, res, {
      success: true,
      data: flight,
      message: 'Flight added successfully',
      redirectUrl: tripId ? `/trips/${tripId}` : '/dashboard',
    });
  } catch (error) {
    return sendAsyncOrRedirect(req, res, {
      success: false,
      error: error.message || 'Error adding flight',
      status: 500,
      redirectUrl: req.params.tripId ? `/trips/${req.params.tripId}` : '/dashboard',
    });
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

    // Find flight with trip
    const flight = await Flight.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip', required: false }],
    });

    // Verify ownership - check if user is item creator OR trip owner OR trip admin with canEdit permission
    const isItemOwner = verifyResourceOwnership(flight, req.user.id);
    const { TripCompanion } = require('../models');
    const canEditTrip = flight.tripId
      ? await verifyTripItemEditAccess(flight.tripId, req.user.id, Trip, TripCompanion)
      : false;

    if (!isItemOwner && !canEditTrip) {
      return sendAsyncOrRedirect(req, res, {
        error: 'Flight not found',
        status: 403,
        redirectUrl: '/',
      });
    }

    // Verify trip edit access if changing trips
    if (newTripId && newTripId !== flight.tripId) {
      const hasAccess = await verifyTripEditAccess(newTripId, req.user.id);
      if (!hasAccess) {
        return sendAsyncOrRedirect(req, res, {
          error: 'Cannot attach to this trip',
          status: 403,
          redirectUrl: '/',
        });
      }
    }

    // Auto-populate airline from flight number if not provided
    if (!airline && flightNumber) {
      const airlineName = airportService.getAirlineNameFromFlightNumber(flightNumber);
      if (airlineName) {
        airline = airlineName;
      }
    }

    // Centralized datetime and timezone handling
    let data = {
      departureDateTime,
      arrivalDateTime,
      departureDate,
      departureTime,
      arrivalDate,
      arrivalTime,
      originTimezone,
      destinationTimezone,
      ...req.body,
    };
    data = combineDateTimeFields(data, ['departure', 'arrival']);
    data = sanitizeTimezones(data, ['originTimezone', 'destinationTimezone']);
    departureDateTime = data.departureDateTime;
    arrivalDateTime = data.arrivalDateTime;
    originTimezone = data.originTimezone;
    destinationTimezone = data.destinationTimezone;

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

    // Update trip association via ItemTrip if it changed
    try {
      if (newTripId && newTripId !== flight.tripId) {
        // Remove from old trip if there was one
        if (flight.tripId) {
          await itemTripService.removeItemFromTrip('flight', flight.id, flight.tripId);
        }
        // Add to new trip
        await itemTripService.addItemToTrip('flight', flight.id, newTripId, req.user.id);
      } else if (newTripId === null && flight.tripId) {
        // Remove from trip if explicitly setting to null
        await itemTripService.removeItemFromTrip('flight', flight.id, flight.tripId);
      }
    } catch (e) {
      // Don't fail the update due to ItemTrip errors
    }

    // Update companions for this flight
    // Note: When editing an existing flight, companions are typically managed via
    // the real-time API calls in the UI, not via form submission. We only update
    // companions here if a non-empty array is explicitly provided.
    if (companions) {
      try {
        const currentTripId = newTripId || flight.tripId;
        if (currentTripId) {
          await itemCompanionService.handleItemCompanions(
            'flight',
            flight.id,
            companions,
            currentTripId,
            req.user.id
          );
        }
      } catch (e) {
        // Don't fail the update due to companion errors
      }
    }

    // Centralized async/redirect response handling
    return sendAsyncOrRedirect(req, res, {
      success: true,
      data: flight,
      message: 'Flight updated successfully',
      redirectUrl:
        newTripId || flight.tripId ? `/trips/${newTripId || flight.tripId}` : '/dashboard',
    });
  } catch (error) {
    const errorMessage = error.message || 'Error updating flight';

    return sendAsyncOrRedirect(req, res, {
      success: false,
      error: errorMessage,
      status: 500,
      redirectUrl: '/dashboard',
    });
  }
};

exports.deleteFlight = async (req, res) => {
  try {
    // Find flight with trip
    const flight = await Flight.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip', required: false }],
    });

    // Verify ownership - check if user is item creator OR trip owner OR trip admin with canEdit permission
    const isItemOwner = verifyResourceOwnership(flight, req.user.id);
    const { TripCompanion } = require('../models');
    const canEditTrip = flight.tripId
      ? await verifyTripItemEditAccess(flight.tripId, req.user.id, Trip, TripCompanion)
      : false;

    if (!isItemOwner && !canEditTrip) {
      return sendAsyncOrRedirect(req, res, {
        error: 'Flight not found',
        status: 403,
        redirectUrl: '/',
      });
    }

    const { tripId } = flight;
    const flightData = flight.get({ plain: true });
    const flightName = `${flight.airline} ${flight.flightNumber}`;

    // Store the deleted flight in session for potential restoration
    storeDeletedItem(req.session, 'flight', flight.id, flightData, flightName);

    // Remove from all trips via ItemTrip
    try {
      await itemTripService.removeItemFromAllTrips('flight', flight.id);
    } catch (e) {
      // Don't fail deletion due to ItemTrip cleanup errors
    }

    await flight.destroy();

    // Centralized async/redirect response handling
    return sendAsyncOrRedirect(req, res, {
      success: true,
      message: 'Flight deleted successfully',
      data: { itemId: flight.id },
      redirectUrl: tripId ? `/trips/${tripId}` : '/dashboard',
    });
  } catch (error) {
    return sendAsyncOrRedirect(req, res, {
      success: false,
      error: 'Error deleting flight',
      status: 500,
      redirectUrl: '/dashboard',
    });
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
    res.status(500).json({ success: false, error: 'Error restoring flight' });
  }
};

// Get add flight form (for sidebar)
exports.getAddForm = async (req, res) => {
  try {
    const { tripId } = req.params;

    // Verify trip ownership if tripId provided (for trip-associated items)
    // If no tripId, this is a standalone form (allowed without trip)
    if (tripId) {
      const trip = await Trip.findByPk(tripId);
      if (!trip || trip.userId !== req.user.id) {
        return res.status(403).send('Unauthorized');
      }
    }

    // Get available trips for trip selector
    const tripSelectorData = await getTripSelectorData({ tripId: tripId || null }, req.user.id);

    // Get airline data for the form (used by lookupAirline function)
    const airlineData = airportService.getAllAirlines();

    // Return form data as JSON
    res.json({
      success: true,
      tripId: tripId || null,
      isEditing: false,
      data: null,
      airlineData,
      currentTripId: tripSelectorData.currentTripId,
      currentTripName: tripSelectorData.currentTripName,
      availableTrips: tripSelectorData.availableTrips,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error loading form' });
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
        }
      } catch (travelerError) {
        // Log error but don't fail - allow form to render even if traveler data fetch fails
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

    // Get airline data for the form (used by lookupAirline function)
    const airlineData = airportService.getAllAirlines();

    // Get available trips for trip selector
    const tripSelectorData = await getTripSelectorData(flight, req.user.id);

    // Get trip IDs from ItemTrip if available (new system)
    let associatedTripIds = [];
    try {
      const itemTrips = await ItemTrip.findAll({
        where: {
          itemId: flight.id,
          itemType: ITEM_TYPE_FLIGHT,
        },
        attributes: ['tripId'],
      });
      associatedTripIds = itemTrips.map((it) => it.tripId);
    } catch (e) {
      // Silently fail if unable to find associated trips
    }

    // Use ItemTrip associations if available, otherwise fall back to flight.tripId
    const primaryTripId = associatedTripIds.length > 0 ? associatedTripIds[0] : flight.tripId;

    // Return form data as JSON
    let tripForResponse = null;
    if (flight.trip) {
      tripForResponse = { id: flight.trip.id };
    } else if (primaryTripId) {
      tripForResponse = { id: primaryTripId };
    }

    res.json({
      success: true,
      tripId: primaryTripId || '',
      trip: tripForResponse,
      isEditing: true,
      isOwner: true,
      data: {
        ...flightData,
        departureDate,
        departureTime,
        arrivalDate,
        arrivalTime,
      },
      airlineData,
      currentTripId: tripSelectorData.currentTripId,
      currentTripName: tripSelectorData.currentTripName,
      availableTrips: tripSelectorData.availableTrips,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: `Error loading form: ${error.message}` });
  }
};
