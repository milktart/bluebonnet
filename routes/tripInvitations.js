const express = require('express');

const router = express.Router();
const tripInvitationController = require('../controllers/tripInvitationController');
const { ensureAuthenticated } = require('../middleware/auth');

// All routes require authentication
router.use(ensureAuthenticated);

// Test route to verify middleware and logging
router.get('/test', (req, res) => {
  const logger = require('../utils/logger');
  logger.info('Test route hit');
  return res.json({ message: 'Test route works' });
});

// Invite a companion to a trip (trip owner only)
router.post('/trips/:tripId/invite', tripInvitationController.inviteCompanion);

// Get pending invitations for current user
router.get('/pending', tripInvitationController.getPendingInvitations);

// Respond to a trip invitation (join or decline)
router.put('/:invitationId/respond', (req, res, next) => {
  const logger = require('../utils/logger');
  logger.info('PUT /:invitationId/respond route hit', { invitationId: req.params.invitationId, method: req.method });
  next();
}, tripInvitationController.respondToInvitation);

// Leave a trip (must be a companion, not owner)
router.post('/trips/:tripId/leave', tripInvitationController.leaveTrip);

module.exports = router;
