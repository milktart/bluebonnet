/**
 * Authorization Middleware
 * Route-level permission checking
 * Phase 4 - Authorization & Permissions
 */

const AuthorizationService = require('../services/authorizationService');
const { TripAttendee, Trip } = require('../models');
const logger = require('../utils/logger');

const authService = new AuthorizationService();

module.exports = {
  /**
   * Require user to be authenticated (already done by auth.ensureAuthenticated)
   * This middleware can be chained with other checks
   */
  async requireTripViewAccess(req, res, next) {
    try {
      const { tripId } = req.params;

      if (!tripId) {
        return res.status(400).json({ success: false, message: 'Trip ID required' });
      }

      const hasAccess = await authService.canViewTrip(req.user.id, tripId);

      if (!hasAccess) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      req.tripRole = await authService.getTripRole(req.user.id, tripId);
      next();
    } catch (e) {
      logger.error('Error in requireTripViewAccess:', e);
      res.status(500).json({ success: false, message: 'Authorization error' });
    }
  },

  /**
   * Require user to be able to edit trip
   */
  async requireTripEditAccess(req, res, next) {
    try {
      const { tripId } = req.params;

      if (!tripId) {
        return res.status(400).json({ success: false, message: 'Trip ID required' });
      }

      const canEdit = await authService.canEditTrip(req.user.id, tripId);

      if (!canEdit) {
        return res.status(403).json({ success: false, message: 'Cannot edit this trip' });
      }

      req.tripRole = await authService.getTripRole(req.user.id, tripId);
      next();
    } catch (e) {
      logger.error('Error in requireTripEditAccess:', e);
      res.status(500).json({ success: false, message: 'Authorization error' });
    }
  },

  /**
   * Require user to be trip owner or admin
   */
  async requireTripAdmin(req, res, next) {
    try {
      const { tripId } = req.params;

      if (!tripId) {
        return res.status(400).json({ success: false, message: 'Trip ID required' });
      }

      const role = await authService.getTripRole(req.user.id, tripId);

      if (role !== 'owner' && role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
      }

      req.tripRole = role;
      next();
    } catch (e) {
      logger.error('Error in requireTripAdmin:', e);
      res.status(500).json({ success: false, message: 'Authorization error' });
    }
  },

  /**
   * Require user to own the trip
   */
  async requireTripOwnership(req, res, next) {
    try {
      const { tripId } = req.params;

      if (!tripId) {
        return res.status(400).json({ success: false, message: 'Trip ID required' });
      }

      const isOwner = await authService.isTripOwner(req.user.id, tripId);

      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'Only trip owner can do this' });
      }

      req.tripRole = 'owner';
      next();
    } catch (e) {
      logger.error('Error in requireTripOwnership:', e);
      res.status(500).json({ success: false, message: 'Authorization error' });
    }
  },

  /**
   * Middleware to attach authorization service to request for manual checks
   */
  attachAuthService(req, res, next) {
    req.authService = authService;
    next();
  },
};
