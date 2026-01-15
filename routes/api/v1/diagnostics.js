/**
 * Diagnostics Routes
 * DEBUG ONLY - For troubleshooting companion and trip visibility issues
 */

const express = require('express');
const { ensureAuthenticated } = require('../../../middleware/auth');
const { TravelCompanion, TripCompanion, ItemCompanion, Trip } = require('../../../models');

const router = express.Router();
router.use(ensureAuthenticated);

/**
 * GET /api/v1/diagnostics/companion-status
 * Show diagnostic info about companion relationships for current user
 */
router.get('/companion-status', async (req, res) => {
  try {
    const userId = req.user.id;
    const email = req.user.email;

    // 1. Find TravelCompanion record linked to this user
    const myTravelCompanion = await TravelCompanion.findOne({
      where: { userId },
    });

    // 2. Find TravelCompanion records created by me (I created these companions)
    const companionsICreated = await TravelCompanion.findAll({
      where: { createdBy: userId },
      attributes: ['id', 'email', 'firstName', 'lastName', 'userId'],
    });

    // 3. Find TravelCompanion records where I'm the target (people added me)
    const companionProfilesForMe = await TravelCompanion.findAll({
      where: { userId },
      attributes: ['id', 'email', 'firstName', 'lastName', 'createdBy'],
    });

    // 4. Find TripCompanion records that reference my TravelCompanion
    let tripsWhereIAmCompanion = [];
    if (myTravelCompanion) {
      tripsWhereIAmCompanion = await TripCompanion.findAll({
        where: { companionId: myTravelCompanion.id },
        include: [
          {
            model: Trip,
            as: 'trip',
            attributes: ['id', 'name', 'departureDate', 'returnDate'],
          },
        ],
      });
    }

    // 5. Find trips I own
    const tripsIOwn = await Trip.findAll({
      where: { userId },
      attributes: ['id', 'name', 'departureDate', 'returnDate'],
    });

    res.json({
      success: true,
      diagnostics: {
        currentUser: {
          id: userId,
          email,
        },
        myTravelCompanionRecord: myTravelCompanion
          ? {
              id: myTravelCompanion.id,
              email: myTravelCompanion.email,
              firstName: myTravelCompanion.firstName,
              lastName: myTravelCompanion.lastName,
              createdBy: myTravelCompanion.createdBy,
              userId: myTravelCompanion.userId,
            }
          : null,
        companionsICreated: companionsICreated.length,
        companionDetails: companionsICreated.map((c) => ({
          id: c.id,
          email: c.email,
          name: `${c.firstName} ${c.lastName}`,
          linkedUserId: c.userId,
        })),
        companionProfilesForMe: companionProfilesForMe.length,
        tripsWhereIAmCompanion: tripsWhereIAmCompanion.length,
        tripsWhereIAmCompanionDetails: tripsWhereIAmCompanion.map((tc) => ({
          tripId: tc.trip?.id,
          tripName: tc.trip?.name,
          companionId: tc.companionId,
          canEdit: tc.canEdit,
        })),
        tripsIOwn: tripsIOwn.length,
      },
    });
  } catch (error) {
    console.error('Diagnostics error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
