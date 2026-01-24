const { Transportation, Trip, ItemTrip } = require('../models');
const logger = require('../utils/logger');
const { utcToLocal } = require('../utils/timezoneHelper');
const itemCompanionService = require('../services/itemCompanionService');
const itemTripService = require('../services/itemTripService');
const { sendAsyncOrRedirect } = require('../utils/asyncResponseHandler');
const {
  verifyTripOwnership,
  geocodeOriginDestination,
  redirectAfterSuccess,
  redirectAfterError,
  verifyResourceOwnership,
  verifyTripItemEditAccess,
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
        return sendAsyncOrRedirect(req, res, {
          error: 'Trip not found',
          status: 403,
          redirectUrl: '/',
        });
      }
    }

    // Geocode origin and destination
    const { originCoords, destCoords } = await geocodeOriginDestination({
      originNew: origin,
      destNew: destination,
    });

    const transportation = await Transportation.create({
      userId: req.user.id,
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

    // Add transportation to trip via ItemTrip junction table
    if (tripId) {
      try {
        await itemTripService.addItemToTrip('transportation', transportation.id, tripId);
      } catch (e) {
        logger.error('Error adding transportation to trip in ItemTrip:', e);
      }
    }

    // Handle companions - unified method
    try {
      await itemCompanionService.handleItemCompanions(
        'transportation',
        transportation.id,
        companions,
        tripId,
        req.user.id
      );
    } catch (e) {
      logger.error('Error managing companions for transportation:', e);
    }

    // Centralized async/redirect response handling
    return sendAsyncOrRedirect(req, res, {
      success: true,
      data: transportation,
      message: 'Transportation added successfully',
      redirectUrl: tripId ? `/trips/${tripId}` : '/dashboard',
    });
  } catch (error) {
    logger.error('ERROR in createTransportation:', error);
    return sendAsyncOrRedirect(req, res, {
      success: false,
      error: error.message || 'Error adding transportation',
      status: 500,
      redirectUrl: req.params.tripId ? `/trips/${req.params.tripId}` : '/dashboard',
    });
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

    // Verify ownership - check if user is item creator OR trip owner OR trip admin with canEdit permission
    const isItemOwner = verifyResourceOwnership(transportation, req.user.id);
    const { TripCompanion } = require('../models');
    const canEditTrip = transportation.tripId
      ? await verifyTripItemEditAccess(transportation.tripId, req.user.id, Trip, TripCompanion)
      : false;

    if (!isItemOwner && !canEditTrip) {
      return sendAsyncOrRedirect(req, res, {
        error: 'Transportation not found',
        status: 403,
        redirectUrl: '/',
      });
    }

    // Verify trip edit access if changing trips
    if (newTripId && newTripId !== transportation.tripId) {
      const hasAccess = await verifyTripEditAccess(newTripId, req.user.id);
      if (!hasAccess) {
        return sendAsyncOrRedirect(req, res, {
          error: 'Cannot attach to this trip',
          status: 403,
          redirectUrl: '/',
        });
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
    });

    // Update trip association via ItemTrip if it changed
    try {
      if (newTripId && newTripId !== transportation.tripId) {
        if (transportation.tripId) {
          await itemTripService.removeItemFromTrip(
            'transportation',
            transportation.id,
            transportation.tripId
          );
        }
        await itemTripService.addItemToTrip('transportation', transportation.id, newTripId);
      } else if (newTripId === null && transportation.tripId) {
        await itemTripService.removeItemFromTrip(
          'transportation',
          transportation.id,
          transportation.tripId
        );
      }
    } catch (e) {
      logger.error('Error updating transportation trip association:', e);
    }

    logger.info('Transportation updated successfully:', { transportationId: req.params.id });

    // Centralized async/redirect response handling
    return sendAsyncOrRedirect(req, res, {
      success: true,
      data: transportation,
      message: 'Transportation updated successfully',
      redirectUrl:
        newTripId || transportation.tripId
          ? `/trips/${newTripId || transportation.tripId}`
          : '/dashboard',
    });
  } catch (error) {
    logger.error('ERROR in updateTransportation:', error);
    return sendAsyncOrRedirect(req, res, {
      success: false,
      error: error.message || 'Error updating transportation',
      status: 500,
      redirectUrl: '/dashboard',
    });
  }
};

exports.deleteTransportation = async (req, res) => {
  try {
    // Find transportation with trip
    const transportation = await Transportation.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip', required: false }],
    });

    // Verify ownership - check if user is item creator OR trip owner OR trip admin with canEdit permission
    const isItemOwner = verifyResourceOwnership(transportation, req.user.id);
    const { TripCompanion } = require('../models');
    const canEditTrip = transportation.tripId
      ? await verifyTripItemEditAccess(transportation.tripId, req.user.id, Trip, TripCompanion)
      : false;

    if (!isItemOwner && !canEditTrip) {
      return sendAsyncOrRedirect(req, res, {
        error: 'Transportation not found',
        status: 403,
        redirectUrl: '/',
      });
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

    // Remove from all trips via ItemTrip
    try {
      await itemTripService.removeItemFromAllTrips('transportation', transportation.id);
    } catch (e) {
      logger.error('Error removing transportation from ItemTrip records:', e);
    }

    await transportation.destroy();

    // Centralized async/redirect response handling
    return sendAsyncOrRedirect(req, res, {
      success: true,
      message: 'Transportation deleted successfully',
      data: { itemId: transportation.id },
      redirectUrl: tripId ? `/trips/${tripId}` : '/dashboard',
    });
  } catch (error) {
    logger.error('ERROR in deleteTransportation:', error);
    return sendAsyncOrRedirect(req, res, {
      success: false,
      error: 'Error deleting transportation',
      status: 500,
      redirectUrl: '/dashboard',
    });
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

    // Get trip IDs from ItemTrip if available (new system)
    let associatedTripIds = [];
    try {
      const itemTrips = await ItemTrip.findAll({
        where: {
          itemId: transportation.id,
          itemType: 'transportation',
        },
        attributes: ['tripId'],
      });
      associatedTripIds = itemTrips.map((it) => it.tripId);
    } catch (e) {
      logger.error('Error fetching ItemTrip associations:', e);
    }

    // Use ItemTrip associations if available, otherwise fall back to transportation.tripId
    const primaryTripId =
      associatedTripIds.length > 0 ? associatedTripIds[0] : transportation.tripId;

    // Get available trips for trip selector
    const tripSelectorData = await getTripSelectorData(transportation, req.user.id);

    // Return form data as JSON
    res.json({
      success: true,
      tripId: primaryTripId || '',
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
