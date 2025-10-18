const { Hotel, Trip } = require('../models');
const {
  verifyTripOwnership,
  geocodeIfChanged,
  redirectAfterSuccess,
  redirectAfterError,
  verifyResourceOwnershipViaTrip,
  convertToUTC
} = require('./helpers/resourceController');

exports.createHotel = async (req, res) => {
  try {
    const { tripId } = req.params;
    const {
      hotelName,
      address,
      phone,
      checkInDateTime,
      checkOutDateTime,
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

    // Geocode address
    const coords = await geocodeIfChanged(address);

    await Hotel.create({
      tripId,
      hotelName,
      address,
      phone,
      checkInDateTime: convertToUTC(checkInDateTime, timezone),
      checkOutDateTime: convertToUTC(checkOutDateTime, timezone),
      timezone,
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
      checkInDateTime,
      checkOutDateTime,
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

    // Geocode address if changed
    const coords = await geocodeIfChanged(
      address,
      hotel.address,
      { lat: hotel.lat, lng: hotel.lng }
    );

    await hotel.update({
      hotelName,
      address,
      phone,
      checkInDateTime: convertToUTC(checkInDateTime, timezone),
      checkOutDateTime: convertToUTC(checkOutDateTime, timezone),
      timezone,
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
    await hotel.destroy();

    // Check if this is an async request
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.json({ success: true, message: 'Hotel deleted successfully' });
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