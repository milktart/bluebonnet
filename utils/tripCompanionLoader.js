/**
 * Trip Companion Loader Utility
 * Centralizes trip companion loading logic that was duplicated across routes
 * Eliminates ~50 line exact duplicate from flights.js, hotels.js, events.js
 */

const logger = require('./logger');

/**
 * Load trip companions with trip owner listed first
 * Consolidates logic that was duplicated across multiple functions
 * @param {string} tripId - ID of the trip
 * @param {Object} trip - Trip model instance
 * @param {Object} options - Optional configuration
 * @param {boolean} options.includePermissions - Include canEdit permission from TripCompanion join table
 * @param {boolean} options.returnMetadata - Return object with tripOwnerId instead of just array
 * @returns {Promise<Array|Object>} Array of trip companion objects, or object with metadata if returnMetadata=true
 * @example
 * // Simple usage (backwards compatible)
 * const companions = await loadTripCompanions(tripId, trip);
 * // Returns: [
 * //   { id: 'user123', email: 'owner@example.com', firstName: 'John', lastName: 'Doe', isOwner: true },
 * //   { id: 'comp1', email: 'companion@example.com', firstName: 'Jane', lastName: 'Smith' }
 * // ]
 *
 * // With permissions
 * const { tripCompanions, tripOwnerId } = await loadTripCompanions(tripId, trip, {
 *   includePermissions: true,
 *   returnMetadata: true
 * });
 */
async function loadTripCompanions(tripId, trip, options = {}) {
  const { includePermissions = false, returnMetadata = false } = options;

  if (!tripId || !trip) {
    return returnMetadata ? { tripCompanions: [], tripOwnerId: trip?.userId } : [];
  }

  try {
    const { TripCompanion, TravelCompanion, User } = require('../models');
    const tripCompanions = [];

    // Get all trip companions from TripCompanion join table
    const tripCompanionRecords = await TripCompanion.findAll({
      where: { tripId },
      include: [
        {
          model: TravelCompanion,
          as: 'companion',
          attributes: ['id', 'email', 'firstName', 'lastName', 'name', 'userId'],
        },
      ],
    });

    // Add trip owner as first companion if not already in list
    const tripOwnerInList = tripCompanionRecords.some((tc) => tc.companion?.userId === trip.userId);

    if (!tripOwnerInList && trip.userId) {
      const owner = await User.findByPk(trip.userId, {
        attributes: ['id', 'firstName', 'lastName', 'email'],
      });

      if (owner) {
        const ownerData = {
          id: owner.id,
          email: owner.email,
          firstName: owner.firstName,
          lastName: owner.lastName,
          name: `${owner.firstName} ${owner.lastName}`.trim(),
          userId: owner.id,
          isOwner: true,
        };

        // Add permission field if requested
        if (includePermissions) {
          ownerData.canEdit = true; // Owner always has edit permission
        }

        tripCompanions.push(ownerData);
      }
    }

    // Add other trip companions
    tripCompanions.push(
      ...tripCompanionRecords.map((tc) => {
        const companionData = {
          id: tc.companion.id,
          email: tc.companion.email,
          firstName: tc.companion.firstName,
          lastName: tc.companion.lastName,
          name: tc.companion.name,
          userId: tc.companion.userId,
        };

        // Add permission field if requested
        if (includePermissions) {
          companionData.canEdit = tc.canEdit || false;
        }

        return companionData;
      })
    );

    // Return with metadata if requested
    if (returnMetadata) {
      return {
        tripCompanions,
        tripOwnerId: trip.userId,
      };
    }

    return tripCompanions;
  } catch (error) {
    logger.error('Error loading trip companions:', error);
    return returnMetadata ? { tripCompanions: [], tripOwnerId: trip?.userId } : [];
  }
}

/**
 * Load trip companions with permissions - backwards compatibility wrapper
 * @deprecated Use loadTripCompanions(tripId, trip, { includePermissions: true, returnMetadata: true }) instead
 * @param {string} tripId - ID of the trip
 * @param {Object} trip - Trip model instance
 * @returns {Promise<Object>} Object with tripCompanions array and tripOwnerId
 */
async function loadTripCompanionsWithPermissions(tripId, trip) {
  return loadTripCompanions(tripId, trip, { includePermissions: true, returnMetadata: true });
}

module.exports = {
  loadTripCompanions,
  loadTripCompanionsWithPermissions,
};
