const express = require('express');

const router = express.Router();
const companionRelationshipController = require('../controllers/companionRelationshipController');
const { ensureAuthenticated } = require('../middleware/auth');

// All routes require authentication
router.use(ensureAuthenticated);

// Send companion request
router.post('/request', companionRelationshipController.sendRequest);

// Get pending requests (both incoming and outgoing)
router.get('/pending', companionRelationshipController.getPendingRequests);

// Accept companion request
router.put('/:relationshipId/accept', companionRelationshipController.acceptRequest);

// Decline companion request
router.put('/:relationshipId/decline', companionRelationshipController.declineRequest);

// Update permission level for an accepted relationship
router.put('/:relationshipId/permission', companionRelationshipController.updatePermissionLevel);

// Revoke (delete) a relationship
router.delete('/:relationshipId', companionRelationshipController.revokeRelationship);

// Get mutual companions
router.get('/mutual', companionRelationshipController.getMutualCompanions);

// Resend companion request
router.post('/:relationshipId/resend', companionRelationshipController.resendRequest);

module.exports = router;
