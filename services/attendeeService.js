/**
 * Attendee Service
 * Business logic for trip attendee management
 *
 * Handles:
 * - Adding/removing trip attendees
 * - Managing attendee roles (owner, admin, attendee)
 * - Validating attendee access permissions
 */

const BaseService = require('./BaseService');
const { TripAttendee, Trip, User } = require('../models');
const logger = require('../utils/logger');

class AttendeeService extends BaseService {
  constructor() {
    super(TripAttendee, 'TripAttendee');
  }

  /**
   * Add attendee to trip
   * @param {string} tripId - Trip ID
   * @param {Object} attendeeData - { email, firstName, lastName, name, userId }
   * @param {string} role - attendee role: 'owner', 'admin', or 'attendee'
   * @returns {Promise<Object>} Created TripAttendee record
   */
  async addTripAttendee(tripId, attendeeData, role = 'attendee') {
    logger.info(`${this.modelName}: Adding attendee to trip`, {
      tripId,
      email: attendeeData.email,
      role,
    });

    // Verify trip exists
    const trip = await Trip.findByPk(tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    // Check if attendee already exists on trip
    const existing = await TripAttendee.findOne({
      where: {
        tripId,
        email: attendeeData.email.toLowerCase(),
      },
    });

    if (existing) {
      logger.warn(`${this.modelName}: Attendee already on trip`, {
        tripId,
        email: attendeeData.email,
      });
      throw new Error('This attendee is already on this trip');
    }

    // Validate role
    if (!['owner', 'admin', 'attendee'].includes(role)) {
      throw new Error('Invalid role. Must be owner, admin, or attendee');
    }

    // Create attendee record
    const attendee = await TripAttendee.create({
      tripId,
      userId: attendeeData.userId || null,
      email: attendeeData.email.toLowerCase(),
      firstName: attendeeData.firstName || null,
      lastName: attendeeData.lastName || null,
      name: attendeeData.name,
      role,
    });

    logger.info(`${this.modelName}: Attendee added to trip`, {
      attendeeId: attendee.id,
      tripId,
      email: attendeeData.email,
      role,
    });

    return attendee;
  }

  /**
   * Remove attendee from trip
   * @param {string} tripId - Trip ID
   * @param {string} attendeeId - Attendee ID
   * @returns {Promise<boolean>} Success
   */
  async removeTripAttendee(tripId, attendeeId) {
    logger.info(`${this.modelName}: Removing attendee from trip`, {
      tripId,
      attendeeId,
    });

    const attendee = await TripAttendee.findOne({
      where: {
        id: attendeeId,
        tripId,
      },
    });

    if (!attendee) {
      logger.warn(`${this.modelName}: Attendee not found on trip`, {
        tripId,
        attendeeId,
      });
      return false;
    }

    // Prevent removing trip owner
    if (attendee.role === 'owner') {
      throw new Error('Cannot remove trip owner');
    }

    await attendee.destroy();

    logger.info(`${this.modelName}: Attendee removed from trip`, {
      tripId,
      attendeeId,
    });

    return true;
  }

  /**
   * Update attendee role
   * @param {string} tripId - Trip ID
   * @param {string} attendeeId - Attendee ID
   * @param {string} newRole - New role: 'owner', 'admin', or 'attendee'
   * @returns {Promise<Object>} Updated TripAttendee record
   */
  async updateAttendeeRole(tripId, attendeeId, newRole) {
    logger.info(`${this.modelName}: Updating attendee role`, {
      tripId,
      attendeeId,
      newRole,
    });

    // Validate role
    if (!['owner', 'admin', 'attendee'].includes(newRole)) {
      throw new Error('Invalid role. Must be owner, admin, or attendee');
    }

    const attendee = await TripAttendee.findOne({
      where: {
        id: attendeeId,
        tripId,
      },
    });

    if (!attendee) {
      throw new Error('Attendee not found on trip');
    }

    // Prevent changing owner role
    if (attendee.role === 'owner') {
      throw new Error('Cannot change trip owner role');
    }

    attendee.role = newRole;
    await attendee.save();

    logger.info(`${this.modelName}: Attendee role updated`, {
      tripId,
      attendeeId,
      newRole,
    });

    return attendee;
  }

  /**
   * Get all attendees for a trip
   * @param {string} tripId - Trip ID
   * @returns {Promise<Array>} Array of TripAttendee records
   */
  async getTripAttendees(tripId) {
    logger.debug(`${this.modelName}: Getting attendees for trip ${tripId}`);

    const attendees = await TripAttendee.findAll({
      where: { tripId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false,
        },
      ],
      order: [['role', 'DESC']], // owner first, then admin, then attendee
    });

    return attendees;
  }

  /**
   * Check if user has access to trip and get their role
   * @param {string} userId - User ID
   * @param {string} tripId - Trip ID
   * @returns {Promise<Object|null>} { attendee, role, isOwner, isAdmin } or null if no access
   */
  async validateTripAccess(userId, tripId) {
    logger.debug(`${this.modelName}: Validating trip access for user ${userId} on trip ${tripId}`);

    // Check if user is trip creator (owner)
    const trip = await Trip.findByPk(tripId);
    if (!trip) {
      return null;
    }

    if (trip.userId === userId) {
      return {
        attendee: null,
        role: 'owner',
        isOwner: true,
        isAdmin: true,
        userId,
      };
    }

    // Check if user is trip attendee
    const attendee = await TripAttendee.findOne({
      where: {
        tripId,
        userId,
      },
    });

    if (!attendee) {
      return null;
    }

    return {
      attendee,
      role: attendee.role,
      isOwner: false,
      isAdmin: attendee.role === 'admin',
      userId,
    };
  }

  /**
   * Get user's trips (as owner + as attendee)
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of trip IDs
   */
  async getUserTrips(userId) {
    logger.debug(`${this.modelName}: Getting trips for user ${userId}`);

    // Trips where user is owner
    const ownedTrips = await Trip.findAll({
      where: { userId },
      attributes: ['id'],
      raw: true,
    });

    // Trips where user is attendee
    const attendeeTrips = await TripAttendee.findAll({
      where: { userId },
      attributes: ['tripId'],
      raw: true,
    });

    const tripIds = [...ownedTrips.map((t) => t.id), ...attendeeTrips.map((a) => a.tripId)];

    // Remove duplicates
    return [...new Set(tripIds)];
  }
}

module.exports = AttendeeService;
