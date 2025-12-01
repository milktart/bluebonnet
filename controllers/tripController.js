const { Op } = require('sequelize');
const {
  Trip,
  Flight,
  Hotel,
  Transportation,
  CarRental,
  Event,
  TravelCompanion,
  TripCompanion,
  User,
  CompanionRelationship,
  TripInvitation,
  Notification,
  ItemCompanion,
} = require('../models');
const logger = require('../utils/logger');
const airportService = require('../services/airportService');
const { formatInTimezone } = require('../utils/timezoneHelper');
const itemCompanionHelper = require('../utils/itemCompanionHelper');
const versionInfo = require('../utils/version');

exports.listTrips = async (req, res, options = {}) => {
  try {
    // Determine active tab from query parameter or options
    const activeTab = req.query.tab || options.activeTab || 'upcoming';
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    // Pagination parameters (only for past trips)
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 20; // 20 trips per page for past trips
    const offset = (page - 1) * limit;

    // Build date filter based on active tab
    let dateFilter = {};
    let orderDirection = 'ASC';

    if (activeTab === 'upcoming') {
      // Upcoming: trips that haven't ended yet (includes in-progress trips)
      // Upcoming: returnDate >= today (includes in-progress trips)
      dateFilter = { returnDate: { [Op.gte]: today } };
      orderDirection = 'ASC'; // Soonest first
    } else if (activeTab === 'past') {
      // Past: trips that have completely ended
      dateFilter = { returnDate: { [Op.lt]: today } };
      orderDirection = 'DESC'; // Most recent first
    }
    // 'all' tab has no date filter

    // Common include structure for trips
    const tripIncludes = [
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
                attributes: ['id', 'firstName', 'lastName'],
              },
            ],
          },
        ],
      },
    ];

    // Get trips the user owns (with pagination for past trips)
    const ownedTripsQuery = {
      where: { userId: req.user.id, ...dateFilter },
      order: [['departureDate', orderDirection]],
      include: tripIncludes,
    };

    // Add pagination only for past trips tab
    if (activeTab === 'past') {
      ownedTripsQuery.limit = limit;
      ownedTripsQuery.offset = offset;
    }

    const ownedTrips = await Trip.findAll(ownedTripsQuery);

    // Get count for pagination (past trips only)
    let totalPastTrips = 0;
    if (activeTab === 'past') {
      totalPastTrips = await Trip.count({
        where: { userId: req.user.id, ...dateFilter },
      });
    }

    // Get trips where the user is a companion (but exclude trips with pending invitations)
    // First, get trip IDs with pending invitations for this user
    const pendingTripIds = await TripInvitation.findAll({
      where: {
        invitedUserId: req.user.id,
        status: 'pending',
      },
      attributes: ['tripId'],
      raw: true,
    }).then(invitations => invitations.map(inv => inv.tripId));

    const companionTripsQuery = {
      where: {
        ...dateFilter,
        // Exclude trips with pending invitations
        ...(pendingTripIds.length > 0 && {
          id: {
            [Op.notIn]: pendingTripIds
          }
        })
      },
      include: [
        ...tripIncludes,
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
                  attributes: ['id', 'firstName', 'lastName'],
                },
              ],
            },
          ],
        },
      ],
      order: [['departureDate', orderDirection]],
    };

    // Add pagination for past companion trips
    if (activeTab === 'past') {
      companionTripsQuery.limit = limit;
      companionTripsQuery.offset = offset;
    }

    const companionTrips = await Trip.findAll(companionTripsQuery);

    // Combine and deduplicate trips
    const allTrips = [...ownedTrips, ...companionTrips];
    const uniqueTrips = allTrips.filter(
      (trip, index, self) => index === self.findIndex((t) => t.id === trip.id)
    );

    // Get standalone items (not attached to any trip) - only for upcoming tab
    let standaloneFlights = [];
    let standaloneHotels = [];
    let standaloneTransportation = [];
    let standaloneCarRentals = [];
    let standaloneEvents = [];

    if (activeTab === 'upcoming' || activeTab === 'all') {
      standaloneFlights = await Flight.findAll({
        where: { userId: req.user.id, tripId: null },
        order: [['departureDateTime', 'ASC']],
      });

      standaloneHotels = await Hotel.findAll({
        where: { userId: req.user.id, tripId: null },
        order: [['checkInDateTime', 'ASC']],
      });

      standaloneTransportation = await Transportation.findAll({
        where: { userId: req.user.id, tripId: null },
        order: [['departureDateTime', 'ASC']],
      });

      standaloneCarRentals = await CarRental.findAll({
        where: { userId: req.user.id, tripId: null },
        order: [['pickupDateTime', 'ASC']],
      });

      standaloneEvents = await Event.findAll({
        where: { userId: req.user.id, tripId: null },
        order: [['startDateTime', 'ASC']],
      });
    }

    // Get pending trip invitations (only for upcoming tab)
    let pendingInvitations = [];
    if (activeTab === 'upcoming' || activeTab === 'all') {
      pendingInvitations = await TripInvitation.findAll({
        where: {
          invitedUserId: req.user.id,
          status: 'pending',
        },
        include: [
          {
            model: Trip,
            as: 'trip',
            include: tripIncludes,
          },
          {
            model: User,
            as: 'invitedByUser',
            attributes: ['id', 'firstName', 'lastName'],
          },
        ],
        order: [['createdAt', 'DESC']],
      });
    }

    // Calculate pagination metadata for past trips
    const totalPages = activeTab === 'past' ? Math.ceil(totalPastTrips / limit) : 1;
    const pagination = {
      currentPage: page,
      totalPages,
      totalTrips: totalPastTrips,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      limit,
    };

    const renderData = {
      title: 'My Trips',
      trips: uniqueTrips,
      standaloneFlights,
      standaloneHotels,
      standaloneTransportation,
      standaloneCarRentals,
      standaloneEvents,
      pendingInvitations,
      openSettingsSidebar: options.openSettingsSidebar || false,
      openAccountSettings: options.openAccountSettings || false,
      openCertificatesSidebar: options.openCertificatesSidebar || false,
      openCertificateDetails: options.openCertificateDetails || null,
      openCompanionsSidebar: options.openCompanionsSidebar || false,
      showSettingsTab: options.showSettingsTab || false,
      activeTab,
      pagination,
      versionInfo,
    };

    res.render('trips/dashboard', renderData);
  } catch (error) {
    logger.error(error);
    req.flash('error_msg', 'Error loading trips');
    res.redirect('/');
  }
};

exports.createTrip = async (req, res) => {
  try {
    const { name, departureDate, returnDate, companions, purpose, defaultCompanionEditPermission } =
      req.body;

    // Create the trip
    const trip = await Trip.create({
      userId: req.user.id,
      name,
      departureDate,
      returnDate,
      purpose,
      defaultCompanionEditPermission: !!defaultCompanionEditPermission,
    });

    // Ensure trip owner is added as a trip companion
    // Get or create a TravelCompanion record for the trip owner
    let ownerCompanion = await TravelCompanion.findOne({
      where: { userId: req.user.id },
    });

    if (!ownerCompanion) {
      // Create a companion record for the trip owner if they don't have one
      ownerCompanion = await TravelCompanion.create({
        name: `${req.user.firstName} ${req.user.lastName}`,
        email: req.user.email,
        userId: req.user.id,
        createdBy: req.user.id,
        canBeAddedByOthers: true,
      });
    }

    // Add trip owner as a trip companion
    await TripCompanion.create({
      tripId: trip.id,
      companionId: ownerCompanion.id,
      canEdit: true,
      canAddItems: true,
      permissionSource: 'owner',
      addedBy: req.user.id,
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
            companionId,
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
            const invitation = await TripInvitation.create({
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
                relatedId: invitation.id,
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
    res.redirect(`/trips/${trip.id}`);
  } catch (error) {
    logger.error('Error creating trip:', error);
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
                  attributes: ['id', 'firstName', 'lastName', 'email'],
                },
              ],
            },
          ],
        },
      ],
    });

    // Fetch all item companions for this trip's items
    if (trip) {
      const allItemIds = [
        ...trip.flights.map((f) => f.id),
        ...trip.hotels.map((h) => h.id),
        ...trip.transportation.map((t) => t.id),
        ...trip.carRentals.map((c) => c.id),
        ...trip.events.map((e) => e.id),
      ];

      const itemCompanions = await ItemCompanion.findAll({
        where: {
          itemId: allItemIds,
        },
        include: [
          {
            model: TravelCompanion,
            as: 'companion',
            attributes: ['id', 'name', 'email'],
          },
        ],
      });

      trip.itemCompanions = itemCompanions;
    }

    if (!trip) {
      req.flash('error_msg', 'Trip not found');
      return res.redirect('/');
    }

    // Check if user has permission to view this trip
    const isOwner = trip.userId === req.user.id;
    const companionRecord = trip.tripCompanions?.find((tc) => tc.companion.userId === req.user.id);

    if (!isOwner && !companionRecord) {
      req.flash('error_msg', 'You do not have permission to view this trip');
      return res.redirect('/');
    }

    // Determine if user can edit this trip
    const canEdit = isOwner || (companionRecord && companionRecord.canEdit);

    // Get current user's travel companion profile (if they're a companion)
    let userCompanionId = null;
    const userItemCompanions = {};

    if (!isOwner && companionRecord) {
      // User is a companion on this trip - use their companion profile
      const userCompanionProfile = await TravelCompanion.findOne({
        where: { userId: req.user.id },
      });
      if (userCompanionProfile) {
        userCompanionId = userCompanionProfile.id;
      }
    } else if (isOwner) {
      // Trip owner should also check if they have a companion profile
      const ownerCompanionProfile = await TravelCompanion.findOne({
        where: { userId: req.user.id },
      });
      if (ownerCompanionProfile) {
        userCompanionId = ownerCompanionProfile.id;
      }
    }

    // Get item companions data for the current user
    if (userCompanionId) {
      const itemCompanions = await ItemCompanion.findAll({
        where: { companionId: userCompanionId },
      });

      // Create a map of itemId -> itemType for quick lookup
      itemCompanions.forEach((ic) => {
        const key = `${ic.itemType}_${ic.itemId}`;
        userItemCompanions[key] = true;
      });
    }

    // Get airline data for form lookup
    const airlines = airportService.getAllAirlines();

    // Determine trip status based on dates
    const now = new Date();
    // Parse dates and set to end of day for return date comparison
    const departureDate = new Date(trip.departureDate);
    departureDate.setHours(0, 0, 0, 0);
    const returnDate = new Date(trip.returnDate);
    returnDate.setHours(23, 59, 59, 999);

    let tripStatus = 'upcoming';

    if (now >= departureDate && now <= returnDate) {
      tripStatus = 'in_progress';
    } else if (now > returnDate) {
      tripStatus = 'completed';
    }

    res.render('trips/trip', {
      title: trip.name,
      trip,
      isOwner,
      canEdit,
      airlines,
      formatInTimezone,
      userItemCompanions, // Pass item companions data to view
      userCompanionId, // Pass user's companion ID for reference
      tripStatus,
    });
  } catch (error) {
    logger.error(error);
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
                  attributes: ['id', 'firstName', 'lastName', 'email'],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!trip) {
      req.flash('error_msg', 'Trip not found');
      return res.redirect('/');
    }

    // Filter out the trip owner from the companions list shown in edit form
    if (trip.tripCompanions) {
      trip.tripCompanions = trip.tripCompanions.filter(
        tc => tc.companion.userId !== req.user.id
      );
    }

    res.render('trips/edit', { title: 'Edit Trip', trip });
  } catch (error) {
    logger.error(error);
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
                  attributes: ['id', 'firstName', 'lastName', 'email'],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Filter out the trip owner from the companions list shown in edit form
    if (trip.tripCompanions) {
      trip.tripCompanions = trip.tripCompanions.filter(
        tc => tc.companion.userId !== req.user.id
      );
    }

    res.render('trips/edit', {
      title: 'Edit Trip',
      trip,
      layout: false, // Don't use main layout, just render the content
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Error loading trip' });
  }
};

exports.updateTrip = async (req, res) => {
  try {
    const {
      name,
      departureDate,
      returnDate,
      companions,
      companionPermissions,
      purpose,
      defaultCompanionEditPermission,
    } = req.body;

    const trip = await Trip.findOne({
      where: { id: req.params.id, userId: req.user.id },
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
      defaultCompanionEditPermission: !!defaultCompanionEditPermission,
    });

    // Get existing companions
    const existingCompanions = await TripCompanion.findAll({
      where: { tripId: trip.id },
    });

    // Parse companions and permissions
    let companionIds = [];
    let permissionsMap = {};
    try {
      companionIds = typeof companions === 'string' ? JSON.parse(companions) : companions;
      if (companionPermissions) {
        permissionsMap =
          typeof companionPermissions === 'string'
            ? JSON.parse(companionPermissions)
            : companionPermissions;
      }
    } catch (e) {
      companionIds = Array.isArray(companions) ? companions : [];
    }

    // Get the owner's companion profile ID to prevent removal
    const ownerCompanion = await TravelCompanion.findOne({
      where: { userId: req.user.id },
    });

    // Identify companions to remove
    const existingIds = existingCompanions.map((c) => c.companionId);
    const toRemove = existingIds.filter((id) => !companionIds.includes(id));
    const toAdd = companionIds.filter((id) => !existingIds.includes(id));

    // Remove companions that were deleted (but never remove the trip owner)
    if (toRemove.length > 0) {
      for (const companionId of toRemove) {
        // Skip removing the owner's companion profile
        if (ownerCompanion && companionId === ownerCompanion.id) {
          continue;
        }
        await TripCompanion.destroy({
          where: { tripId: trip.id, companionId },
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
        let { permissionSource } = existingTripCompanion;

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
          companionId,
          canEdit,
          canAddItems,
          permissionSource,
          addedBy: req.user.id,
        });

        // Auto-add this companion to all existing items in the trip
        await itemCompanionHelper.addCompanionToAllItems(companionId, trip.id, req.user.id);

        // Send invitation for view_travel companions
        if (companion.userId && permissionSource !== 'manage_travel') {
          const existingInvitation = await TripInvitation.findOne({
            where: {
              tripId: trip.id,
              invitedUserId: companion.userId,
            },
          });

          if (!existingInvitation) {
            const invitation = await TripInvitation.create({
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
                relatedId: invitation.id,
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
    logger.error(error);
    req.flash('error_msg', 'Error updating trip');
    res.redirect(`/trips/${req.params.id}/edit`);
  }
};

exports.deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!trip) {
      req.flash('error_msg', 'Trip not found');
      return res.redirect('/');
    }

    await trip.destroy();
    req.flash('success_msg', 'Trip deleted successfully');
    res.redirect('/');
  } catch (error) {
    logger.error(error);
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
        { model: Event, as: 'events' },
      ],
    });

    if (!trip) {
      req.flash('error_msg', 'Trip not found');
      return res.redirect('/');
    }

    res.render('trips/map', { title: `${trip.name} - Map`, trip });
  } catch (error) {
    logger.error(error);
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
          where: { userId },
        },
      ],
      where: { tripId },
    });

    if (!companionRecord) {
      return res.status(404).json({ error: 'You are not a companion on this trip' });
    }

    // Remove the companion from the trip
    await companionRecord.destroy();

    res.json({ success: true });
  } catch (error) {
    logger.error(error);
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
        { model: Event, as: 'events', order: [['startDateTime', 'ASC']] },
      ],
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
        include: [
          {
            model: TripCompanion,
            as: 'tripCompanions',
            include: [
              {
                model: TravelCompanion,
                as: 'companion',
                where: { userId: req.user.id },
              },
            ],
          },
        ],
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
      events: trip.events,
    });
  } catch (error) {
    logger.error('Error fetching trip data:', error);
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
        { model: Event, as: 'events', order: [['startDateTime', 'ASC']] },
      ],
    });

    if (!trip) {
      return res.status(404).send('<p class="text-red-600">Trip not found</p>');
    }

    // Fetch all item companions for this trip's items
    const allItemIds = [
      ...trip.flights.map((f) => f.id),
      ...trip.hotels.map((h) => h.id),
      ...trip.transportation.map((t) => t.id),
      ...trip.carRentals.map((c) => c.id),
      ...trip.events.map((e) => e.id),
    ];

    const allItemCompanions = await ItemCompanion.findAll({
      where: {
        itemId: allItemIds,
      },
      include: [
        {
          model: TravelCompanion,
          as: 'companion',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    trip.itemCompanions = allItemCompanions;

    // Check if user has permission to view this trip
    const isOwner = trip.userId === req.user.id;

    if (!isOwner) {
      // Check if user is a companion
      const tripWithCompanions = await Trip.findOne({
        where: { id: req.params.id },
        include: [
          {
            model: TripCompanion,
            as: 'tripCompanions',
            include: [
              {
                model: TravelCompanion,
                as: 'companion',
                where: { userId: req.user.id },
              },
            ],
          },
        ],
      });

      if (!tripWithCompanions?.tripCompanions?.length) {
        return res.status(403).send('<p class="text-red-600">Not authorized</p>');
      }
    }

    // Get current user's travel companion profile and item companions
    let userCompanionId = null;
    const userItemCompanions = {};

    if (!isOwner) {
      // User is a companion on this trip - use their companion profile
      const userCompanionProfile = await TravelCompanion.findOne({
        where: { userId: req.user.id },
      });
      if (userCompanionProfile) {
        userCompanionId = userCompanionProfile.id;
      }
    } else {
      // Trip owner should also check if they have a companion profile
      const ownerCompanionProfile = await TravelCompanion.findOne({
        where: { userId: req.user.id },
      });
      if (ownerCompanionProfile) {
        userCompanionId = ownerCompanionProfile.id;
      }
    }

    // Get item companions data for the current user
    if (userCompanionId) {
      const itemCompanions = await ItemCompanion.findAll({
        where: { companionId: userCompanionId },
      });

      // Create a map of itemId -> itemType for quick lookup
      itemCompanions.forEach((ic) => {
        const key = `${ic.itemType}_${ic.itemId}`;
        userItemCompanions[key] = true;
      });
    }

    // Determine trip status based on dates
    const now = new Date();
    // Parse dates and set to end of day for return date comparison
    const departureDate = new Date(trip.departureDate);
    departureDate.setHours(0, 0, 0, 0);
    const returnDate = new Date(trip.returnDate);
    returnDate.setHours(23, 59, 59, 999);

    let tripStatus = 'upcoming';

    if (now >= departureDate && now <= returnDate) {
      tripStatus = 'in_progress';
    } else if (now > returnDate) {
      tripStatus = 'completed';
    }

    // Extract global marker assignments from query params
    const globalMarkerAssignments = {};
    if (req.query.marker) {
      // marker can be a single value or an array of values
      const markerParams = Array.isArray(req.query.marker) ? req.query.marker : [req.query.marker];
      markerParams.forEach((markerStr) => {
        const [key, value] = markerStr.split('=');
        if (key && value) {
          globalMarkerAssignments[decodeURIComponent(key)] = parseInt(
            decodeURIComponent(value),
            10
          );
        }
      });
    }

    // Render just the sidebar content partial
    res.render('partials/trip-sidebar-content', {
      trip,
      formatInTimezone,
      isOwner,
      userItemCompanions,
      userCompanionId,
      tripStatus,
      globalMarkerAssignments,
    });
  } catch (error) {
    logger.error('Error fetching sidebar HTML:', error);
    res.status(500).send('<p class="text-red-600">Error loading sidebar</p>');
  }
};
