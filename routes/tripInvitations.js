const express = require('express');
const router = express.Router();
const tripInvitationController = require('../controllers/tripInvitationController');
const { ensureAuthenticated } = require('../middleware/auth');

// All routes require authentication
router.use(ensureAuthenticated);

// Invite a companion to a trip (trip owner only)
router.post('/trips/:tripId/invite', tripInvitationController.inviteCompanion);

// Get pending invitations for current user
router.get('/pending', tripInvitationController.getPendingInvitations);

// Respond to a trip invitation (join or decline)
router.put('/:invitationId/respond', tripInvitationController.respondToInvitation);

// Leave a trip (must be a companion, not owner)
router.post('/trips/:tripId/leave', tripInvitationController.leaveTrip);

module.exports = router;
