const { Hotel, Trip } = require('../models');
const { utcToLocal } = require('../utils/timezoneHelper');
const {
  verifyTripOwnership,
  geocodeIfChanged,
  redirectAfterSuccess,
  redirectAfterError,
  verifyResourceOwnershipViaTrip,
  convertToUTC
} = require('./helpers/resourceController');
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
      timezone,
      confirmationNumber,
      roomNumber
    } = req.body;

    // Verify trip ownership
    const trip = await verifyTripOwnership(tripId, req.user.id, Trip);
    if (!trip) {
      const isAsync = req.headers['x-async-request'] === 'true';
      if (isAsync) {
        return res.status(403).json({ success: false, error: 'Trip not found' });
      }
      return redirectAfterError(res, req, null, 'Trip not found');
    }

    // Combine date and time fields
    const checkInDateTime = `${checkInDate}T${checkInTime}`;
    const checkOutDateTime = `${checkOutDate}T${checkOutTime}`;

    // Geocode address
    const coords = await geocodeIfChanged(address);

    // Infer timezone from location if not provided
    let finalTimezone = timezone;
    if (!finalTimezone && coords?.lat && coords?.lng) {
      const { geocodingService } = require('../services/geocodingService');
      try {
        finalTimezone = await require('../services/geocodingService').inferTimezone(coords.lat, coords.lng);
      } catch (error) {
        console.error('Error inferring timezone:', error);
        finalTimezone = 'UTC';
      }
    }
    finalTimezone = finalTimezone || 'UTC';

    await Hotel.create({
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
      roomNumber
    });

    // Check if this is an async request
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.json({ success: true, message: 'Hotel added successfully' });
    }

    redirectAfterSuccess(res, req, tripId, 'hotels', 'Hotel added successfully');
  } catch (error) {
    console.error(error);
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
      timezone,
      confirmationNumber,
      roomNumber
    } = req.body;

    // Find hotel with trip
    const hotel = await Hotel.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip' }]
    });

    // Verify ownership
    if (!verifyResourceOwnershipViaTrip(hotel, req.user.id)) {
      const isAsync = req.headers['x-async-request'] === 'true';
      if (isAsync) {
        return res.status(403).json({ success: false, error: 'Hotel not found' });
      }
      return redirectAfterError(res, req, null, 'Hotel not found');
    }

    // Combine date and time fields
    const checkInDateTime = `${checkInDate}T${checkInTime}`;
    const checkOutDateTime = `${checkOutDate}T${checkOutTime}`;

    // Geocode address if changed
    const coords = await geocodeIfChanged(
      address,
      hotel.address,
      { lat: hotel.lat, lng: hotel.lng }
    );

    // Infer timezone from location if not provided
    let finalTimezone = timezone;
    if (!finalTimezone && coords?.lat && coords?.lng) {
      try {
        finalTimezone = await require('../services/geocodingService').inferTimezone(coords.lat, coords.lng);
      } catch (error) {
        console.error('Error inferring timezone:', error);
        finalTimezone = hotel.timezone || 'UTC';
      }
    }
    finalTimezone = finalTimezone || hotel.timezone || 'UTC';

    await hotel.update({
      hotelName,
      address,
      phone,
      checkInDateTime: convertToUTC(checkInDateTime, finalTimezone),
      checkOutDateTime: convertToUTC(checkOutDateTime, finalTimezone),
      timezone: finalTimezone,
      lat: coords?.lat,
      lng: coords?.lng,
      confirmationNumber,
      roomNumber
    });

    // Check if this is an async request
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.json({ success: true, message: 'Hotel updated successfully' });
    }

    redirectAfterSuccess(res, req, hotel.tripId, 'hotels', 'Hotel updated successfully');
  } catch (error) {
    console.error(error);
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
      include: [{ model: Trip, as: 'trip' }]
    });

    // Verify ownership
    if (!verifyResourceOwnershipViaTrip(hotel, req.user.id)) {
      const isAsync = req.headers['x-async-request'] === 'true';
      if (isAsync) {
        return res.status(403).json({ success: false, error: 'Hotel not found' });
      }
      return redirectAfterError(res, req, null, 'Hotel not found');
    }

    const tripId = hotel.tripId;
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
    console.error(error);
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
    console.error('Error restoring hotel:', error);
    res.status(500).json({ success: false, error: 'Error restoring hotel' });
  }
};

// Get add hotel form (for sidebar)
exports.getAddForm = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { checkInDateTime, checkOutDateTime, destinationTimezone } = req.query;

    // Verify trip ownership
    const trip = await Trip.findByPk(tripId);
    if (!trip || trip.userId !== req.user.id) {
      return res.status(403).send('Unauthorized');
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
      const [checkInDate, checkInTime] = checkInDateTimeLocal.split('T');
      const [checkOutDate, checkOutTime] = checkOutDateTimeLocal.split('T');

      formData = {
        checkInDate,
        checkInTime: '14:00',  // Default check-in time at 2 PM
        checkOutDate,
        checkOutTime: '11:00'  // Default check-out time at 11 AM
      };
    }

    // Render form partial for sidebar (not modal)
    res.render('partials/hotel-form', {
      tripId: tripId,
      isEditing: false,
      data: formData,
      isModal: false  // This tells the partial to render for sidebar
    });
  } catch (error) {
    console.error('Error fetching add form:', error);
    res.status(500).send('Error loading form');
  }
};

// Get edit hotel form (for sidebar)
exports.getEditForm = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the hotel
    const hotel = await Hotel.findByPk(id, {
      include: [{ model: Trip, as: 'trip', required: false }]
    });

    // Verify ownership
    if (!hotel || !verifyResourceOwnershipViaTrip(hotel, req.user.id)) {
      return res.status(403).send('Unauthorized');
    }

    // Convert UTC times to local timezone for display
    // utcToLocal returns "YYYY-MM-DDTHH:mm" format, so we split it into date and time
    // If no timezone is stored, display in UTC
    const checkInDateTimeLocal = utcToLocal(hotel.checkInDateTime, hotel.timezone || 'UTC');
    const checkOutDateTimeLocal = utcToLocal(hotel.checkOutDateTime, hotel.timezone || 'UTC');

    // Split the combined datetime into separate date and time fields for form input
    const [checkInDate, checkInTime] = checkInDateTimeLocal.split('T');
    const [checkOutDate, checkOutTime] = checkOutDateTimeLocal.split('T');

    // Render form partial for sidebar (not modal)
    res.render('partials/hotel-form', {
      tripId: hotel.tripId || '', // Use tripId if available, empty string otherwise
      isEditing: true,
      data: {
        ...hotel.toJSON(),
        checkInDate,
        checkInTime,
        checkOutDate,
        checkOutTime
      },
      isModal: false  // This tells the partial to render for sidebar
    });
  } catch (error) {
    console.error('Error fetching edit form:', error);
    res.status(500).send('Error loading form');
  }
};