const { Hotel, Trip, ItemTrip } = require('../models');
const logger = require('../utils/logger');
const itemTripService = require('../services/itemTripService');
const { sendAsyncOrRedirect } = require('../utils/asyncResponseHandler');
const {
  verifyTripOwnership,
  geocodeIfChanged,
  verifyResourceOwnership,
  verifyResourceOwnershipViaTrip,
  verifyTripItemEditAccess,
} = require('./helpers/resourceController');
const { getTripSelectorData, verifyTripEditAccess } = require('./helpers/tripSelectorHelper');
const { storeDeletedItem, retrieveDeletedItem } = require('./helpers/deleteManager');
const { finalizItemCreation } = require('./helpers/itemFactory');
const { formatDateForInput, formatTimeForInput } = require('../utils/dateFormatter');
const { ITEM_TYPE_HOTEL } = require('../constants/companionConstants');

exports.createHotel = async (req, res) => {
  try {
    const { tripId } = req.params;
    const {
      hotelName,
      address,
      phone,
      checkInDate,
      checkInTime,
      checkOutDate,
      checkOutTime,
      checkInDateTime: checkInDateTimeCombined,
      checkOutDateTime: checkOutDateTimeCombined,
      confirmationNumber,
      roomNumber,
      companions,
    } = req.body;

    // Verify trip ownership if tripId provided (for trip-associated items)
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

    // Handle both combined datetime (from async form) and split date/time fields (from traditional forms)
    let checkInDateTime;
    let checkOutDateTime;

    if (checkInDateTimeCombined && checkOutDateTimeCombined) {
      checkInDateTime = checkInDateTimeCombined;
      checkOutDateTime = checkOutDateTimeCombined;
    } else {
      // Validate required date/time fields
      if (!checkInDate || !checkInTime || !checkOutDate || !checkOutTime) {
        return sendAsyncOrRedirect(req, res, {
          error: 'All date and time fields are required',
          status: 400,
          redirectUrl: tripId ? `/trips/${tripId}` : '/dashboard',
        });
      }
      checkInDateTime = `${checkInDate}T${checkInTime}`;
      checkOutDateTime = `${checkOutDate}T${checkOutTime}`;
    }

    // Geocode address
    const coords = await geocodeIfChanged(address);

    const hotel = await Hotel.create({
      hotelName,
      address,
      phone,
      checkInDateTime: new Date(checkInDateTime),
      checkOutDateTime: new Date(checkOutDateTime),
      lat: coords?.lat,
      lng: coords?.lng,
      confirmationNumber,
      roomNumber,
      userId: req.user.id,
    });

    // Add to trip and handle companions
    await finalizItemCreation({
      itemType: ITEM_TYPE_HOTEL,
      item: hotel,
      tripId,
      userId: req.user.id,
      companions,
    });

    // Centralized async/redirect response handling
    return sendAsyncOrRedirect(req, res, {
      success: true,
      data: hotel,
      message: 'Hotel added successfully',
      redirectUrl: tripId ? `/trips/${tripId}` : '/dashboard',
    });
  } catch (error) {
    logger.error('ERROR in createHotel:', error);
    return sendAsyncOrRedirect(req, res, {
      success: false,
      error: error.message || 'Error adding hotel',
      status: 500,
      redirectUrl: req.params.tripId ? `/trips/${req.params.tripId}` : '/dashboard',
    });
  }
};

exports.updateHotel = async (req, res) => {
  try {
    const {
      hotelName,
      address,
      phone,
      checkInDate,
      checkInTime,
      checkOutDate,
      checkOutTime,
      checkInDateTime: checkInDateTimeCombined,
      checkOutDateTime: checkOutDateTimeCombined,
      confirmationNumber,
      roomNumber,
      tripId: newTripId,
    } = req.body;

    // Find hotel with trip
    const hotel = await Hotel.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip' }],
    });

    // Verify ownership - check if user is item owner OR trip owner OR trip admin with canEdit permission
    const isItemOwner = verifyResourceOwnership(hotel, req.user.id);
    const { TripCompanion } = require('../models');
    const canEditTrip = hotel.tripId
      ? await verifyTripItemEditAccess(hotel.tripId, req.user.id, Trip, TripCompanion)
      : false;

    if (!isItemOwner && !canEditTrip) {
      return sendAsyncOrRedirect(req, res, {
        error: 'Hotel not found',
        status: 403,
        redirectUrl: '/',
      });
    }

    // Verify trip edit access if changing trips
    if (newTripId && newTripId !== hotel.tripId) {
      const hasAccess = await verifyTripEditAccess(newTripId, req.user.id);
      if (!hasAccess) {
        return sendAsyncOrRedirect(req, res, {
          error: 'Cannot attach to this trip',
          status: 403,
          redirectUrl: '/',
        });
      }
    }

    // Handle both combined datetime (from async form) and split date/time fields
    let checkInDateTime;
    let checkOutDateTime;

    if (checkInDateTimeCombined && checkOutDateTimeCombined) {
      checkInDateTime = checkInDateTimeCombined;
      checkOutDateTime = checkOutDateTimeCombined;
    } else {
      checkInDateTime = `${checkInDate}T${checkInTime}`;
      checkOutDateTime = `${checkOutDate}T${checkOutTime}`;
    }

    // Geocode address if changed
    const coords = await geocodeIfChanged(address, hotel.address, {
      lat: hotel.lat,
      lng: hotel.lng,
    });

    await hotel.update({
      hotelName,
      address,
      phone,
      checkInDateTime: new Date(checkInDateTime),
      checkOutDateTime: new Date(checkOutDateTime),
      lat: coords?.lat,
      lng: coords?.lng,
      confirmationNumber,
      roomNumber,
    });

    // Update trip association via ItemTrip if it changed
    try {
      if (newTripId && newTripId !== hotel.tripId) {
        if (hotel.tripId) {
          await itemTripService.removeItemFromTrip('hotel', hotel.id, hotel.tripId);
        }
        await itemTripService.addItemToTrip('hotel', hotel.id, newTripId, req.user.id);
      } else if (newTripId === null && hotel.tripId) {
        await itemTripService.removeItemFromTrip('hotel', hotel.id, hotel.tripId);
      }
    } catch (e) {
      logger.error('Error updating hotel trip association:', e);
    }

    // Centralized async/redirect response handling
    return sendAsyncOrRedirect(req, res, {
      success: true,
      data: hotel,
      message: 'Hotel updated successfully',
      redirectUrl: newTripId || hotel.tripId ? `/trips/${newTripId || hotel.tripId}` : '/dashboard',
    });
  } catch (error) {
    logger.error('ERROR in updateHotel:', error);
    return sendAsyncOrRedirect(req, res, {
      success: false,
      error: error.message || 'Error updating hotel',
      status: 500,
      redirectUrl: '/dashboard',
    });
  }
};

exports.deleteHotel = async (req, res) => {
  try {
    // Find hotel with trip
    const hotel = await Hotel.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip' }],
    });

    // Verify ownership - check if user is item owner OR trip owner OR trip admin with canEdit permission
    const isItemOwner = verifyResourceOwnership(hotel, req.user.id);
    const { TripCompanion } = require('../models');
    const canEditTrip = hotel.tripId
      ? await verifyTripItemEditAccess(hotel.tripId, req.user.id, Trip, TripCompanion)
      : false;

    if (!isItemOwner && !canEditTrip) {
      return sendAsyncOrRedirect(req, res, {
        error: 'Hotel not found',
        status: 403,
        redirectUrl: '/',
      });
    }

    const { tripId } = hotel;
    const hotelData = hotel.get({ plain: true });

    // Store the deleted hotel in session for potential restoration
    storeDeletedItem(req.session, 'hotel', hotel.id, hotelData, hotel.hotelName);

    // Remove from all trips via ItemTrip
    try {
      await itemTripService.removeItemFromAllTrips('hotel', hotel.id);
    } catch (e) {
      logger.error('Error removing hotel from ItemTrip records:', e);
    }

    await hotel.destroy();

    // Centralized async/redirect response handling
    return sendAsyncOrRedirect(req, res, {
      success: true,
      message: 'Hotel deleted successfully',
      data: { itemId: hotel.id },
      redirectUrl: tripId ? `/trips/${tripId}` : '/dashboard',
    });
  } catch (error) {
    logger.error('ERROR in deleteHotel:', error);
    return sendAsyncOrRedirect(req, res, {
      success: false,
      error: 'Error deleting hotel',
      status: 500,
      redirectUrl: '/dashboard',
    });
  }
};

exports.restoreHotel = async (req, res) => {
  try {
    const { id } = req.params;

    // Retrieve the deleted hotel from session
    const deletedItem = retrieveDeletedItem(req.session, 'hotel', id);

    if (!deletedItem) {
      return res.status(404).json({ success: false, error: 'Hotel not found in undo history' });
    }

    // Verify user owns the trip (hotels are trip-based)
    const trip = await Trip.findByPk(deletedItem.itemData.tripId);
    if (!trip || trip.userId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    // Recreate the hotel
    await Hotel.create(deletedItem.itemData);

    res.json({ success: true, message: 'Hotel restored successfully' });
  } catch (error) {
    logger.error('Error restoring hotel:', error);
    res.status(500).json({ success: false, error: 'Error restoring hotel' });
  }
};

// Get add hotel form (for sidebar)
exports.getAddForm = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { checkInDateTime, checkOutDateTime } = req.query;

    // Verify trip ownership if tripId provided (for trip-associated items)
    // If no tripId, this is a standalone form (allowed without trip)
    if (tripId) {
      const trip = await Trip.findByPk(tripId);
      if (!trip || trip.userId !== req.user.id) {
        return res.status(403).send('Unauthorized');
      }
    }

    let formData = null;

    // If layover dates are provided, pre-populate the form
    if (checkInDateTime && checkOutDateTime) {
      // These arrive as ISO strings (e.g., "2025-10-15T10:30:00.000Z")
      // Extract date portion directly
      let checkInDate = '';
      let checkOutDate = '';

      if (checkInDateTime) {
        const [inDate] = checkInDateTime.split('T');
        if (inDate) {
          checkInDate = inDate;
        }
      }

      if (checkOutDateTime) {
        const [outDate] = checkOutDateTime.split('T');
        if (outDate) {
          checkOutDate = outDate;
        }
      }

      formData = {
        checkInDate,
        checkInTime: '14:00', // Default check-in time at 2 PM
        checkOutDate,
        checkOutTime: '11:00', // Default check-out time at 11 AM
      };
    }

    // Get available trips for trip selector
    const tripSelectorData = await getTripSelectorData({ tripId: tripId || null }, req.user.id);

    // Return form data as JSON
    res.json({
      success: true,
      tripId: tripId || null,
      isEditing: false,
      data: formData,
      currentTripId: tripSelectorData.currentTripId,
      currentTripName: tripSelectorData.currentTripName,
      availableTrips: tripSelectorData.availableTrips,
    });
  } catch (error) {
    logger.error('Error fetching add form:', error);
    res.status(500).json({ success: false, error: 'Error loading form' });
  }
};

// Get edit hotel form (for sidebar)
exports.getEditForm = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the hotel
    const hotel = await Hotel.findByPk(id, {
      include: [{ model: Trip, as: 'trip', required: false }],
    });

    // Verify ownership
    // For standalone items, check if user owns it; for trip items, check if user owns the trip
    if (!hotel) {
      return res.status(403).send('Unauthorized');
    }
    if (hotel.tripId) {
      // Trip-associated hotel - verify trip ownership
      if (!verifyResourceOwnershipViaTrip(hotel, req.user.id)) {
        return res.status(403).send('Unauthorized');
      }
    } else if (hotel.userId !== req.user.id) {
      // Standalone hotel - verify direct ownership
      return res.status(403).send('Unauthorized');
    }

    // Split the combined datetime into separate date and time fields for form input
    // Using shared formatters from dateFormatter utility
    // Handle empty strings by providing defaults
    const checkInDate = formatDateForInput(hotel.checkInDateTime);
    const checkInTime = formatTimeForInput(hotel.checkInDateTime) || '14:00';
    const checkOutDate = formatDateForInput(hotel.checkOutDateTime);
    const checkOutTime = formatTimeForInput(hotel.checkOutDateTime) || '11:00';

    // Get trip IDs from ItemTrip if available (new system)
    let associatedTripIds = [];
    try {
      const itemTrips = await ItemTrip.findAll({
        where: {
          itemId: hotel.id,
          itemType: ITEM_TYPE_HOTEL,
        },
        attributes: ['tripId'],
      });
      associatedTripIds = itemTrips.map((it) => it.tripId);
    } catch (e) {
      logger.error('Error fetching ItemTrip associations:', e);
    }

    // Use ItemTrip associations if available, otherwise fall back to hotel.tripId
    const primaryTripId = associatedTripIds.length > 0 ? associatedTripIds[0] : hotel.tripId;

    // Get available trips for trip selector
    const tripSelectorData = await getTripSelectorData(hotel, req.user.id);

    // Return form data as JSON
    res.json({
      success: true,
      tripId: primaryTripId || '',
      isEditing: true,
      data: {
        ...hotel.toJSON(),
        checkInDate,
        checkInTime,
        checkOutDate,
        checkOutTime,
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
