/**
 * Trip Selector Helper
 * Handles fetching available trips, verifying edit access, and managing item-to-trip associations
 */

const { Trip, Sequelize, TravelCompanion, ItemCompanion } = require('../../models');
const logger = require('../../utils/logger');
const companionPermissionService = require('../../services/companionPermissionService');

/**
 * Get all upcoming/in-progress trips for a user
 * @param {string} userId - User ID to fetch trips for
 * @returns {Promise<Array>} - Array of trips with id and name
 */
async function getAvailableTrips(userId) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get trips where returnDate >= today (includes both upcoming and in-progress)
    const trips = await Trip.findAll({
      where: {
        userId,
        [Sequelize.Op.or]: [
          // Upcoming trips (haven't started yet)
          {
            departureDate: {
              [Sequelize.Op.gte]: today,
            },
          },
          // In-progress trips (started but not ended)
          {
            [Sequelize.Op.and]: [
              {
                departureDate: {
                  [Sequelize.Op.lt]: today,
                },
              },
              {
                returnDate: {
                  [Sequelize.Op.gte]: today,
                },
              },
            ],
          },
        ],
      },
      attributes: ['id', 'name', 'departureDate', 'returnDate'],
      order: [['departureDate', 'ASC']],
    });

    return trips;
  } catch (error) {
    logger.error('Error fetching available trips:', error);
    return [];
  }
}

/**
 * Verify if a user has edit access to a specific trip
 * Edit access is granted to:
 * - Trip owner
 * - Users with full trip management permissions (via companionPermissionService)
 *
 * @param {string} tripId - Trip ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - True if user has edit access
 */
async function verifyTripEditAccess(tripId, userId) {
  try {
    // Check if user is trip owner
    const trip = await Trip.findOne({
      where: { id: tripId },
      attributes: ['userId'],
    });

    if (!trip) {
      return false;
    }

    // User is owner
    if (trip.userId === userId) {
      return true;
    }

    // Check if user has full trip management permission from the trip owner
    // This uses the companion permission system for full-access trip sharing
    const hasPermission = await companionPermissionService.checkPermission(
      userId,
      trip.userId,
      'manage'
    );

    return hasPermission;
  } catch (error) {
    logger.error('Error verifying trip edit access:', error);
    return false;
  }
}

/**
 * Verify if a user can edit a specific item
 * Edit access is granted to:
 * - Item owner
 * - Trip owner (if item is attached to a trip)
 * - Companions with edit permission (canEdit=true) on the item
 *
 * @param {Object} item - Item object with userId and tripId (itemType and id if checking companion)
 * @param {string} userId - User ID
 * @param {string} itemType - Item type for companion lookup (e.g., 'flight', 'hotel')
 * @returns {Promise<boolean>} - True if user has edit access
 */
async function verifyItemEditAccess(item, userId, itemType = null) {
  try {
    // Check if user is item owner
    if (item.userId === userId) {
      return true;
    }

    // Check if user is trip owner (if item is attached to a trip)
    if (item.tripId) {
      const trip = await Trip.findOne({
        where: { id: item.tripId, userId },
        attributes: ['id'],
      });

      if (trip) {
        return true;
      }
    }

    // Check if user is a companion with edit permission on the item
    // First, find if the user has a companion relationship with the item owner
    if (item.userId && itemType && item.id) {
      const itemCompanion = await ItemCompanion.findOne({
        where: {
          itemType,
          itemId: item.id,
          canEdit: true,
        },
        include: [
          {
            model: TravelCompanion,
            as: 'companion',
            where: { userId }, // Find the companion linked to current user
          },
        ],
      });

      if (itemCompanion) {
        return true;
      }
    }

    return false;
  } catch (error) {
    logger.error('Error verifying item edit access:', error);
    return false;
  }
}

/**
 * Prepare trip selector data for forms
 * Returns current trip info and available trips for the user
 *
 * @param {Object} item - Item object (flight, hotel, etc.) with optional tripId
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - {currentTripId, currentTripName, availableTrips}
 */
async function getTripSelectorData(item, userId) {
  try {
    let currentTrip = null;

    // If item is attached to a trip, fetch trip details
    if (item && item.tripId) {
      currentTrip = await Trip.findOne({
        where: { id: item.tripId },
        attributes: ['id', 'name'],
      });
    }

    // Fetch all available trips for user
    const availableTrips = await getAvailableTrips(userId);

    return {
      currentTripId: item?.tripId || null,
      currentTripName: currentTrip?.name || null,
      availableTrips,
    };
  } catch (error) {
    logger.error('Error preparing trip selector data:', error);
    return {
      currentTripId: null,
      currentTripName: null,
      availableTrips: [],
    };
  }
}

module.exports = {
  getAvailableTrips,
  verifyTripEditAccess,
  verifyItemEditAccess,
  getTripSelectorData,
};
