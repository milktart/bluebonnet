const { localToUTC } = require('../utils/timezoneHelper');
const { Hotel, Trip } = require('../models');
const geocodingService = require('../services/geocodingService');

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

    const trip = await Trip.findOne({
      where: { id: tripId, userId: req.user.id }
    });

    if (!trip) {
      req.flash('error_msg', 'Trip not found');
      return res.redirect('/trips');
    }

    // Geocode address
    const coords = await geocodingService.geocodeLocation(address);

    await Hotel.create({
      tripId,
      hotelName,
      address,
      phone,
      checkInDateTime: localToUTC(checkInDateTime, timezone),
      checkOutDateTime: localToUTC(checkOutDateTime, timezone),
      timezone,
      lat: coords?.lat,
      lng: coords?.lng,
      confirmationNumber,
      roomNumber
    });

    req.flash('success_msg', 'Hotel added successfully');
    res.redirect(`/trips/${tripId}?tab=hotels`);
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error adding hotel');
    res.redirect(`/trips/${req.params.tripId}`);
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

    const hotel = await Hotel.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip' }]
    });

    if (!hotel || hotel.trip.userId !== req.user.id) {
      req.flash('error_msg', 'Hotel not found');
      return res.redirect('/trips');
    }

    // Geocode address if it changed
    const coords = address !== hotel.address
      ? await geocodingService.geocodeLocation(address)
      : { lat: hotel.lat, lng: hotel.lng };

    await hotel.update({
      hotelName,
      address,
      phone,
      checkInDateTime: localToUTC(checkInDateTime, timezone),
      checkOutDateTime: localToUTC(checkOutDateTime, timezone),
      timezone,
      lat: coords?.lat,
      lng: coords?.lng,
      confirmationNumber,
      roomNumber
    });

    req.flash('success_msg', 'Hotel updated successfully');
    res.redirect(`/trips/${hotel.tripId}?tab=hotels`);
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error updating hotel');
    res.redirect('back');
  }
};

exports.deleteHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip' }]
    });

    if (!hotel || hotel.trip.userId !== req.user.id) {
      req.flash('error_msg', 'Hotel not found');
      return res.redirect('/trips');
    }

    const tripId = hotel.tripId;
    await hotel.destroy();

    req.flash('success_msg', 'Hotel deleted successfully');
    res.redirect(`/trips/${tripId}?tab=hotels`);
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error deleting hotel');
    res.redirect('back');
  }
};