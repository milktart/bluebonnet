const { Trip, Flight, Hotel, Transportation, CarRental, Event, TravelCompanion, TripCompanion, User } = require('../models');
const airportService = require('../services/airportService');

exports.listTrips = async (req, res) => {
  try {
    // Get trips the user owns
    const ownedTrips = await Trip.findAll({
      where: { userId: req.user.id },
      order: [['departureDate', 'ASC']],
      include: [
        { model: Flight, as: 'flights' },
        { model: Hotel, as: 'hotels' },
        { model: Transportation, as: 'transportation' },
        { model: CarRental, as: 'carRentals' },
        { model: Event, as: 'events' },
        {
          model: TripCompanion,
          as: 'tripCompanions',
          include: [
            {
              model: TravelCompanion,
              as: 'companion',
              include: [
                {
                  model: User,
                  as: 'linkedAccount',
                  attributes: ['id', 'firstName', 'lastName']
                }
              ]
            }
          ]
        }
      ]
    });

    // Get trips where the user is a companion
    const companionTrips = await Trip.findAll({
      include: [
        { model: Flight, as: 'flights' },
        { model: Hotel, as: 'hotels' },
        { model: Transportation, as: 'transportation' },
        { model: CarRental, as: 'carRentals' },
        { model: Event, as: 'events' },
        {
          model: TripCompanion,
          as: 'tripCompanions',
          required: true,
          include: [
            {
              model: TravelCompanion,
              as: 'companion',
              where: { userId: req.user.id },
              include: [
                {
                  model: User,
                  as: 'linkedAccount',
                  attributes: ['id', 'firstName', 'lastName']
                }
              ]
            }
          ]
        }
      ],
      order: [['departureDate', 'ASC']]
    });

    // Combine and deduplicate trips
    const allTrips = [...ownedTrips, ...companionTrips];
    const uniqueTrips = allTrips.filter((trip, index, self) =>
      index === self.findIndex(t => t.id === trip.id)
    );

    // Get standalone items (not attached to any trip)
    const standaloneFlights = await Flight.findAll({
      where: { userId: req.user.id, tripId: null },
      order: [['departureDateTime', 'ASC']]
    });

    const standaloneTransportation = await Transportation.findAll({
      where: { userId: req.user.id, tripId: null },
      order: [['departureDateTime', 'ASC']]
    });

    const standaloneEvents = await Event.findAll({
      where: { userId: req.user.id, tripId: null },
      order: [['startDateTime', 'ASC']]
    });

    res.render('trips/list', {
      title: 'My Trips',
      trips: uniqueTrips,
      standaloneFlights,
      standaloneTransportation,
      standaloneEvents
    });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error loading trips');
    res.redirect('/');
  }
};

exports.getCreateTrip = (req, res) => {
  res.render('trips/create', { title: 'Create Trip' });
};

exports.createTrip = async (req, res) => {
  try {
    const { name, departureDate, returnDate, companions, purpose, defaultCompanionEditPermission } = req.body;

    // Create the trip
    const trip = await Trip.create({
      userId: req.user.id,
      name,
      departureDate,
      returnDate,
      purpose,
      defaultCompanionEditPermission: !!defaultCompanionEditPermission
    });

    // Add companions if provided
    if (companions) {
      let companionIds = [];
      try {
        // Parse companions from JSON string sent by frontend
        companionIds = typeof companions === 'string' ? JSON.parse(companions) : companions;
      } catch (e) {
        // Fallback if not JSON, treat as array
        companionIds = Array.isArray(companions) ? companions : [];
      }

      if (companionIds.length > 0) {
        const companionPromises = companionIds.map(companionId =>
          TripCompanion.create({
            tripId: trip.id,
            companionId: companionId,
            canEdit: !!defaultCompanionEditPermission,
            addedBy: req.user.id
          })
        );
        await Promise.all(companionPromises);
      }
    }

    req.flash('success_msg', 'Trip created successfully');
    res.redirect('/trips');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error creating trip');
    res.redirect('/trips/create');
  }
};

exports.viewTrip = async (req, res) => {
  try {
    const trip = await Trip.findOne({
      where: { id: req.params.id },
      include: [
        { model: Flight, as: 'flights', order: [['departureDateTime', 'ASC']] },
        { model: Hotel, as: 'hotels', order: [['checkInDateTime', 'ASC']] },
        { model: Transportation, as: 'transportation', order: [['departureDateTime', 'ASC']] },
        { model: CarRental, as: 'carRentals', order: [['pickupDateTime', 'ASC']] },
        { model: Event, as: 'events', order: [['startDateTime', 'ASC']] },
        {
          model: TripCompanion,
          as: 'tripCompanions',
          include: [
            {
              model: TravelCompanion,
              as: 'companion',
              include: [
                {
                  model: User,
                  as: 'linkedAccount',
                  attributes: ['id', 'firstName', 'lastName', 'email']
                }
              ]
            }
          ]
        }
      ]
    });

    if (!trip) {
      req.flash('error_msg', 'Trip not found');
      return res.redirect('/trips');
    }

    // Check if user has permission to view this trip
    const isOwner = trip.userId === req.user.id;
    const companionRecord = trip.tripCompanions?.find(tc =>
      tc.companion.userId === req.user.id
    );

    if (!isOwner && !companionRecord) {
      req.flash('error_msg', 'You do not have permission to view this trip');
      return res.redirect('/trips');
    }

    // Determine if user can edit this trip
    const canEdit = isOwner || (companionRecord && companionRecord.canEdit);

    // Get airline data for form lookup
    const airlines = airportService.getAllAirlines();

    res.render('trips/view', {
      title: trip.name,
      trip,
      isOwner,
      canEdit,
      airlines
    });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error loading trip');
    res.redirect('/trips');
  }
};

exports.getEditTrip = async (req, res) => {
  try {
    const trip = await Trip.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [
        {
          model: TripCompanion,
          as: 'tripCompanions',
          include: [
            {
              model: TravelCompanion,
              as: 'companion',
              include: [
                {
                  model: User,
                  as: 'linkedAccount',
                  attributes: ['id', 'firstName', 'lastName', 'email']
                }
              ]
            }
          ]
        }
      ]
    });

    if (!trip) {
      req.flash('error_msg', 'Trip not found');
      return res.redirect('/trips');
    }

    res.render('trips/edit', { title: 'Edit Trip', trip });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error loading trip');
    res.redirect('/trips');
  }
};

exports.getEditTripSidebar = async (req, res) => {
  try {
    const trip = await Trip.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [
        {
          model: TripCompanion,
          as: 'tripCompanions',
          include: [
            {
              model: TravelCompanion,
              as: 'companion',
              include: [
                {
                  model: User,
                  as: 'linkedAccount',
                  attributes: ['id', 'firstName', 'lastName', 'email']
                }
              ]
            }
          ]
        }
      ]
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.render('trips/edit', {
      title: 'Edit Trip',
      trip,
      layout: false  // Don't use main layout, just render the content
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error loading trip' });
  }
};

exports.updateTrip = async (req, res) => {
  try {
    const { name, departureDate, returnDate, companions, purpose, defaultCompanionEditPermission } = req.body;

    const trip = await Trip.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!trip) {
      req.flash('error_msg', 'Trip not found');
      return res.redirect('/trips');
    }

    // Update trip details
    await trip.update({
      name,
      departureDate,
      returnDate,
      purpose,
      defaultCompanionEditPermission: !!defaultCompanionEditPermission
    });

    // Handle companion updates
    // First, remove all existing companions for this trip
    await TripCompanion.destroy({
      where: { tripId: trip.id }
    });

    // Add new companions if provided
    if (companions) {
      let companionIds = [];
      try {
        // Parse companions from JSON string sent by frontend
        companionIds = typeof companions === 'string' ? JSON.parse(companions) : companions;
      } catch (e) {
        // Fallback if not JSON, treat as array
        companionIds = Array.isArray(companions) ? companions : [];
      }

      if (companionIds.length > 0) {
        const companionPromises = companionIds.map(companionId =>
          TripCompanion.create({
            tripId: trip.id,
            companionId: companionId,
            canEdit: !!defaultCompanionEditPermission,
            addedBy: req.user.id
          })
        );
        await Promise.all(companionPromises);
      }
    }

    req.flash('success_msg', 'Trip updated successfully');
    res.redirect(`/trips/${trip.id}`);
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error updating trip');
    res.redirect(`/trips/${req.params.id}/edit`);
  }
};

exports.deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!trip) {
      req.flash('error_msg', 'Trip not found');
      return res.redirect('/trips');
    }

    await trip.destroy();
    req.flash('success_msg', 'Trip deleted successfully');
    res.redirect('/trips');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error deleting trip');
    res.redirect('/trips');
  }
};

exports.getCalendarView = async (req, res) => {
  try {
    const trip = await Trip.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [
        { model: Flight, as: 'flights' },
        { model: Hotel, as: 'hotels' },
        { model: Transportation, as: 'transportation' },
        { model: CarRental, as: 'carRentals' },
        { model: Event, as: 'events' }
      ]
    });

    if (!trip) {
      req.flash('error_msg', 'Trip not found');
      return res.redirect('/trips');
    }

    res.render('trips/calendar', { title: `${trip.name} - Calendar`, trip });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error loading calendar');
    res.redirect('/trips');
  }
};

exports.getMapView = async (req, res) => {
  try {
    const trip = await Trip.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [
        { model: Flight, as: 'flights' },
        { model: Hotel, as: 'hotels' },
        { model: Transportation, as: 'transportation' },
        { model: CarRental, as: 'carRentals' },
        { model: Event, as: 'events' }
      ]
    });

    if (!trip) {
      req.flash('error_msg', 'Trip not found');
      return res.redirect('/trips');
    }

    res.render('trips/map', { title: `${trip.name} - Map`, trip });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error loading map');
    res.redirect('/trips');
  }
};

exports.removeSelfFromTrip = async (req, res) => {
  try {
    const tripId = req.params.id;
    const userId = req.user.id;

    // Find the companion record for this user
    const companionRecord = await TripCompanion.findOne({
      include: [
        {
          model: TravelCompanion,
          as: 'companion',
          where: { userId: userId }
        }
      ],
      where: { tripId: tripId }
    });

    if (!companionRecord) {
      return res.status(404).json({ error: 'You are not a companion on this trip' });
    }

    // Remove the companion from the trip
    await companionRecord.destroy();

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to remove from trip' });
  }
};