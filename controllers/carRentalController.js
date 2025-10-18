const { CarRental, Trip } = require('../models');
const {
  verifyTripOwnership,
  geocodeOriginDestination,
  redirectAfterSuccess,
  redirectAfterError,
  verifyResourceOwnershipViaTrip,
  convertToUTC
} = require('./helpers/resourceController');

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
      confirmationNumber
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

    // Geocode pickup and dropoff locations
    const { originCoords: pickupCoords, destCoords: dropoffCoords } = await geocodeOriginDestination({
      originNew: pickupLocation,
      destNew: dropoffLocation
    });

    await CarRental.create({
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
      confirmationNumber
    });

    // Check if this is an async request
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.json({ success: true, message: 'Car rental added successfully' });
    }

    redirectAfterSuccess(res, req, tripId, 'carRentals', 'Car rental added successfully');
  } catch (error) {
    console.error(error);
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.status(500).json({ success: false, error: 'Error adding car rental' });
    }
    redirectAfterError(res, req, req.params.tripId, 'Error adding car rental');
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
      confirmationNumber
    } = req.body;

    // Find car rental with trip
    const carRental = await CarRental.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip' }]
    });

    // Verify ownership
    if (!verifyResourceOwnershipViaTrip(carRental, req.user.id)) {
      const isAsync = req.headers['x-async-request'] === 'true';
      if (isAsync) {
        return res.status(403).json({ success: false, error: 'Car rental not found' });
      }
      return redirectAfterError(res, req, null, 'Car rental not found');
    }

    // Geocode locations if they changed
    const { originCoords: pickupCoords, destCoords: dropoffCoords } = await geocodeOriginDestination({
      originNew: pickupLocation,
      originOld: carRental.pickupLocation,
      originCoordsOld: { lat: carRental.pickupLat, lng: carRental.pickupLng },
      destNew: dropoffLocation,
      destOld: carRental.dropoffLocation,
      destCoordsOld: { lat: carRental.dropoffLat, lng: carRental.dropoffLng }
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
      confirmationNumber
    });

    // Check if this is an async request
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.json({ success: true, message: 'Car rental updated successfully' });
    }

    redirectAfterSuccess(res, req, carRental.tripId, 'carRentals', 'Car rental updated successfully');
  } catch (error) {
    console.error(error);
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.status(500).json({ success: false, error: 'Error updating car rental' });
    }
    req.flash('error_msg', 'Error updating car rental');
    res.redirect('back');
  }
};

exports.deleteCarRental = async (req, res) => {
  try {
    // Find car rental with trip
    const carRental = await CarRental.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip' }]
    });

    // Verify ownership
    if (!verifyResourceOwnershipViaTrip(carRental, req.user.id)) {
      const isAsync = req.headers['x-async-request'] === 'true';
      if (isAsync) {
        return res.status(403).json({ success: false, error: 'Car rental not found' });
      }
      return redirectAfterError(res, req, null, 'Car rental not found');
    }

    const tripId = carRental.tripId;
    await carRental.destroy();

    // Check if this is an async request
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.json({ success: true, message: 'Car rental deleted successfully' });
    }

    redirectAfterSuccess(res, req, tripId, 'carRentals', 'Car rental deleted successfully');
  } catch (error) {
    console.error(error);
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.status(500).json({ success: false, error: 'Error deleting car rental' });
    }
    req.flash('error_msg', 'Error deleting car rental');
    res.redirect('back');
  }
};