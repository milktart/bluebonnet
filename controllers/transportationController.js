const { Transportation, Trip } = require('../models');
const logger = require('../utils/logger');
const { utcToLocal } = require('../utils/timezoneHelper');
const { parseCompanions } = require('../utils/parseHelper');
const { sendAsyncResponse } = require('../utils/asyncResponseHelper');
const itemCompanionHelper = require('../utils/itemCompanionHelper');
const {
  verifyTripOwnership,
  geocodeOriginDestination,
  redirectAfterSuccess,
  redirectAfterError,
  verifyResourceOwnership,
  convertToUTC,
} = require('./helpers/resourceController');
const { getTripSelectorData, verifyTripEditAccess } = require('./helpers/tripSelectorHelper');
const { storeDeletedItem, retrieveDeletedItem } = require('./helpers/deleteManager');

exports.createTransportation = async (req, res) => {
  try {
    const { tripId } = req.params;
    const {
      method,
      journeyNumber,
      origin,
      originTimezone,
      destination,
      destinationTimezone,
      departureDateTime,
      arrivalDateTime,
      confirmationNumber,
      seat,
      companions,
    } = req.body;

    // Verify trip ownership if tripId provided
    if (tripId) {
      const trip = await verifyTripOwnership(tripId, req.user.id, Trip);
      if (!trip) {
        return sendAsyncResponse(res, false, null, 'Trip not found', null, req);
      }
    }

    // Geocode origin and destination
    const { originCoords, destCoords } = await geocodeOriginDestination({
      originNew: origin,
      destNew: destination,
    });

    const transportation = await Transportation.create({
      userId: req.user.id,
      tripId: tripId || null,
      method,
      journeyNumber,
      origin,
      originTimezone,
      originLat: originCoords?.lat,
      originLng: originCoords?.lng,
      destination,
      destinationTimezone,
      destinationLat: destCoords?.lat,
      destinationLng: destCoords?.lng,
      departureDateTime: convertToUTC(departureDateTime, originTimezone),
      arrivalDateTime: convertToUTC(arrivalDateTime, destinationTimezone),
      confirmationNumber,
      seat,
    });

    // Add companions to this transportation
    try {
      if (tripId) {
        const companionIds = parseCompanions(companions);

        // If companions were provided and not empty, use them; otherwise use fallback
        if (companionIds.length > 0) {
          await itemCompanionHelper.updateItemCompanions(
            'transportation',
            transportation.id,
            companionIds,
            tripId,
            req.user.id
          );
        } else {
          // Fallback: auto-add trip-level companions
          await itemCompanionHelper.autoAddTripCompanions(
            'transportation',
            transportation.id,
            tripId,
            req.user.id
          );
        }
      }
    } catch (e) {
      logger.error('Error managing companions for transportation:', e);
      // Don't fail the transportation creation due to companion errors
    }

    // Send response (handles both async and traditional form submission)
    return sendAsyncResponse(
      res,
      true,
      transportation,
      'Transportation added successfully',
      tripId,
      req,
      'transportation'
    );
  } catch (error) {
    logger.error(error);
    return sendAsyncResponse(
      res,
      false,
      null,
      'Error adding transportation',
      req.params.tripId,
      req
    );
  }
};

exports.updateTransportation = async (req, res) => {
  try {
    const {
      method,
      journeyNumber,
      origin,
      originTimezone,
      destination,
      destinationTimezone,
      departureDate,
      departureTime,
      arrivalDate,
      arrivalTime,
      departureDateTime: departureDateTimeCombined,
      arrivalDateTime: arrivalDateTimeCombined,
      confirmationNumber,
      seat,
      tripId: newTripId,
    } = req.body;

    // Find transportation with trip
    const transportation = await Transportation.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip', required: false }],
    });

    // Verify ownership
    if (!verifyResourceOwnership(transportation, req.user.id)) {
      const isAsync = req.headers['x-async-request'] === 'true';
      if (isAsync) {
        return res.status(403).json({ success: false, error: 'Transportation not found' });
      }
      return redirectAfterError(res, req, null, 'Transportation not found');
    }

    // Verify trip edit access if changing trips
    if (newTripId && newTripId !== transportation.tripId) {
      const hasAccess = await verifyTripEditAccess(newTripId, req.user.id);
      if (!hasAccess) {
        const isAsync = req.headers['x-async-request'] === 'true';
        if (isAsync) {
          return res.status(403).json({ success: false, error: 'Cannot attach to this trip' });
        }
        return redirectAfterError(res, req, null, 'Cannot attach to this trip');
      }
    }

    // Handle both combined datetime (from async form) and split date/time fields (from traditional forms)
    let departureDateTime;
    let arrivalDateTime;

    if (departureDateTimeCombined && arrivalDateTimeCombined) {
      // Async form submission sends combined datetime
      departureDateTime = departureDateTimeCombined;
      arrivalDateTime = arrivalDateTimeCombined;
    } else {
      // Traditional form submission sends split date/time fields
      departureDateTime = `${departureDate}T${departureTime}`;
      arrivalDateTime = `${arrivalDate}T${arrivalTime}`;
    }

    // Geocode origin and destination if they changed
    const { originCoords, destCoords } = await geocodeOriginDestination({
      originNew: origin,
      originOld: transportation.origin,
      originCoordsOld: { lat: transportation.originLat, lng: transportation.originLng },
      destNew: destination,
      destOld: transportation.destination,
      destCoordsOld: { lat: transportation.destinationLat, lng: transportation.destinationLng },
    });

    await transportation.update({
      method,
      journeyNumber,
      origin,
      originTimezone,
      originLat: originCoords?.lat,
      originLng: originCoords?.lng,
      destination,
      destinationTimezone,
      destinationLat: destCoords?.lat,
      destinationLng: destCoords?.lng,
      departureDateTime: convertToUTC(departureDateTime, originTimezone),
      arrivalDateTime: convertToUTC(arrivalDateTime, destinationTimezone),
      confirmationNumber,
      seat,
      tripId: newTripId || null,
    });

    // Check if this is an async request
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.json({
        success: true,
        data: transportation,
        message: 'Transportation updated successfully',
      });
    }

    redirectAfterSuccess(
      res,
      req,
      transportation.tripId,
      'transportation',
      'Transportation updated successfully'
    );
  } catch (error) {
    logger.error(error);
    const isAsync = req.headers['x-async-request'] === 'true';
    return res.status(500).json({ success: false, error: 'Error updating transportation' });
  }
};

exports.deleteTransportation = async (req, res) => {
  try {
    // Find transportation with trip
    const transportation = await Transportation.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip', required: false }],
    });

    // Verify ownership
    if (!verifyResourceOwnership(transportation, req.user.id)) {
      const isAsync = req.headers['x-async-request'] === 'true';
      if (isAsync) {
        return res.status(403).json({ success: false, error: 'Transportation not found' });
      }
      return redirectAfterError(res, req, null, 'Transportation not found');
    }

    const { tripId } = transportation;
    const transportationData = transportation.get({ plain: true });
    const transportationName = `${transportation.method} (${transportation.origin} → ${transportation.destination})`;

    // Store the deleted transportation in session for potential restoration
    storeDeletedItem(
      req.session,
      'transportation',
      transportation.id,
      transportationData,
      transportationName
    );

    await transportation.destroy();

    // Check if this is an async request
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.json({
        success: true,
        message: 'Transportation deleted successfully',
        itemId: transportation.id,
      });
    }

    redirectAfterSuccess(res, req, tripId, 'transportation', 'Transportation deleted successfully');
  } catch (error) {
    logger.error(error);
    const isAsync = req.headers['x-async-request'] === 'true';
    return res.status(500).json({ success: false, error: 'Error deleting transportation' });
  }
};

exports.restoreTransportation = async (req, res) => {
  try {
    const { id } = req.params;

    // Retrieve the deleted transportation from session
    const deletedItem = retrieveDeletedItem(req.session, 'transportation', id);

    if (!deletedItem) {
      return res
        .status(404)
        .json({ success: false, error: 'Transportation not found in undo history' });
    }

    // Verify user owns the transportation
    if (deletedItem.itemData.userId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    // Recreate the transportation
    await Transportation.create(deletedItem.itemData);

    res.json({ success: true, message: 'Transportation restored successfully' });
  } catch (error) {
    logger.error('Error restoring transportation:', error);
    res.status(500).json({ success: false, error: 'Error restoring transportation' });
  }
};

// Get add transportation form (for sidebar)
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

    // Return form data as JSON
    res.json({
      success: true,
      tripId: tripId || null,
      isEditing: false,
      data: null,
      currentTripId: tripSelectorData.currentTripId,
      currentTripName: tripSelectorData.currentTripName,
      availableTrips: tripSelectorData.availableTrips,
    });
  } catch (error) {
    logger.error('Error fetching add form:', error);
    res.status(500).json({ success: false, error: 'Error loading form' });
  }
};

// Get edit transportation form (for sidebar)
exports.getEditForm = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the transportation
    const transportation = await Transportation.findByPk(id, {
      include: [{ model: Trip, as: 'trip', required: false }],
    });

    // Verify ownership
    if (!transportation || !verifyResourceOwnership(transportation, req.user.id)) {
      return res.status(403).send('Unauthorized');
    }

    // Convert UTC times to local timezone for display
    // utcToLocal returns "YYYY-MM-DDTHH:mm" format, so we split it into date and time
    const departureDateTimeLocal = utcToLocal(
      transportation.departureDateTime,
      transportation.originTimezone || 'UTC'
    );
    const arrivalDateTimeLocal = utcToLocal(
      transportation.arrivalDateTime,
      transportation.destinationTimezone || 'UTC'
    );

    // Split the combined datetime into separate date and time fields for form input
    // Handle empty strings by providing defaults
    let departureDate = '';
    let departureTime = '';
    let arrivalDate = '';
    let arrivalTime = '';

    if (departureDateTimeLocal) {
      const [depDate, depTime] = departureDateTimeLocal.split('T');
      if (depDate && depTime) {
        departureDate = depDate;
        departureTime = depTime;
      }
    }

    if (arrivalDateTimeLocal) {
      const [arrDate, arrTime] = arrivalDateTimeLocal.split('T');
      if (arrDate && arrTime) {
        arrivalDate = arrDate;
        arrivalTime = arrTime;
      }
    }

    // Get available trips for trip selector
    const tripSelectorData = await getTripSelectorData(transportation, req.user.id);

    // Return form data as JSON
    res.json({
      success: true,
      tripId: transportation.tripId || '',
      isEditing: true,
      data: {
        ...transportation.toJSON(),
        departureDate,
        departureTime,
        arrivalDate,
        arrivalTime,
      },
      currentTripId: tripSelectorData.currentTripId,
      currentTripName: tripSelectorData.currentTripName,
      availableTrips: tripSelectorData.availableTrips,
    });
  } catch (error) {
    logger.error('Error fetching edit form:', error);
    res.status(500).json({ success: false, error: 'Error loading form' });
  }
};
