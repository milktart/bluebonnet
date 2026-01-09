const { Hotel, Trip } = require('../models');
const logger = require('../utils/logger');
const { parseCompanions } = require('../utils/parseHelper');
const { sendAsyncResponse } = require('../utils/asyncResponseHelper');
const itemCompanionHelper = require('../utils/itemCompanionHelper');
const {
  verifyTripOwnership,
  geocodeIfChanged,
  redirectAfterSuccess,
  redirectAfterError,
  verifyResourceOwnershipViaTrip,
} = require('./helpers/resourceController');
const { getTripSelectorData, verifyTripEditAccess } = require('./helpers/tripSelectorHelper');
const { storeDeletedItem, retrieveDeletedItem } = require('./helpers/deleteManager');

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
    // If no tripId, this is a standalone item (allowed without trip)
    if (tripId) {
      const trip = await verifyTripOwnership(tripId, req.user.id, Trip);
      if (!trip) {
        return sendAsyncResponse(res, false, null, 'Trip not found', null, req);
      }
    }

    // Handle both combined datetime (from async form) and split date/time fields (from traditional forms)
    let checkInDateTime;
    let checkOutDateTime;

    if (checkInDateTimeCombined && checkOutDateTimeCombined) {
      // Async form submission sends combined datetime
      checkInDateTime = checkInDateTimeCombined;
      checkOutDateTime = checkOutDateTimeCombined;
    } else {
      // Traditional form submission sends split date/time fields
      // Validate required date/time fields
      if (!checkInDate || !checkInTime || !checkOutDate || !checkOutTime) {
        logger.error('[Hotel Create] Missing required date/time fields:', {
          checkInDate,
          checkInTime,
          checkOutDate,
          checkOutTime,
        });
        return sendAsyncResponse(
          res,
          false,
          null,
          'All date and time fields are required',
          tripId,
          req
        );
      }
      // Combine date and time fields
      checkInDateTime = `${checkInDate}T${checkInTime}`;
      checkOutDateTime = `${checkOutDate}T${checkOutTime}`;
    }

    // Geocode address
    const coords = await geocodeIfChanged(address);

    const hotel = await Hotel.create({
      tripId,
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

    // Add companions to this hotel
    try {
      if (tripId) {
        // Parse and validate companions
        const companionIds = parseCompanions(companions);

        // If companions were provided and not empty, use them; otherwise use fallback
        if (companionIds.length > 0) {
          await itemCompanionHelper.updateItemCompanions(
            'hotel',
            hotel.id,
            companionIds,
            tripId,
            req.user.id
          );
        } else {
          // Fallback: auto-add trip-level companions
          await itemCompanionHelper.autoAddTripCompanions('hotel', hotel.id, tripId, req.user.id);
        }
      }
    } catch (e) {
      logger.error('Error managing companions for hotel:', e);
      // Don't fail the hotel creation due to companion errors
    }

    // Send response (handles both async and traditional form submission)
    return sendAsyncResponse(res, true, hotel, 'Hotel added successfully', tripId, req, 'hotels');
  } catch (error) {
    logger.error(error);
    return sendAsyncResponse(res, false, null, 'Error adding hotel', req.params.tripId, req);
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

    // Verify ownership
    // For standalone items, check if user owns it; for trip items, check if user owns the trip
    if (!hotel) {
      const isAsync = req.headers['x-async-request'] === 'true';
      if (isAsync) {
        return res.status(403).json({ success: false, error: 'Hotel not found' });
      }
      return redirectAfterError(res, req, null, 'Hotel not found');
    }
    if (hotel.tripId) {
      // Trip-associated hotel - verify trip ownership
      if (!verifyResourceOwnershipViaTrip(hotel, req.user.id)) {
        const isAsync = req.headers['x-async-request'] === 'true';
        if (isAsync) {
          return res.status(403).json({ success: false, error: 'Hotel not found' });
        }
        return redirectAfterError(res, req, null, 'Hotel not found');
      }
    } else if (hotel.userId !== req.user.id) {
      // Standalone hotel - verify direct ownership
      const isAsync = req.headers['x-async-request'] === 'true';
      if (isAsync) {
        return res.status(403).json({ success: false, error: 'Hotel not found' });
      }
      return redirectAfterError(res, req, null, 'Hotel not found');
    }

    // Verify trip edit access if changing trips
    if (newTripId && newTripId !== hotel.tripId) {
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
    let checkInDateTime;
    let checkOutDateTime;

    if (checkInDateTimeCombined && checkOutDateTimeCombined) {
      // Async form submission sends combined datetime
      checkInDateTime = checkInDateTimeCombined;
      checkOutDateTime = checkOutDateTimeCombined;
    } else {
      // Traditional form submission sends split date/time fields
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
      tripId: newTripId || null,
    });

    // Check if this is an async request
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.json({ success: true, data: hotel, message: 'Hotel updated successfully' });
    }

    redirectAfterSuccess(res, req, hotel.tripId, 'hotels', 'Hotel updated successfully');
  } catch (error) {
    logger.error(error);
    const isAsync = req.headers['x-async-request'] === 'true';
    return res.status(500).json({ success: false, error: 'Error updating hotel' });
  }
};

exports.deleteHotel = async (req, res) => {
  try {
    // Find hotel with trip
    const hotel = await Hotel.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip' }],
    });

    // Verify ownership
    // For standalone items, check if user owns it; for trip items, check if user owns the trip
    if (!hotel) {
      const isAsync = req.headers['x-async-request'] === 'true';
      if (isAsync) {
        return res.status(403).json({ success: false, error: 'Hotel not found' });
      }
      return redirectAfterError(res, req, null, 'Hotel not found');
    }
    if (hotel.tripId) {
      // Trip-associated hotel - verify trip ownership
      if (!verifyResourceOwnershipViaTrip(hotel, req.user.id)) {
        const isAsync = req.headers['x-async-request'] === 'true';
        if (isAsync) {
          return res.status(403).json({ success: false, error: 'Hotel not found' });
        }
        return redirectAfterError(res, req, null, 'Hotel not found');
      }
    } else if (hotel.userId !== req.user.id) {
      // Standalone hotel - verify direct ownership
      const isAsync = req.headers['x-async-request'] === 'true';
      if (isAsync) {
        return res.status(403).json({ success: false, error: 'Hotel not found' });
      }
      return redirectAfterError(res, req, null, 'Hotel not found');
    }

    const { tripId } = hotel;
    const hotelData = hotel.get({ plain: true });

    // Store the deleted hotel in session for potential restoration
    storeDeletedItem(req.session, 'hotel', hotel.id, hotelData, hotel.hotelName);

    await hotel.destroy();

    // Check if this is an async request
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.json({ success: true, message: 'Hotel deleted successfully', itemId: hotel.id });
    }

    redirectAfterSuccess(res, req, tripId, 'hotels', 'Hotel deleted successfully');
  } catch (error) {
    logger.error(error);
    const isAsync = req.headers['x-async-request'] === 'true';
    return res.status(500).json({ success: false, error: 'Error deleting hotel' });
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

    // Format dates/times for display from stored datetime values (use UTC methods to avoid timezone conversion)
    const formatDateForInput = (date) => {
      if (!date) return '';
      const d = new Date(date);
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const formatTimeForInput = (date) => {
      if (!date) return '';
      const d = new Date(date);
      const hours = String(d.getUTCHours()).padStart(2, '0');
      const minutes = String(d.getUTCMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    };

    // Split the combined datetime into separate date and time fields for form input
    // Handle empty strings by providing defaults
    const checkInDate = formatDateForInput(hotel.checkInDateTime);
    const checkInTime = formatTimeForInput(hotel.checkInDateTime) || '14:00';
    const checkOutDate = formatDateForInput(hotel.checkOutDateTime);
    const checkOutTime = formatTimeForInput(hotel.checkOutDateTime) || '11:00';

    // Get available trips for trip selector
    const tripSelectorData = await getTripSelectorData(hotel, req.user.id);

    // Return form data as JSON
    res.json({
      success: true,
      tripId: hotel.tripId || '',
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
