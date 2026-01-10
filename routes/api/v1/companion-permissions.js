/**
 * API v1 Companion Permissions Routes
 * RESTful JSON API for managing full-access trip permissions
 */

const express = require('express');
const { body, param } = require('express-validator');
const companionPermissionController = require('../../../controllers/companionPermissionController');
const { ensureAuthenticated } = require('../../../middleware/auth');

const router = express.Router();

// All permission routes require authentication
router.use(ensureAuthenticated);

// Validation middleware
const grantPermissionValidation = [
  body('trustedUserId').notEmpty().isUUID(),
  body('canManageAllTrips').optional().isBoolean(),
  body('canViewAllTrips').optional().isBoolean(),
];

const updatePermissionValidation = [
  body('canManageAllTrips').optional().isBoolean(),
  body('canViewAllTrips').optional().isBoolean(),
];

/**
 * GET /api/v1/user/companion-permissions
 * Get all full-access permissions granted by current user
 */
router.get('/user/companion-permissions', companionPermissionController.getGrantedPermissions);

/**
 * GET /api/v1/user/companion-permissions/received
 * Get all full-access permissions granted to current user
 */
router.get(
  '/user/companion-permissions/received',
  companionPermissionController.getReceivedPermissions
);

/**
 * POST /api/v1/user/companion-permissions
 * Grant full-access permission to another user
 */
router.post(
  '/user/companion-permissions',
  grantPermissionValidation,
  companionPermissionController.grantPermission
);

/**
 * PUT /api/v1/user/companion-permissions/:trustedUserId
 * Update permission level for a user
 */
router.put(
  '/user/companion-permissions/:trustedUserId',
  param('trustedUserId').isUUID(),
  updatePermissionValidation,
  companionPermissionController.updatePermission
);

/**
 * DELETE /api/v1/user/companion-permissions/:trustedUserId
 * Revoke full-access permission
 */
router.delete(
  '/user/companion-permissions/:trustedUserId',
  param('trustedUserId').isUUID(),
  companionPermissionController.revokePermission
);

module.exports = router;
