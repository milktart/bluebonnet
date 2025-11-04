const { Trip, Flight, Hotel, Transportation, CarRental, Event, TravelCompanion, TripCompanion, User, CompanionRelationship, TripInvitation, Notification } = require('../models');
const airportService = require('../services/airportService');
const { formatInTimezone } = require('../utils/timezoneHelper');
const { Op } = require('sequelize');

exports.listTrips = async (req, res, options = {}) => {
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

    // Get pending trip invitations for the current user
    const pendingInvitations = await TripInvitation.findAll({
      where: {
        companionEmail: req.user.email,
        status: 'pending'
      },
      include: [
        {
          model: Trip,
          as: 'trip',
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
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const renderData = {
      title: 'My Trips',
      trips: uniqueTrips,
      standaloneFlights,
      standaloneTransportation,
      standaloneEvents,
      pendingInvitations,
      openCertificatesSidebar: options.openCertificatesSidebar || false,
      openCertificateDetails: options.openCertificateDetails || null
    };

    res.render('trips/dashboard', renderData);
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error loading trips');
    res.redirect('/');
  }
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
        companionIds = typeof companions === 'string' ? JSON.parse(companions) : companions;
      } catch (e) {
        companionIds = Array.isArray(companions) ? companions : [];
      }

      if (companionIds.length > 0) {
        for (const companionId of companionIds) {
          const companion = await TravelCompanion.findByPk(companionId);
          if (!companion) continue;

          // Check if companion has a linked account
          let permissionSource = 'explicit';
          let canAddItems = false;
          let canEdit = !!defaultCompanionEditPermission;

          if (companion.userId) {
            // Has linked account - check for manage_travel permission
            const relationship = await CompanionRelationship.findOne({
              where: {
                userId: req.user.id,
                companionUserId: companion.userId,
                status: 'accepted',
              },
            });

            if (relationship && relationship.permissionLevel === 'manage_travel') {
              permissionSource = 'manage_travel';
              canEdit = true;
              canAddItems = true;
            }
          }

          await TripCompanion.create({
            tripId: trip.id,
            companionId: companionId,
            canEdit,
            canAddItems,
            permissionSource,
            addedBy: req.user.id,
          });

          // If manage_travel, automatically add items and create trip companion record
          // If view_travel, send trip invitation instead
          if (companion.userId && permissionSource === 'manage_travel') {
            // Auto-add to all trip items (will be created later)
          } else if (companion.userId) {
            // Send trip invitation for view_travel
            await TripInvitation.create({
              tripId: trip.id,
              invitedUserId: companion.userId,
              invitedByUserId: req.user.id,
              status: 'pending',
            });

            // Create notification
            const user = await User.findByPk(companion.userId);
            if (user) {
              await Notification.create({
                userId: companion.userId,
                type: 'trip_invitation_received',
                relatedId: trip.id,
                relatedType: 'trip_invitation',
                message: `${req.user.firstName} ${req.user.lastName} invited you to join the trip "${trip.name}"`,
                read: false,
                actionRequired: true,
              });
            }
          }
        }
      }
    }

    req.flash('success_msg', 'Trip created successfully');
    res.redirect('/');
  } catch (error) {
    console.error('Error creating trip:', error);
    req.flash('error_msg', 'Error creating trip');
    res.redirect('/');
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
      return res.redirect('/');
    }

    // Check if user has permission to view this trip
    const isOwner = trip.userId === req.user.id;
    const companionRecord = trip.tripCompanions?.find(tc =>
      tc.companion.userId === req.user.id
    );

    if (!isOwner && !companionRecord) {
      req.flash('error_msg', 'You do not have permission to view this trip');
      return res.redirect('/');
    }

    // Determine if user can edit this trip
    const canEdit = isOwner || (companionRecord && companionRecord.canEdit);

    // Get airline data for form lookup
    const airlines = airportService.getAllAirlines();

    res.render('trips/trip', {
      title: trip.name,
      trip,
      isOwner,
      canEdit,
      airlines,
      formatInTimezone
    });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error loading trip');
    res.redirect('/');
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
      return res.redirect('/');
    }

    res.render('trips/edit', { title: 'Edit Trip', trip });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error loading trip');
    res.redirect('/');
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
    const { name, departureDate, returnDate, companions, companionPermissions, purpose, defaultCompanionEditPermission } = req.body;

    const trip = await Trip.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!trip) {
      req.flash('error_msg', 'Trip not found');
      return res.redirect('/');
    }

    // Update trip details
    await trip.update({
      name,
      departureDate,
      returnDate,
      purpose,
      defaultCompanionEditPermission: !!defaultCompanionEditPermission
    });

    // Get existing companions
    const existingCompanions = await TripCompanion.findAll({
      where: { tripId: trip.id }
    });

    // Parse companions and permissions
    let companionIds = [];
    let permissionsMap = {};
    try {
      companionIds = typeof companions === 'string' ? JSON.parse(companions) : companions;
      if (companionPermissions) {
        permissionsMap = typeof companionPermissions === 'string' ? JSON.parse(companionPermissions) : companionPermissions;
      }
    } catch (e) {
      companionIds = Array.isArray(companions) ? companions : [];
    }

    // Identify companions to remove
    const existingIds = existingCompanions.map(c => c.companionId);
    const toRemove = existingIds.filter(id => !companionIds.includes(id));
    const toAdd = companionIds.filter(id => !existingIds.includes(id));

    // Remove companions that were deleted
    if (toRemove.length > 0) {
      for (const companionId of toRemove) {
        await TripCompanion.destroy({
          where: { tripId: trip.id, companionId }
        });
      }
    }

    // Update permissions for existing companions
    for (const existingTripCompanion of existingCompanions) {
      if (companionIds.includes(existingTripCompanion.companionId)) {
        const companion = await TravelCompanion.findByPk(existingTripCompanion.companionId);
        if (!companion) continue;

        let canEdit = !!defaultCompanionEditPermission;
        let canAddItems = false;
        let permissionSource = existingTripCompanion.permissionSource;

        // Check if explicit permission override exists
        if (permissionsMap[existingTripCompanion.companionId] !== undefined) {
          canEdit = permissionsMap[existingTripCompanion.companionId];
        }

        // Check manage_travel relationship
        if (companion.userId && existingTripCompanion.permissionSource === 'manage_travel') {
          const relationship = await CompanionRelationship.findOne({
            where: {
              userId: req.user.id,
              companionUserId: companion.userId,
              status: 'accepted',
            },
          });

          if (relationship && relationship.permissionLevel === 'manage_travel') {
            canEdit = true;
            canAddItems = true;
          } else {
            // Relationship changed to view_travel
            canEdit = !!defaultCompanionEditPermission;
            canAddItems = false;
            permissionSource = 'explicit';
          }
        }

        await existingTripCompanion.update({
          canEdit,
          canAddItems,
          permissionSource,
        });
      }
    }

    // Add new companions
    if (toAdd.length > 0) {
      for (const companionId of toAdd) {
        const companion = await TravelCompanion.findByPk(companionId);
        if (!companion) continue;

        let permissionSource = 'explicit';
        let canAddItems = false;
        let canEdit = !!defaultCompanionEditPermission;

        if (companion.userId) {
          const relationship = await CompanionRelationship.findOne({
            where: {
              userId: req.user.id,
              companionUserId: companion.userId,
              status: 'accepted',
            },
          });

          if (relationship && relationship.permissionLevel === 'manage_travel') {
            permissionSource = 'manage_travel';
            canEdit = true;
            canAddItems = true;
          }
        }

        await TripCompanion.create({
          tripId: trip.id,
          companionId: companionId,
          canEdit,
          canAddItems,
          permissionSource,
          addedBy: req.user.id,
        });

        // Send invitation for view_travel companions
        if (companion.userId && permissionSource !== 'manage_travel') {
          const existingInvitation = await TripInvitation.findOne({
            where: {
              tripId: trip.id,
              invitedUserId: companion.userId,
            },
          });

          if (!existingInvitation) {
            await TripInvitation.create({
              tripId: trip.id,
              invitedUserId: companion.userId,
              invitedByUserId: req.user.id,
              status: 'pending',
            });

            const user = await User.findByPk(companion.userId);
            if (user) {
              await Notification.create({
                userId: companion.userId,
                type: 'trip_invitation_received',
                relatedId: trip.id,
                relatedType: 'trip_invitation',
                message: `${req.user.firstName} ${req.user.lastName} invited you to join the trip "${trip.name}"`,
                read: false,
                actionRequired: true,
              });
            }
          }
        }
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
      return res.redirect('/');
    }

    await trip.destroy();
    req.flash('success_msg', 'Trip deleted successfully');
    res.redirect('/');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error deleting trip');
    res.redirect('/');
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
      return res.redirect('/');
    }

    res.render('trips/map', { title: `${trip.name} - Map`, trip });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error loading map');
    res.redirect('/');
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

exports.getTripDataJson = async (req, res) => {
  try {
    const trip = await Trip.findOne({
      where: { id: req.params.id },
      include: [
        { model: Flight, as: 'flights', order: [['departureDateTime', 'ASC']] },
        { model: Hotel, as: 'hotels', order: [['checkInDateTime', 'ASC']] },
        { model: Transportation, as: 'transportation', order: [['departureDateTime', 'ASC']] },
        { model: CarRental, as: 'carRentals', order: [['pickupDateTime', 'ASC']] },
        { model: Event, as: 'events', order: [['startDateTime', 'ASC']] }
      ]
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Check if user has permission to view this trip
    const isOwner = trip.userId === req.user.id;

    if (!isOwner) {
      // Check if user is a companion
      const tripWithCompanions = await Trip.findOne({
        where: { id: req.params.id },
        include: [{
          model: TripCompanion,
          as: 'tripCompanions',
          include: [{
            model: TravelCompanion,
            as: 'companion',
            where: { userId: req.user.id }
          }]
        }]
      });

      if (!tripWithCompanions?.tripCompanions?.length) {
        return res.status(403).json({ error: 'Not authorized' });
      }
    }

    res.json({
      id: trip.id,
      name: trip.name,
      departureDate: trip.departureDate,
      returnDate: trip.returnDate,
      flights: trip.flights,
      hotels: trip.hotels,
      transportation: trip.transportation,
      carRentals: trip.carRentals,
      events: trip.events
    });
  } catch (error) {
    console.error('Error fetching trip data:', error);
    res.status(500).json({ error: 'Failed to fetch trip data' });
  }
};

exports.getTripSidebarHtml = async (req, res) => {
  try {
    const trip = await Trip.findOne({
      where: { id: req.params.id },
      include: [
        { model: Flight, as: 'flights', order: [['departureDateTime', 'ASC']] },
        { model: Hotel, as: 'hotels', order: [['checkInDateTime', 'ASC']] },
        { model: Transportation, as: 'transportation', order: [['departureDateTime', 'ASC']] },
        { model: CarRental, as: 'carRentals', order: [['pickupDateTime', 'ASC']] },
        { model: Event, as: 'events', order: [['startDateTime', 'ASC']] }
      ]
    });

    if (!trip) {
      return res.status(404).send('<p class="text-red-600">Trip not found</p>');
    }

    // Check if user has permission to view this trip
    const isOwner = trip.userId === req.user.id;

    if (!isOwner) {
      // Check if user is a companion
      const tripWithCompanions = await Trip.findOne({
        where: { id: req.params.id },
        include: [{
          model: TripCompanion,
          as: 'tripCompanions',
          include: [{
            model: TravelCompanion,
            as: 'companion',
            where: { userId: req.user.id }
          }]
        }]
      });

      if (!tripWithCompanions?.tripCompanions?.length) {
        return res.status(403).send('<p class="text-red-600">Not authorized</p>');
      }
    }

    // Render just the sidebar content partial
    res.render('partials/trip-sidebar-content', {
      trip,
      formatInTimezone
    });
  } catch (error) {
    console.error('Error fetching sidebar HTML:', error);
    res.status(500).send('<p class="text-red-600">Error loading sidebar</p>');
  }
};