/**
 * Companion Permission Controller
 * API endpoints for managing full-access trip permissions
 */

const { validationResult } = require('express-validator');
const CompanionPermissionService = require('../services/companionPermissionService');
const { User } = require('../models');
const logger = require('../utils/logger');

const permissionService = new CompanionPermissionService();

/**
 * GET /api/user/companion-permissions
 * Get all full-access permissions granted by current user
 */
exports.getGrantedPermissions = async (req, res) => {
  try {
    const permissions = await permissionService.getFullAccessUsers(req.user.id);

    res.json({ success: true, permissions });
  } catch (error) {
    logger.error('GET_GRANTED_PERMISSIONS_ERROR', { error: error.message });
    res.status(500).json({ success: false, error: 'Error fetching permissions' });
  }
};

/**
 * GET /api/user/companion-permissions/received
 * Get all full-access permissions granted to current user
 */
exports.getReceivedPermissions = async (req, res) => {
  try {
    const permissions = await permissionService.getFullAccessGrants(req.user.id);

    res.json({ success: true, permissions });
  } catch (error) {
    logger.error('GET_RECEIVED_PERMISSIONS_ERROR', { error: error.message });
    res.status(500).json({ success: false, error: 'Error fetching permissions' });
  }
};

/**
 * POST /api/user/companion-permissions
 * Grant full-access permission to another user
 */
exports.grantPermission = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { trustedUserId, canManageAllTrips = true, canViewAllTrips = true } = req.body;

    // Verify trusted user exists
    const trustedUser = await User.findByPk(trustedUserId);
    if (!trustedUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const permission = await permissionService.grantFullAccess(req.user.id, trustedUserId, {
      canManageAllTrips,
      canViewAllTrips,
    });

    res.status(201).json({ success: true, permission });
  } catch (error) {
    logger.error('GRANT_PERMISSION_ERROR', { error: error.message });

    if (error.message.includes('yourself')) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.status(500).json({ success: false, error: 'Error granting permission' });
  }
};

/**
 * PUT /api/user/companion-permissions/:trustedUserId
 * Update permission level for a user
 */
exports.updatePermission = async (req, res) => {
  try {
    const { trustedUserId } = req.params;
    const { canManageAllTrips = true, canViewAllTrips = true } = req.body;

    // Verify user exists
    const trustedUser = await User.findByPk(trustedUserId);
    if (!trustedUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const permission = await permissionService.grantFullAccess(req.user.id, trustedUserId, {
      canManageAllTrips,
      canViewAllTrips,
    });

    res.json({ success: true, permission });
  } catch (error) {
    logger.error('UPDATE_PERMISSION_ERROR', { error: error.message });
    res.status(500).json({ success: false, error: 'Error updating permission' });
  }
};

/**
 * DELETE /api/user/companion-permissions/:trustedUserId
 * Revoke full-access permission
 */
exports.revokePermission = async (req, res) => {
  try {
    const { trustedUserId } = req.params;

    const success = await permissionService.revokeFullAccess(req.user.id, trustedUserId);

    if (!success) {
      return res.status(404).json({ success: false, error: 'Permission not found' });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('REVOKE_PERMISSION_ERROR', { error: error.message });
    res.status(500).json({ success: false, error: 'Error revoking permission' });
  }
};
