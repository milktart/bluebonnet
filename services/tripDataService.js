const { Trip, Flight, Hotel, Transportation, CarRental, Event } = require('../models');

/**
 * Filter items by end date into upcoming/past categories
 */
async function filterItemsByEndDate(items, endDateField) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = [];
  const past = [];

  items.forEach((item) => {
    const endDate = new Date(item[endDateField] || item.createdAt);
    endDate.setHours(0, 0, 0, 0);

    if (endDate >= today) {
      upcoming.push(item);
    } else {
      past.push(item);
    }
  });

  return { upcoming, past };
}

/**
 * Load all trip data for dashboard view
 * Consolidates filtering logic that was duplicated 5 times
 */
async function loadTripDashboardData(tripId, userId) {
  const trip = await Trip.findByPk(tripId, {
    include: [
      { model: Flight, as: 'flights' },
      { model: Hotel, as: 'hotels' },
      { model: Transportation, as: 'transportation' },
      { model: CarRental, as: 'carRentals' },
      { model: Event, as: 'events' },
    ],
  });

  if (!trip || trip.userId !== userId) {
    throw new Error('Trip not found or unauthorized');
  }

  const tripItems = {
    trips: [trip],
    upcomingFlights: [],
    pastFlights: [],
    upcomingHotels: [],
    pastHotels: [],
    upcomingTransportation: [],
    pastTransportation: [],
    upcomingCarRentals: [],
    pastCarRentals: [],
    upcomingEvents: [],
    pastEvents: [],
  };

  // Filter each item type
  if (trip.flights?.length) {
    const { upcoming, past } = await filterItemsByEndDate(trip.flights, 'arrivalDateTime');
    tripItems.upcomingFlights = upcoming;
    tripItems.pastFlights = past;
  }

  if (trip.hotels?.length) {
    const { upcoming, past } = await filterItemsByEndDate(trip.hotels, 'checkoutDate');
    tripItems.upcomingHotels = upcoming;
    tripItems.pastHotels = past;
  }

  if (trip.transportation?.length) {
    const { upcoming, past } = await filterItemsByEndDate(trip.transportation, 'departureDateTime');
    tripItems.upcomingTransportation = upcoming;
    tripItems.pastTransportation = past;
  }

  if (trip.carRentals?.length) {
    const { upcoming, past } = await filterItemsByEndDate(trip.carRentals, 'returnDateTime');
    tripItems.upcomingCarRentals = upcoming;
    tripItems.pastCarRentals = past;
  }

  if (trip.events?.length) {
    const { upcoming, past } = await filterItemsByEndDate(trip.events, 'eventDate');
    tripItems.upcomingEvents = upcoming;
    tripItems.pastEvents = past;
  }

  return tripItems;
}

module.exports = {
  filterItemsByEndDate,
  loadTripDashboardData,
};
