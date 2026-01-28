const { CarRental, Trip, ItemTrip } = require('../models');
const logger = require('../utils/logger');
const itemTripService = require('../services/itemTripService');
const { sendAsyncOrRedirect } = require('../utils/asyncResponseHandler');
const {
  verifyTripOwnership,
  geocodeOriginDestination,
  verifyResourceOwnership,
  verifyResourceOwnershipViaTrip,
  verifyTripItemEditAccess,
  convertToUTC,
} = require('./helpers/resourceController');
const { utcToLocal } = require('../utils/timezoneHelper');
const { storeDeletedItem, retrieveDeletedItem } = require('./helpers/deleteManager');
const { getTripSelectorData, verifyTripEditAccess } = require('./helpers/tripSelectorHelper');
const { finalizItemCreation } = require('./helpers/itemFactory');

exports.createCarRental = async (req, res) => {
  try {
    const { tripId } = req.params;
    const {
      company,
      pickupLocation,
      pickupTimezone,
      dropoffLocation,
      dropoffTimezone,
      pickupDateTime,
      dropoffDateTime,
      confirmationNumber,
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

    // Geocode pickup and dropoff locations
    const { originCoords: pickupCoords, destCoords: dropoffCoords } =
      await geocodeOriginDestination({
        originNew: pickupLocation,
        destNew: dropoffLocation,
      });

    const carRental = await CarRental.create({
      company,
      pickupLocation,
      pickupTimezone,
      pickupLat: pickupCoords?.lat,
      pickupLng: pickupCoords?.lng,
      dropoffLocation,
      dropoffTimezone,
      dropoffLat: dropoffCoords?.lat,
      dropoffLng: dropoffCoords?.lng,
      pickupDateTime: convertToUTC(pickupDateTime, pickupTimezone),
      dropoffDateTime: convertToUTC(dropoffDateTime, dropoffTimezone),
      confirmationNumber,
      userId: req.user.id,
    });

    // Add to trip and handle companions
    await finalizItemCreation({
      itemType: 'car_rental',
      item: carRental,
      tripId,
      userId: req.user.id,
      companions,
    });

    // Centralized async/redirect response handling
    return sendAsyncOrRedirect(req, res, {
      success: true,
      data: carRental,
      message: 'Car rental added successfully',
      redirectUrl: tripId ? `/trips/${tripId}` : '/dashboard',
    });
  } catch (error) {
    logger.error('ERROR in createCarRental:', error);
    return sendAsyncOrRedirect(req, res, {
      success: false,
      error: error.message || 'Error adding car rental',
      status: 500,
      redirectUrl: req.params.tripId ? `/trips/${req.params.tripId}` : '/dashboard',
    });
  }
};

exports.updateCarRental = async (req, res) => {
  try {
    const {
      company,
      pickupLocation,
      pickupTimezone,
      dropoffLocation,
      dropoffTimezone,
      pickupDateTime,
      dropoffDateTime,
      confirmationNumber,
      tripId: newTripId,
    } = req.body;

    // Find car rental with trip
    const carRental = await CarRental.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip' }],
    });

    // Verify ownership - check if user is item owner OR trip owner OR trip admin with canEdit permission
    const isItemOwner = verifyResourceOwnership(carRental, req.user.id);
    const { TripCompanion } = require('../models');
    const canEditTrip = carRental.tripId
      ? await verifyTripItemEditAccess(carRental.tripId, req.user.id, Trip, TripCompanion)
      : false;

    if (!isItemOwner && !canEditTrip) {
      return sendAsyncOrRedirect(req, res, {
        error: 'Car rental not found',
        status: 403,
        redirectUrl: '/',
      });
    }

    // Verify trip edit access if changing trip association
    if (newTripId && newTripId !== carRental.tripId) {
      const hasAccess = await verifyTripEditAccess(newTripId, req.user.id);
      if (!hasAccess) {
        return sendAsyncOrRedirect(req, res, {
          error: 'Cannot attach to this trip',
          status: 403,
          redirectUrl: '/',
        });
      }
    }

    // Geocode locations if they changed
    const { originCoords: pickupCoords, destCoords: dropoffCoords } =
      await geocodeOriginDestination({
        originNew: pickupLocation,
        originOld: carRental.pickupLocation,
        originCoordsOld: { lat: carRental.pickupLat, lng: carRental.pickupLng },
        destNew: dropoffLocation,
        destOld: carRental.dropoffLocation,
        destCoordsOld: { lat: carRental.dropoffLat, lng: carRental.dropoffLng },
      });

    await carRental.update({
      company,
      pickupLocation,
      pickupTimezone,
      pickupLat: pickupCoords?.lat,
      pickupLng: pickupCoords?.lng,
      dropoffLocation,
      dropoffTimezone,
      dropoffLat: dropoffCoords?.lat,
      dropoffLng: dropoffCoords?.lng,
      pickupDateTime: convertToUTC(pickupDateTime, pickupTimezone),
      dropoffDateTime: convertToUTC(dropoffDateTime, dropoffTimezone),
      confirmationNumber,
    });

    // Update trip association via ItemTrip if it changed
    try {
      if (newTripId && newTripId !== carRental.tripId) {
        if (carRental.tripId) {
          await itemTripService.removeItemFromTrip('car_rental', carRental.id, carRental.tripId);
        }
        await itemTripService.addItemToTrip('car_rental', carRental.id, newTripId, req.user.id);
      } else if (newTripId === null && carRental.tripId) {
        await itemTripService.removeItemFromTrip('car_rental', carRental.id, carRental.tripId);
      }
    } catch (e) {
      logger.error('Error updating car rental trip association:', e);
    }

    // Centralized async/redirect response handling
    return sendAsyncOrRedirect(req, res, {
      success: true,
      data: carRental,
      message: 'Car rental updated successfully',
      redirectUrl:
        newTripId || carRental.tripId ? `/trips/${newTripId || carRental.tripId}` : '/dashboard',
    });
  } catch (error) {
    logger.error('ERROR in updateCarRental:', error);
    return sendAsyncOrRedirect(req, res, {
      success: false,
      error: error.message || 'Error updating car rental',
      status: 500,
      redirectUrl: '/dashboard',
    });
  }
};

exports.deleteCarRental = async (req, res) => {
  try {
    // Find car rental with trip
    const carRental = await CarRental.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip' }],
    });

    // Verify ownership - check if user is item owner OR trip owner OR trip admin with canEdit permission
    const isItemOwner = verifyResourceOwnership(carRental, req.user.id);
    const { TripCompanion } = require('../models');
    const canEditTrip = carRental.tripId
      ? await verifyTripItemEditAccess(carRental.tripId, req.user.id, Trip, TripCompanion)
      : false;

    if (!isItemOwner && !canEditTrip) {
      return sendAsyncOrRedirect(req, res, {
        error: 'Car rental not found',
        status: 403,
        redirectUrl: '/',
      });
    }

    const { tripId } = carRental;
    const carRentalData = carRental.get({ plain: true });

    // Store the deleted car rental in session for potential restoration
    storeDeletedItem(req.session, 'carRental', carRental.id, carRentalData, carRental.company);

    // Remove from all trips via ItemTrip
    try {
      await itemTripService.removeItemFromAllTrips('car_rental', carRental.id);
    } catch (e) {
      logger.error('Error removing car rental from ItemTrip records:', e);
    }

    await carRental.destroy();

    // Centralized async/redirect response handling
    return sendAsyncOrRedirect(req, res, {
      success: true,
      message: 'Car rental deleted successfully',
      data: { itemId: carRental.id },
      redirectUrl: tripId ? `/trips/${tripId}` : '/dashboard',
    });
  } catch (error) {
    logger.error('ERROR in deleteCarRental:', error);
    return sendAsyncOrRedirect(req, res, {
      success: false,
      error: 'Error deleting car rental',
      status: 500,
      redirectUrl: '/dashboard',
    });
  }
};

exports.restoreCarRental = async (req, res) => {
  try {
    const { id } = req.params;

    // Retrieve the deleted car rental from session
    const deletedItem = retrieveDeletedItem(req.session, 'carRental', id);

    if (!deletedItem) {
      return res
        .status(404)
        .json({ success: false, error: 'Car rental not found in undo history' });
    }

    // Verify user owns the trip (car rentals are trip-based)
    const trip = await Trip.findByPk(deletedItem.itemData.tripId);
    if (!trip || trip.userId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    // Recreate the car rental
    await CarRental.create(deletedItem.itemData);

    res.json({ success: true, message: 'Car rental restored successfully' });
  } catch (error) {
    logger.error('Error restoring car rental:', error);
    res.status(500).json({ success: false, error: 'Error restoring car rental' });
  }
};

exports.getAddForm = async (req, res) => {
  try {
    const { tripId } = req.params;

    // Verify trip ownership if tripId provided (for trip-associated items)
    // If no tripId, this is a standalone form (allowed without trip)
    if (tripId) {
      const trip = await verifyTripOwnership(tripId, req.user.id, Trip);
      if (!trip) {
        return res.status(403).send('Trip not found');
      }
    }

    // Fetch trip selector data
    const tripSelectorData = await getTripSelectorData(null, req.user.id);

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

exports.getEditForm = async (req, res) => {
  try {
    const { id } = req.params;

    // Find car rental with trip
    const carRental = await CarRental.findByPk(id, {
      include: [{ model: Trip, as: 'trip' }],
    });

    // Verify car rental exists
    if (!carRental) {
      return res.status(404).send('Car rental not found');
    }

    // Verify ownership
    // For standalone items, check if user owns it; for trip items, check if user owns the trip
    if (carRental.tripId) {
      // Trip-associated car rental - verify trip ownership
      if (!verifyResourceOwnershipViaTrip(carRental, req.user.id)) {
        return res.status(403).send('Car rental not found');
      }
    } else if (carRental.userId !== req.user.id) {
      // Standalone car rental - verify direct ownership
      return res.status(403).send('Car rental not found');
    }

    // Format data for display
    const pickupTimezone = carRental.pickupTimezone || 'UTC';
    const dropoffTimezone = carRental.dropoffTimezone || 'UTC';

    // Convert UTC times to local timezone for display
    let pickupDate = '';
    let pickupTime = '';
    let dropoffDate = '';
    let dropoffTime = '';

    if (carRental.pickupDateTime) {
      const pickupDateTimeLocal = utcToLocal(carRental.pickupDateTime, pickupTimezone);
      const parts = pickupDateTimeLocal.split('T');
      pickupDate = parts[0] || '';
      pickupTime = parts[1] || '';
    }

    if (carRental.dropoffDateTime) {
      const dropoffDateTimeLocal = utcToLocal(carRental.dropoffDateTime, dropoffTimezone);
      const parts = dropoffDateTimeLocal.split('T');
      dropoffDate = parts[0] || '';
      dropoffTime = parts[1] || '';
    }

    const formattedData = {
      id: carRental.id,
      company: carRental.company,
      pickupLocation: carRental.pickupLocation,
      pickupTimezone,
      pickupDate,
      pickupTime,
      dropoffLocation: carRental.dropoffLocation,
      dropoffTimezone,
      dropoffDate,
      dropoffTime,
      confirmationNumber: carRental.confirmationNumber,
    };

    // Get trip IDs from ItemTrip if available (new system)
    let associatedTripIds = [];
    try {
      const itemTrips = await ItemTrip.findAll({
        where: {
          itemId: carRental.id,
          itemType: 'car_rental',
        },
        attributes: ['tripId'],
      });
      associatedTripIds = itemTrips.map((it) => it.tripId);
    } catch (e) {
      logger.error('Error fetching ItemTrip associations:', e);
    }

    // Use ItemTrip associations if available, otherwise fall back to carRental.tripId
    const primaryTripId = associatedTripIds.length > 0 ? associatedTripIds[0] : carRental.tripId;

    // Fetch trip selector data
    const tripSelectorData = await getTripSelectorData(carRental, req.user.id);

    res.json({
      success: true,
      tripId: primaryTripId,
      isEditing: true,
      data: formattedData,
      currentTripId: tripSelectorData.currentTripId,
      currentTripName: tripSelectorData.currentTripName,
      availableTrips: tripSelectorData.availableTrips,
    });
  } catch (error) {
    logger.error('Error fetching edit form:', error);
    res.status(500).json({ success: false, error: 'Error loading form' });
  }
};
