/**
 * Authorization Service
 * Central permission checking for all resources
 * Phase 4 - Authorization & Permissions
 */

const { Trip, TripAttendee, ItemTrip, CompanionPermission } = require('../models');
const logger = require('../utils/logger');

class AuthorizationService {
  /**
   * Check if user is owner of a trip
   * @param {string} userId - User ID to check
   * @param {string} tripId - Trip ID to check
   * @returns {Promise<boolean>} True if user owns the trip
   */
  async isTripOwner(userId, tripId) {
    try {
      const trip = await Trip.findByPk(tripId);
      return trip && trip.userId === userId;
    } catch (e) {
      logger.error('Error checking trip ownership:', e);
      return false;
    }
  }

  /**
   * Get trip attendance record for a user
   * @param {string} userId - User ID
   * @param {string} tripId - Trip ID
   * @returns {Promise<TripAttendee|null>} Attendee record or null
   */
  async getTripAttendance(userId, tripId) {
    try {
      return await TripAttendee.findOne({
        where: {
          tripId,
          userId,
        },
      });
    } catch (e) {
      logger.error('Error fetching trip attendance:', e);
      return null;
    }
  }

  /**
   * Check if user can view trip (owner, attendee, or full-access)
   * @param {string} userId - User ID to check
   * @param {string} tripId - Trip ID to check
   * @returns {Promise<boolean>} True if user can view
   */
  async canViewTrip(userId, tripId) {
    try {
      // Check if user owns trip
      if (await this.isTripOwner(userId, tripId)) {
        return true;
      }

      // Check if user is attendee
      const attendance = await this.getTripAttendance(userId, tripId);
      if (attendance) {
        return true;
      }

      // Check if user has full-access to trip owner
      const trip = await Trip.findByPk(tripId);
      if (trip) {
        return await this.hasFullAccessTo(userId, trip.userId, 'view');
      }

      return false;
    } catch (e) {
      logger.error('Error checking trip view permission:', e);
      return false;
    }
  }

  /**
   * Check if user can edit/manage trip (owner, admin attendee, or full-access)
   * @param {string} userId - User ID to check
   * @param {string} tripId - Trip ID to check
   * @returns {Promise<boolean>} True if user can edit
   */
  async canEditTrip(userId, tripId) {
    try {
      // Check if user owns trip
      if (await this.isTripOwner(userId, tripId)) {
        return true;
      }

      // Check if user is trip admin
      const attendance = await this.getTripAttendance(userId, tripId);
      if (attendance && attendance.role === 'admin') {
        return true;
      }

      // Check if user has full-access manage permission
      const trip = await Trip.findByPk(tripId);
      if (trip) {
        return await this.hasFullAccessTo(userId, trip.userId, 'manage');
      }

      return false;
    } catch (e) {
      logger.error('Error checking trip edit permission:', e);
      return false;
    }
  }

  /**
   * Get user's role on a trip
   * @param {string} userId - User ID
   * @param {string} tripId - Trip ID
   * @returns {Promise<string|null>} Role ('owner', 'admin', 'attendee') or null if no access
   */
  async getTripRole(userId, tripId) {
    try {
      // Check ownership
      if (await this.isTripOwner(userId, tripId)) {
        return 'owner';
      }

      // Check attendance
      const attendance = await this.getTripAttendance(userId, tripId);
      if (attendance) {
        return attendance.role;
      }

      return null;
    } catch (e) {
      logger.error('Error getting trip role:', e);
      return null;
    }
  }

  /**
   * Check full-access permission (companion-based permissions)
   * @param {string} userId - User requesting access
   * @param {string} ownerId - Owner of the trips
   * @param {string} type - Permission type ('view' or 'manage')
   * @returns {Promise<boolean>} True if permission granted
   *
   * New Permission Model:
   * - canShareTrips: Owner shares their trips with user (user can view owner's trips)
   * - canManageTrips: Owner allows user to manage their trips (user can edit owner's trips)
   */
  async hasFullAccessTo(userId, ownerId, type = 'manage') {
    try {
      if (userId === ownerId) return true; // User always has access to own trips

      // Find if ownerId has added userId as a companion
      const { TravelCompanion } = require('../models');

      // Get companions created by the owner
      const ownerCompanions = await TravelCompanion.findAll({
        where: {
          createdBy: ownerId,
          userId,
        },
        include: [
          {
            model: CompanionPermission,
            as: 'permissions',
            where: {
              grantedBy: ownerId,
            },
          },
        ],
      });

      if (ownerCompanions.length === 0) return false;

      // Get the permission from the first matching companion
      const companion = ownerCompanions[0];
      const permission = companion.permissions && companion.permissions[0];

      if (!permission) return false;

      if (type === 'view') {
        return permission.canShareTrips || permission.canManageTrips;
      }
      if (type === 'manage') {
        return permission.canManageTrips;
      }

      return false;
    } catch (e) {
      logger.error('Error checking full-access permission:', e);
      return false;
    }
  }

  /**
   * Check if user can view item in a specific trip
   * @param {string} userId - User ID
   * @param {string} itemType - Item type (flight, hotel, etc.)
   * @param {string} itemId - Item ID
   * @param {string} tripId - Trip ID where item is accessed
   * @returns {Promise<boolean>} True if user can view item in trip
   */
  async canViewItemInTrip(userId, itemType, itemId, tripId) {
    try {
      // Can view if:
      // 1. Can view the trip, AND
      // 2. Item is associated with this trip
      const canView = await this.canViewTrip(userId, tripId);
      if (!canView) return false;

      // Check item is in trip via ItemTrip
      const itemTrip = await ItemTrip.findOne({
        where: {
          itemId,
          itemType,
          tripId,
        },
      });

      return !!itemTrip;
    } catch (e) {
      logger.error('Error checking item view permission:', e);
      return false;
    }
  }

  /**
   * Check if user can edit item in a specific trip
   * @param {string} userId - User ID
   * @param {string} itemType - Item type
   * @param {string} itemId - Item ID
   * @param {string} tripId - Trip ID where item belongs
   * @returns {Promise<boolean>} True if user can edit
   */
  async canEditItemInTrip(userId, itemType, itemId, tripId) {
    try {
      // Must be able to edit the trip
      const canEdit = await this.canEditTrip(userId, tripId);
      if (!canEdit) return false;

      // If trip owner or trip admin, can edit any item
      const role = await this.getTripRole(userId, tripId);
      if (role === 'owner' || role === 'admin') {
        return true;
      }

      // Regular attendees can only edit their own items
      // Check if user created the item (userId matches item.userId)
      // This will be checked at item level by controller
      return false;
    } catch (e) {
      logger.error('Error checking item edit permission:', e);
      return false;
    }
  }

  /**
   * Check if user can remove attendee from trip
   * @param {string} userId - User making the change
   * @param {string} tripId - Trip ID
   * @param {string} attendeeId - Attendee to remove
   * @returns {Promise<boolean>} True if allowed
   */
  async canRemoveAttendee(userId, tripId, attendeeId) {
    try {
      // Only trip owner or admin can remove attendees
      const role = await this.getTripRole(userId, tripId);
      if (role !== 'owner' && role !== 'admin') {
        return false;
      }

      // Can't remove trip owner
      const attendee = await TripAttendee.findByPk(attendeeId);
      if (!attendee || attendee.role === 'owner') {
        return false;
      }

      return true;
    } catch (e) {
      logger.error('Error checking attendee removal permission:', e);
      return false;
    }
  }

  /**
   * Check if user can update attendee role
   * @param {string} userId - User making the change
   * @param {string} tripId - Trip ID
   * @param {string} attendeeId - Attendee ID
   * @param {string} newRole - New role to assign
   * @returns {Promise<boolean>} True if allowed
   */
  async canUpdateAttendeeRole(userId, tripId, attendeeId, newRole) {
    try {
      // Only trip owner can change roles
      const role = await this.getTripRole(userId, tripId);
      if (role !== 'owner') {
        return false;
      }

      // Can't change owner role
      const attendee = await TripAttendee.findByPk(attendeeId);
      if (!attendee || attendee.role === 'owner') {
        return false;
      }

      // Validate new role
      const validRoles = ['admin', 'attendee'];
      return validRoles.includes(newRole);
    } catch (e) {
      logger.error('Error checking role update permission:', e);
      return false;
    }
  }

  /**
   * Get all trips user can access (owned, attending, or shared by companions)
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of trip IDs
   *
   * New Permission Model:
   * - User can access trips they own
   * - User can access trips they attend (TripAttendee)
   * - User can access trips from companions who granted canShareTrips permission
   */
  async getAccessibleTrips(userId) {
    try {
      const tripIds = new Set();
      const { TravelCompanion } = require('../models');

      // Get trips user owns
      const ownedTrips = await Trip.findAll({
        where: { userId },
        attributes: ['id'],
      });
      ownedTrips.forEach((t) => tripIds.add(t.id));

      // Get trips user attends
      const attendedTrips = await TripAttendee.findAll({
        where: { userId },
        attributes: ['tripId'],
      });
      attendedTrips.forEach((a) => tripIds.add(a.tripId));

      // Get trips from companions who granted canShareTrips permission
      // Find all companions created by other users that match this userId
      const companionRecords = await TravelCompanion.findAll({
        where: {
          userId,
        },
        include: [
          {
            model: CompanionPermission,
            as: 'permissions',
            where: {
              canShareTrips: true,
            },
          },
        ],
      });

      // Get all trips from the creators of these companions
      for (const companion of companionRecords) {
        const trips = await Trip.findAll({
          where: { userId: companion.createdBy },
          attributes: ['id'],
        });
        trips.forEach((t) => tripIds.add(t.id));
      }

      return Array.from(tripIds);
    } catch (e) {
      logger.error('Error getting accessible trips:', e);
      return [];
    }
  }
}

module.exports = AuthorizationService;
