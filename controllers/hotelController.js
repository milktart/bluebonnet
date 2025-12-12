const { Hotel, Trip } = require('../models');
const logger = require('../utils/logger');
const { utcToLocal } = require('../utils/timezoneHelper');
const itemCompanionHelper = require('../utils/itemCompanionHelper');
const {
  verifyTripOwnership,
  geocodeIfChanged,
  redirectAfterSuccess,
  redirectAfterError,
  verifyResourceOwnershipViaTrip,
  convertToUTC,
} = require('./helpers/resourceController');
const {
  getTripSelectorData,
  verifyTripEditAccess,
} = require('./helpers/tripSelectorHelper');
const { storeDeletedItem, retrieveDeletedItem } = require('./helpers/deleteManager');

exports.createHotel = async (req, res) => {
  try {
    const { tripId } = req.params;
    let {
      hotelName,
      address,
      phone,
      checkInDate,
      checkInTime,
      checkOutDate,
      checkOutTime,
      checkInDateTime: checkInDateTimeCombined,
      checkOutDateTime: checkOutDateTimeCombined,
      timezone,
      confirmationNumber,
      roomNumber,
      companions,
    } = req.body;

    // Verify trip ownership if tripId provided (for trip-associated items)
    // If no tripId, this is a standalone item (allowed without trip)
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
        const isAsync = req.headers['x-async-request'] === 'true';
        if (isAsync) {
          return res.status(400).json({ success: false, error: 'All date and time fields are required' });
        }
        return redirectAfterError(res, req, tripId, 'All date and time fields are required');
      }
      // Combine date and time fields
      checkInDateTime = `${checkInDate}T${checkInTime}`;
      checkOutDateTime = `${checkOutDate}T${checkOutTime}`;
    }

    // Geocode address
    const coords = await geocodeIfChanged(address);

    // Infer timezone from location if not provided
    let finalTimezone = timezone;
    if (!finalTimezone && coords?.lat && coords?.lng) {
      const { geocodingService } = require('../services/geocodingService');
      try {
        finalTimezone = await require('../services/geocodingService').inferTimezone(
          coords.lat,
          coords.lng
        );
      } catch (error) {
        logger.error('Error inferring timezone:', error);
        finalTimezone = 'UTC';
      }
    }
    finalTimezone = finalTimezone || 'UTC';

    const hotel = await Hotel.create({
      tripId,
      hotelName,
      address,
      phone,
      checkInDateTime: convertToUTC(checkInDateTime, finalTimezone),
      checkOutDateTime: convertToUTC(checkOutDateTime, finalTimezone),
      timezone: finalTimezone,
      lat: coords?.lat,
      lng: coords?.lng,
      confirmationNumber,
      roomNumber,
      userId: req.user.id,
    });

    // Add companions to this hotel
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

    // Check if this is an async request
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.json({ success: true, message: 'Hotel added successfully' });
    }

    redirectAfterSuccess(res, req, tripId, 'hotels', 'Hotel added successfully');
  } catch (error) {
    logger.error(error);
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.status(500).json({ success: false, error: 'Error adding hotel' });
    }
    redirectAfterError(res, req, req.params.tripId, 'Error adding hotel');
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
      timezone,
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
    } else {
      // Standalone hotel - verify direct ownership
      if (hotel.userId !== req.user.id) {
        const isAsync = req.headers['x-async-request'] === 'true';
        if (isAsync) {
          return res.status(403).json({ success: false, error: 'Hotel not found' });
        }
        return redirectAfterError(res, req, null, 'Hotel not found');
      }
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

    // Infer timezone from location if not provided
    let finalTimezone = timezone;
    logger.info('[Hotel Update] ========== TIMEZONE DEBUG ==========');
    logger.info('[Hotel Update] Received timezone from form:', timezone);
    logger.info('[Hotel Update] Hotel ID:', hotel.id);
    logger.info('[Hotel Update] Hotel existing timezone:', hotel.timezone);
    logger.info('[Hotel Update] checkInDateTime (before UTC conversion):', checkInDateTime);
    logger.info('[Hotel Update] checkOutDateTime (before UTC conversion):', checkOutDateTime);

    if (!finalTimezone && coords?.lat && coords?.lng) {
      try {
        finalTimezone = await require('../services/geocodingService').inferTimezone(
          coords.lat,
          coords.lng
        );
        logger.info('[Hotel Update] Inferred timezone from coordinates:', finalTimezone);
      } catch (error) {
        logger.error('Error inferring timezone:', error);
        finalTimezone = hotel.timezone || 'UTC';
      }
    }
    finalTimezone = finalTimezone || hotel.timezone || 'UTC';
    logger.info('[Hotel Update] Final timezone will be:', finalTimezone);

    // Also log as error to make sure it appears in output
    logger.error('[HOTEL TIMEZONE UPDATE] Received: ' + timezone + ' | Existing: ' + hotel.timezone + ' | Final: ' + finalTimezone);

    const checkInUTC = convertToUTC(checkInDateTime, finalTimezone);
    const checkOutUTC = convertToUTC(checkOutDateTime, finalTimezone);

    logger.info('[Hotel Update] Converted to UTC:');
    logger.info('[Hotel Update]   checkInDateTime:', checkInDateTime, '(', finalTimezone, ') -> UTC:', checkInUTC);
    logger.info('[Hotel Update]   checkOutDateTime:', checkOutDateTime, '(', finalTimezone, ') -> UTC:', checkOutUTC);
    logger.error('[HOTEL CONVERSION] Local ' + checkInDateTime + ' (' + finalTimezone + ') -> UTC ' + checkInUTC);

    await hotel.update({
      hotelName,
      address,
      phone,
      checkInDateTime: checkInUTC,
      checkOutDateTime: checkOutUTC,
      timezone: finalTimezone,
      lat: coords?.lat,
      lng: coords?.lng,
      confirmationNumber,
      roomNumber,
      tripId: newTripId || null,
    });

    logger.info('[Hotel Update] After update - Hotel timezone stored:', hotel.timezone);
    logger.error('[HOTEL STORED] Hotel ID: ' + hotel.id + ' | Timezone: ' + finalTimezone + ' | CheckIn UTC: ' + checkInUTC);
    logger.info('[Hotel Update] ========== END DEBUG ==========');

    // Check if this is an async request
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.json({ success: true, message: 'Hotel updated successfully' });
    }

    redirectAfterSuccess(res, req, hotel.tripId, 'hotels', 'Hotel updated successfully');
  } catch (error) {
    logger.error(error);
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.status(500).json({ success: false, error: 'Error updating hotel' });
    }
    req.flash('error_msg', 'Error updating hotel');
    res.redirect('back');
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
    } else {
      // Standalone hotel - verify direct ownership
      if (hotel.userId !== req.user.id) {
        const isAsync = req.headers['x-async-request'] === 'true';
        if (isAsync) {
          return res.status(403).json({ success: false, error: 'Hotel not found' });
        }
        return redirectAfterError(res, req, null, 'Hotel not found');
      }
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
    if (isAsync) {
      return res.status(500).json({ success: false, error: 'Error deleting hotel' });
    }
    req.flash('error_msg', 'Error deleting hotel');
    res.redirect('back');
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
    const { checkInDateTime, checkOutDateTime, destinationTimezone } = req.query;

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
      // Convert them to the destination timezone for accurate hotel booking dates
      // (hotel check-in/out should be in the destination city's local time)
      const timezone = destinationTimezone || 'UTC';
      const checkInDateTimeLocal = utcToLocal(checkInDateTime, timezone);
      const checkOutDateTimeLocal = utcToLocal(checkOutDateTime, timezone);

      // Split into date and time
      let checkInDate = '';
      let checkOutDate = '';

      if (checkInDateTimeLocal) {
        const parts = checkInDateTimeLocal.split('T');
        if (parts.length === 2) {
          checkInDate = parts[0];
        }
      }

      if (checkOutDateTimeLocal) {
        const parts = checkOutDateTimeLocal.split('T');
        if (parts.length === 2) {
          checkOutDate = parts[0];
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
    const tripSelectorData = await getTripSelectorData(
      { tripId: tripId || null },
      req.user.id
    );

    // Render form partial for sidebar (not modal)
    res.render('partials/hotel-form', {
      tripId: tripId || null,
      isEditing: false,
      data: formData,
      isModal: false, // This tells the partial to render for sidebar
      currentTripId: tripSelectorData.currentTripId,
      currentTripName: tripSelectorData.currentTripName,
      availableTrips: tripSelectorData.availableTrips,
    });
  } catch (error) {
    logger.error('Error fetching add form:', error);
    res.status(500).send('Error loading form');
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
    } else {
      // Standalone hotel - verify direct ownership
      if (hotel.userId !== req.user.id) {
        return res.status(403).send('Unauthorized');
      }
    }

    // Convert UTC times to local timezone for display
    // utcToLocal returns "YYYY-MM-DDTHH:mm" format, so we split it into date and time
    // If no timezone is stored, display in UTC
    const checkInDateTimeLocal = utcToLocal(hotel.checkInDateTime, hotel.timezone || 'UTC');
    const checkOutDateTimeLocal = utcToLocal(hotel.checkOutDateTime, hotel.timezone || 'UTC');

    // Split the combined datetime into separate date and time fields for form input
    // Handle empty strings by providing defaults
    let checkInDate = '';
    let checkInTime = '14:00';
    let checkOutDate = '';
    let checkOutTime = '11:00';

    if (checkInDateTimeLocal) {
      const parts = checkInDateTimeLocal.split('T');
      if (parts.length === 2) {
        checkInDate = parts[0];
        checkInTime = parts[1];
      }
    }

    if (checkOutDateTimeLocal) {
      const parts = checkOutDateTimeLocal.split('T');
      if (parts.length === 2) {
        checkOutDate = parts[0];
        checkOutTime = parts[1];
      }
    }

    // Get available trips for trip selector
    const tripSelectorData = await getTripSelectorData(hotel, req.user.id);

    // Render form partial for sidebar (not modal)
    res.render('partials/hotel-form', {
      tripId: hotel.tripId || '', // Use tripId if available, empty string otherwise
      isEditing: true,
      data: {
        ...hotel.toJSON(),
        checkInDate,
        checkInTime,
        checkOutDate,
        checkOutTime,
      },
      isModal: false, // This tells the partial to render for sidebar
      currentTripId: tripSelectorData.currentTripId,
      currentTripName: tripSelectorData.currentTripName,
      availableTrips: tripSelectorData.availableTrips,
    });
  } catch (error) {
    logger.error('Error fetching edit form:', error);
    res.status(500).send('Error loading form');
  }
};
