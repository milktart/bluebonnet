const db = require('../models');
const logger = require('../utils/logger');

exports.inviteCompanion = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { invitedUserId } = req.body;
    const userId = req.user.id;

    // Check trip exists
    const trip = await db.Trip.findByPk(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    // Verify user is trip owner
    if (trip.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only trip owner can invite companions',
      });
    }

    // Check invited user exists
    const invitedUser = await db.User.findByPk(invitedUserId);
    if (!invitedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Cannot invite self
    if (userId === invitedUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot invite yourself to a trip',
      });
    }

    // Check if already invited or part of trip
    const existingInvitation = await db.TripInvitation.findOne({
      where: {
        tripId,
        invitedUserId,
      },
    });

    if (existingInvitation) {
      return res.status(400).json({
        success: false,
        message: 'User already invited to this trip',
      });
    }

    // Check if already a companion on trip
    const companion = await db.TravelCompanion.findOne({
      where: {
        userId: invitedUserId,
        createdBy: userId,
      },
      include: [
        {
          model: db.Trip,
          as: 'trips',
          through: {
            attributes: [],
          },
          where: { id: tripId },
        },
      ],
    });

    if (companion) {
      return res.status(400).json({
        success: false,
        message: 'User is already a companion on this trip',
      });
    }

    // Create invitation
    const invitation = await db.TripInvitation.create({
      tripId,
      invitedUserId,
      invitedByUserId: userId,
      status: 'pending',
    });

    logger.info('TRIP_INVITE_CREATE SUCCESS', {
      invitationId: invitation.id,
      tripId,
      invitedUserId,
    });

    // Create notification
    const notification = await db.Notification.create({
      userId: invitedUserId,
      type: 'trip_invitation_received',
      relatedId: invitation.id,
      relatedType: 'trip_invitation',
      message: `${req.user.firstName} ${req.user.lastName} invited you to join the trip "${trip.destination}"`,
      read: false,
      actionRequired: true,
    });

    logger.info('NOTIF_CREATE SUCCESS', {
      notificationId: notification.id,
      relatedId: notification.relatedId,
    });

    return res.status(201).json({
      success: true,
      message: 'Invitation sent',
      invitation,
    });
  } catch (error) {
    logger.error('Error inviting companion to trip:', error);
    return res.status(500).json({
      success: false,
      message: 'Error inviting companion to trip',
    });
  }
};

exports.getPendingInvitations = async (req, res) => {
  try {
    const userId = req.user.id;

    const invitations = await db.TripInvitation.findAll({
      where: {
        invitedUserId: userId,
        status: 'pending',
      },
      include: [
        {
          model: db.Trip,
          as: 'trip',
          attributes: ['id', 'destination', 'startDate', 'endDate', 'userId'],
          include: [
            {
              model: db.User,
              attributes: ['id', 'firstName', 'lastName', 'email'],
            },
          ],
        },
        {
          model: db.User,
          as: 'invitedByUser',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.json({
      success: true,
      invitations,
    });
  } catch (error) {
    logger.error('Error fetching pending invitations:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching pending invitations',
    });
  }
};

exports.respondToInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const { response } = req.body; // 'join' or 'decline'
    const userId = req.user.id;

    logger.info('respondToInvitation called:', { invitationId, response, userId });

    // Validate response
    if (!['join', 'decline'].includes(response)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid response. Must be "join" or "decline"',
      });
    }

    // Find invitation
    const invitation = await db.TripInvitation.findByPk(invitationId, {
      include: [
        {
          model: db.Trip,
          as: 'trip',
        },
      ],
    });

    logger.info('TRIP_INVITE_LOOKUP', {
      invitationId,
      found: !!invitation,
      status: invitation?.status || 'NOT_FOUND',
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found',
      });
    }

    // Verify user is recipient
    if (invitation.invitedUserId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to respond to this invitation',
      });
    }

    // Check if already responded
    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Invitation already responded to',
      });
    }

    if (response === 'join') {
      // Add user as companion to trip
      const { trip } = invitation;

      // Create a travel companion record for this user
      const travelCompanion = await db.TravelCompanion.findOrCreate({
        where: {
          email: req.user.email,
          createdBy: trip.userId,
        },
        defaults: {
          name: `${req.user.firstName} ${req.user.lastName}`,
          email: req.user.email,
          userId: req.user.id,
          createdBy: trip.userId,
        },
      });

      // Add to trip companions with edit permissions based on relationship
      const companionRecord = travelCompanion[0];

      const tripCompanion = await db.TripCompanion.findOrCreate({
        where: {
          tripId: trip.id,
          companionId: companionRecord.id,
        },
        defaults: {
          canEdit: true, // When user explicitly joins, they get edit permissions
          canAddItems: false,
          permissionSource: 'explicit',
          addedBy: trip.userId,
        },
      });

      // Add all trip-level companions to new items created by this user (handled in item creation)

      // Update invitation status
      invitation.status = 'joined';
      invitation.respondedAt = new Date();
      await invitation.save();

      // Note: Removed notification to trip owner - per requirements, trip owner doesn't need confirmation

      return res.json({
        success: true,
        message: 'Joined trip',
        invitation,
      });
    }
    // Decline invitation
    invitation.status = 'declined';
    invitation.respondedAt = new Date();
    await invitation.save();

    // Note: Removed notification to trip owner - per requirements, trip owner doesn't need confirmation

    return res.json({
      success: true,
      message: 'Declined invitation',
      invitation,
    });
  } catch (error) {
    logger.error('Error responding to invitation:', error);
    return res.status(500).json({
      success: false,
      message: 'Error responding to invitation',
    });
  }
};

exports.leaveTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.id;

    // Find trip
    const trip = await db.Trip.findByPk(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    // Cannot leave if you're the owner
    if (trip.userId === userId) {
      return res.status(400).json({
        success: false,
        message: 'Trip owner cannot leave their own trip',
      });
    }

    // Find travel companion for this user
    const travelCompanion = await db.TravelCompanion.findOne({
      where: {
        userId,
        createdBy: trip.userId,
      },
    });

    if (!travelCompanion) {
      return res.status(404).json({
        success: false,
        message: 'Not a companion on this trip',
      });
    }

    // Remove from trip companions
    await db.TripCompanion.destroy({
      where: {
        tripId,
        companionId: travelCompanion.id,
      },
    });

    // Remove from all items in this trip
    const tripItems = await db.sequelize.query(
      `
      SELECT id FROM flights WHERE "tripId" = :tripId
      UNION
      SELECT id FROM hotels WHERE "tripId" = :tripId
      UNION
      SELECT id FROM transportation WHERE "tripId" = :tripId
      UNION
      SELECT id FROM car_rentals WHERE "tripId" = :tripId
      UNION
      SELECT id FROM events WHERE "tripId" = :tripId
      `,
      {
        replacements: { tripId },
        type: db.Sequelize.QueryTypes.SELECT,
      }
    );

    // Remove companion from all items
    for (const item of tripItems) {
      await db.ItemCompanion.destroy({
        where: {
          companionId: travelCompanion.id,
          itemId: item.id,
        },
      });
    }

    // Update or delete invitation if exists
    const invitation = await db.TripInvitation.findOne({
      where: {
        tripId,
        invitedUserId: userId,
      },
    });

    if (invitation) {
      await invitation.destroy();
    }

    return res.json({
      success: true,
      message: 'Left trip',
    });
  } catch (error) {
    logger.error('Error leaving trip:', error);
    return res.status(500).json({
      success: false,
      message: 'Error leaving trip',
    });
  }
};
