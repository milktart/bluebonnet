const { CarRental, Trip } = require('../models');
const logger = require('../utils/logger');
const { parseCompanions } = require('../utils/parseHelper');
const { sendAsyncResponse } = require('../utils/asyncResponseHelper');
const itemCompanionHelper = require('../utils/itemCompanionHelper');
const {
  verifyTripOwnership,
  geocodeOriginDestination,
  redirectAfterSuccess,
  redirectAfterError,
  verifyResourceOwnershipViaTrip,
  convertToUTC,
} = require('./helpers/resourceController');
const { utcToLocal } = require('../utils/timezoneHelper');
const { storeDeletedItem, retrieveDeletedItem } = require('./helpers/deleteManager');
const { getTripSelectorData, verifyTripEditAccess } = require('./helpers/tripSelectorHelper');

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

    // Verify trip ownership if tripId provided (for trip-associated items)
    // If no tripId, this is a standalone item (allowed without trip)
    if (tripId) {
      const trip = await verifyTripOwnership(tripId, req.user.id, Trip);
      if (!trip) {
        return sendAsyncResponse(res, false, null, 'Trip not found', null, req);
      }
    }

    // Geocode pickup and dropoff locations
    const { originCoords: pickupCoords, destCoords: dropoffCoords } =
      await geocodeOriginDestination({
        originNew: pickupLocation,
        destNew: dropoffLocation,
      });

    const carRental = await CarRental.create({
      tripId,
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

    // Add companions to this car rental
    try {
      if (tripId) {
        const companionIds = parseCompanions(companions);

        // If companions were provided and not empty, use them; otherwise use fallback
        if (companionIds.length > 0) {
          await itemCompanionHelper.updateItemCompanions(
            'car_rental',
            carRental.id,
            companionIds,
            tripId,
            req.user.id
          );
        } else {
          // Fallback: auto-add trip-level companions
          await itemCompanionHelper.autoAddTripCompanions(
            'car_rental',
            carRental.id,
            tripId,
            req.user.id
          );
        }
      }
    } catch (e) {
      logger.error('Error managing companions for car rental:', e);
      // Don't fail the car rental creation due to companion errors
    }

    // Send response (handles both async and traditional form submission)
    return sendAsyncResponse(
      res,
      true,
      carRental,
      'Car rental added successfully',
      tripId,
      req,
      'carRentals'
    );
  } catch (error) {
    logger.error(error);
    return sendAsyncResponse(res, false, null, 'Error adding car rental', req.params.tripId, req);
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

    // Verify ownership
    // For standalone items, check if user owns it; for trip items, check if user owns the trip
    if (!carRental) {
      const isAsync = req.headers['x-async-request'] === 'true';
      if (isAsync) {
        return res.status(403).json({ success: false, error: 'Car rental not found' });
      }
      return redirectAfterError(res, req, null, 'Car rental not found');
    }
    if (carRental.tripId) {
      // Trip-associated car rental - verify trip ownership
      if (!verifyResourceOwnershipViaTrip(carRental, req.user.id)) {
        const isAsync = req.headers['x-async-request'] === 'true';
        if (isAsync) {
          return res.status(403).json({ success: false, error: 'Car rental not found' });
        }
        return redirectAfterError(res, req, null, 'Car rental not found');
      }
    } else if (carRental.userId !== req.user.id) {
      // Standalone car rental - verify direct ownership
      const isAsync = req.headers['x-async-request'] === 'true';
      if (isAsync) {
        return res.status(403).json({ success: false, error: 'Car rental not found' });
      }
      return redirectAfterError(res, req, null, 'Car rental not found');
    }

    // Verify trip edit access if changing trip association
    if (newTripId && newTripId !== carRental.tripId) {
      const hasAccess = await verifyTripEditAccess(newTripId, req.user.id);
      if (!hasAccess) {
        const isAsync = req.headers['x-async-request'] === 'true';
        return res.status(403).json({ success: false, error: 'Cannot attach to this trip' });
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
      tripId: newTripId || null,
    });

    // Check if this is an async request
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.json({ success: true, message: 'Car rental updated successfully' });
    }

    redirectAfterSuccess(
      res,
      req,
      carRental.tripId,
      'carRentals',
      'Car rental updated successfully'
    );
  } catch (error) {
    logger.error(error);
    const isAsync = req.headers['x-async-request'] === 'true';
    return res.status(500).json({ success: false, error: 'Error updating car rental' });
  }
};

exports.deleteCarRental = async (req, res) => {
  try {
    // Find car rental with trip
    const carRental = await CarRental.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip' }],
    });

    // Verify ownership
    // For standalone items, check if user owns it; for trip items, check if user owns the trip
    if (!carRental) {
      const isAsync = req.headers['x-async-request'] === 'true';
      if (isAsync) {
        return res.status(403).json({ success: false, error: 'Car rental not found' });
      }
      return redirectAfterError(res, req, null, 'Car rental not found');
    }
    if (carRental.tripId) {
      // Trip-associated car rental - verify trip ownership
      if (!verifyResourceOwnershipViaTrip(carRental, req.user.id)) {
        const isAsync = req.headers['x-async-request'] === 'true';
        if (isAsync) {
          return res.status(403).json({ success: false, error: 'Car rental not found' });
        }
        return redirectAfterError(res, req, null, 'Car rental not found');
      }
    } else if (carRental.userId !== req.user.id) {
      // Standalone car rental - verify direct ownership
      const isAsync = req.headers['x-async-request'] === 'true';
      if (isAsync) {
        return res.status(403).json({ success: false, error: 'Car rental not found' });
      }
      return redirectAfterError(res, req, null, 'Car rental not found');
    }

    const { tripId } = carRental;
    const carRentalData = carRental.get({ plain: true });

    // Store the deleted car rental in session for potential restoration
    storeDeletedItem(req.session, 'carRental', carRental.id, carRentalData, carRental.company);

    await carRental.destroy();

    // Check if this is an async request
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.json({
        success: true,
        message: 'Car rental deleted successfully',
        itemId: carRental.id,
      });
    }

    redirectAfterSuccess(res, req, tripId, 'carRentals', 'Car rental deleted successfully');
  } catch (error) {
    logger.error(error);
    const isAsync = req.headers['x-async-request'] === 'true';
    return res.status(500).json({ success: false, error: 'Error deleting car rental' });
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
    logger.error(error);
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

    // Fetch trip selector data
    const tripSelectorData = await getTripSelectorData(carRental, req.user.id);

    res.json({
      success: true,
      tripId: carRental.tripId,
      isEditing: true,
      data: formattedData,
      currentTripId: tripSelectorData.currentTripId,
      currentTripName: tripSelectorData.currentTripName,
      availableTrips: tripSelectorData.availableTrips,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, error: 'Error loading form' });
  }
};
