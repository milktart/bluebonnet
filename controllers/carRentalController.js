const { localToUTC } = require('../utils/timezoneHelper');
const { CarRental, Trip } = require('../models');
const geocodingService = require('../services/geocodingService');

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

    const trip = await Trip.findOne({
      where: { id: tripId, userId: req.user.id }
    });

    if (!trip) {
      req.flash('error_msg', 'Trip not found');
      return res.redirect('/trips');
    }

    // Geocode pickup and dropoff locations
    const pickupCoords = await geocodingService.geocodeLocation(pickupLocation);
    const dropoffCoords = await geocodingService.geocodeLocation(dropoffLocation);

    // Convert datetime-local inputs to UTC using proper timezone
    const pickupUTC = localToUTC(pickupDateTime, pickupTimezone);
    const dropoffUTC = localToUTC(dropoffDateTime, dropoffTimezone);

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
      pickupDateTime: pickupUTC,
      dropoffDateTime: dropoffUTC,
      confirmationNumber
    });

    req.flash('success_msg', 'Car rental added successfully');
    res.redirect(`/trips/${tripId}?tab=carRentals`);
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error adding car rental');
    res.redirect(`/trips/${req.params.tripId}`);
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

    const carRental = await CarRental.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip' }]
    });

    if (!carRental || carRental.trip.userId !== req.user.id) {
      req.flash('error_msg', 'Car rental not found');
      return res.redirect('/trips');
    }

    // Geocode locations if they changed
    const pickupCoords = pickupLocation !== carRental.pickupLocation
      ? await geocodingService.geocodeLocation(pickupLocation)
      : { lat: carRental.pickupLat, lng: carRental.pickupLng };
    const dropoffCoords = dropoffLocation !== carRental.dropoffLocation
      ? await geocodingService.geocodeLocation(dropoffLocation)
      : { lat: carRental.dropoffLat, lng: carRental.dropoffLng };

    // Convert datetime-local inputs to UTC using proper timezone
    const pickupUTC = localToUTC(pickupDateTime, pickupTimezone);
    const dropoffUTC = localToUTC(dropoffDateTime, dropoffTimezone);

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
      pickupDateTime: pickupUTC,
      dropoffDateTime: dropoffUTC,
      confirmationNumber
    });

    req.flash('success_msg', 'Car rental updated successfully');
    res.redirect(`/trips/${carRental.tripId}?tab=carRentals`);
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error updating car rental');
    res.redirect('back');
  }
};

exports.deleteCarRental = async (req, res) => {
  try {
    const carRental = await CarRental.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip' }]
    });

    if (!carRental || carRental.trip.userId !== req.user.id) {
      req.flash('error_msg', 'Car rental not found');
      return res.redirect('/trips');
    }

    const tripId = carRental.tripId;
    await carRental.destroy();

    req.flash('success_msg', 'Car rental deleted successfully');
    res.redirect(`/trips/${tripId}?tab=carRentals`);
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error deleting car rental');
    res.redirect('back');
  }
};