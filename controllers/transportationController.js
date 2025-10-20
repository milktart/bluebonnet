const { Transportation, Trip } = require('../models');
const { utcToLocal } = require('../utils/timezoneHelper');
const {
  verifyTripOwnership,
  geocodeOriginDestination,
  redirectAfterSuccess,
  redirectAfterError,
  verifyResourceOwnership,
  convertToUTC
} = require('./helpers/resourceController');

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
      seat
    } = req.body;

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

    // Geocode origin and destination
    const { originCoords, destCoords } = await geocodeOriginDestination({
      originNew: origin,
      destNew: destination
    });

    await Transportation.create({
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
      seat
    });

    // Check if this is an async request
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.json({ success: true, message: 'Transportation added successfully' });
    }

    redirectAfterSuccess(res, req, tripId, 'transportation', 'Transportation added successfully');
  } catch (error) {
    console.error(error);
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.status(500).json({ success: false, error: 'Error adding transportation' });
    }
    redirectAfterError(res, req, req.params.tripId, 'Error adding transportation');
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
      departureDateTime,
      arrivalDateTime,
      confirmationNumber,
      seat
    } = req.body;

    // Find transportation with trip
    const transportation = await Transportation.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip', required: false }]
    });

    // Verify ownership
    if (!verifyResourceOwnership(transportation, req.user.id)) {
      const isAsync = req.headers['x-async-request'] === 'true';
      if (isAsync) {
        return res.status(403).json({ success: false, error: 'Transportation not found' });
      }
      return redirectAfterError(res, req, null, 'Transportation not found');
    }

    // Geocode origin and destination if they changed
    const { originCoords, destCoords } = await geocodeOriginDestination({
      originNew: origin,
      originOld: transportation.origin,
      originCoordsOld: { lat: transportation.originLat, lng: transportation.originLng },
      destNew: destination,
      destOld: transportation.destination,
      destCoordsOld: { lat: transportation.destinationLat, lng: transportation.destinationLng }
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
      seat
    });

    // Check if this is an async request
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.json({ success: true, message: 'Transportation updated successfully' });
    }

    redirectAfterSuccess(res, req, transportation.tripId, 'transportation', 'Transportation updated successfully');
  } catch (error) {
    console.error(error);
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.status(500).json({ success: false, error: 'Error updating transportation' });
    }
    req.flash('error_msg', 'Error updating transportation');
    res.redirect('back');
  }
};

exports.deleteTransportation = async (req, res) => {
  try {
    // Find transportation with trip
    const transportation = await Transportation.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip', required: false }]
    });

    // Verify ownership
    if (!verifyResourceOwnership(transportation, req.user.id)) {
      const isAsync = req.headers['x-async-request'] === 'true';
      if (isAsync) {
        return res.status(403).json({ success: false, error: 'Transportation not found' });
      }
      return redirectAfterError(res, req, null, 'Transportation not found');
    }

    const tripId = transportation.tripId;
    await transportation.destroy();

    // Check if this is an async request
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.json({ success: true, message: 'Transportation deleted successfully' });
    }

    redirectAfterSuccess(res, req, tripId, 'transportation', 'Transportation deleted successfully');
  } catch (error) {
    console.error(error);
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.status(500).json({ success: false, error: 'Error deleting transportation' });
    }
    req.flash('error_msg', 'Error deleting transportation');
    res.redirect('back');
  }
};

// Get add transportation form (for sidebar)
exports.getAddForm = async (req, res) => {
  try {
    const { tripId } = req.params;

    // Verify trip ownership
    const trip = await Trip.findByPk(tripId);
    if (!trip || trip.userId !== req.user.id) {
      return res.status(403).send('Unauthorized');
    }

    // Render form partial for sidebar (not modal)
    res.render('partials/transportation-form', {
      tripId: tripId,
      isEditing: false,
      data: null,
      isModal: false  // This tells the partial to render for sidebar
    });
  } catch (error) {
    console.error('Error fetching add form:', error);
    res.status(500).send('Error loading form');
  }
};

// Get edit transportation form (for sidebar)
exports.getEditForm = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the transportation
    const transportation = await Transportation.findByPk(id, {
      include: [{ model: Trip, as: 'trip', required: false }]
    });

    // Verify ownership
    if (!transportation || !verifyResourceOwnership(transportation, req.user.id)) {
      return res.status(403).send('Unauthorized');
    }

    // Convert UTC times to local timezone for display
    // utcToLocal returns "YYYY-MM-DDTHH:mm" format, so we split it into date and time
    const departureDateTimeLocal = utcToLocal(transportation.departureDateTime, transportation.originTimezone || 'UTC');
    const arrivalDateTimeLocal = utcToLocal(transportation.arrivalDateTime, transportation.destinationTimezone || 'UTC');

    // Split the combined datetime into separate date and time fields for form input
    const [departureDate, departureTime] = departureDateTimeLocal.split('T');
    const [arrivalDate, arrivalTime] = arrivalDateTimeLocal.split('T');

    // Render form partial for sidebar (not modal)
    res.render('partials/transportation-form', {
      tripId: transportation.tripId || '', // Use tripId if available, empty string otherwise
      isEditing: true,
      data: {
        ...transportation.toJSON(),
        departureDate,
        departureTime,
        arrivalDate,
        arrivalTime
      },
      isModal: false  // This tells the partial to render for sidebar
    });
  } catch (error) {
    console.error('Error fetching edit form:', error);
    res.status(500).send('Error loading form');
  }
};