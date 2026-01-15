/**
 * Trip Companion Loader Utility
 * Centralizes trip companion loading logic that was duplicated across routes
 * Eliminates ~50 line exact duplicate from flights.js, hotels.js, events.js
 */

const logger = require('./logger');

/**
 * Load trip companions with trip owner listed first
 * Consolidates logic from routes to ensure consistent data structure
 * @param {string} tripId - ID of the trip
 * @param {Object} trip - Trip model instance
 * @returns {Promise<Array>} Array of trip companion objects
 * @example
 * const companions = await loadTripCompanions(tripId, trip);
 * // Returns: [
 * //   { id: 'user123', email: 'owner@example.com', firstName: 'John', lastName: 'Doe', isOwner: true },
 * //   { id: 'comp1', email: 'companion@example.com', firstName: 'Jane', lastName: 'Smith' }
 * // ]
 */
async function loadTripCompanions(tripId, trip) {
  if (!tripId || !trip) {
    return [];
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
    const tripOwnerInList = tripCompanionRecords.some(
      (tc) => tc.companion?.userId === trip.userId
    );

    if (!tripOwnerInList && trip.userId) {
      const owner = await User.findByPk(trip.userId, {
        attributes: ['id', 'firstName', 'lastName', 'email'],
      });

      if (owner) {
        tripCompanions.push({
          id: owner.id,
          email: owner.email,
          firstName: owner.firstName,
          lastName: owner.lastName,
          name: `${owner.firstName} ${owner.lastName}`.trim(),
          userId: owner.id,
          isOwner: true,
        });
      }
    }

    // Add other trip companions
    tripCompanions.push(
      ...tripCompanionRecords.map((tc) => ({
        id: tc.companion.id,
        email: tc.companion.email,
        firstName: tc.companion.firstName,
        lastName: tc.companion.lastName,
        name: tc.companion.name,
        userId: tc.companion.userId,
      }))
    );

    return tripCompanions;
  } catch (error) {
    logger.error('Error loading trip companions:', error);
    return [];
  }
}

/**
 * Load trip companions with additional metadata
 * Includes canEdit permission from TripCompanion join table
 * @param {string} tripId - ID of the trip
 * @param {Object} trip - Trip model instance
 * @returns {Promise<Object>} Object with tripCompanions array and tripOwnerId
 * @example
 * const { tripCompanions, tripOwnerId } = await loadTripCompanionsWithPermissions(tripId, trip);
 */
async function loadTripCompanionsWithPermissions(tripId, trip) {
  if (!tripId || !trip) {
    return { tripCompanions: [], tripOwnerId: trip?.userId };
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
    const tripOwnerInList = tripCompanionRecords.some(
      (tc) => tc.companion?.userId === trip.userId
    );

    if (!tripOwnerInList && trip.userId) {
      const owner = await User.findByPk(trip.userId, {
        attributes: ['id', 'firstName', 'lastName', 'email'],
      });

      if (owner) {
        tripCompanions.push({
          id: owner.id,
          email: owner.email,
          firstName: owner.firstName,
          lastName: owner.lastName,
          name: `${owner.firstName} ${owner.lastName}`.trim(),
          userId: owner.id,
          isOwner: true,
          canEdit: true, // Owner always has edit permission
        });
      }
    }

    // Add other trip companions with their canEdit permission
    tripCompanions.push(
      ...tripCompanionRecords.map((tc) => ({
        id: tc.companion.id,
        email: tc.companion.email,
        firstName: tc.companion.firstName,
        lastName: tc.companion.lastName,
        name: tc.companion.name,
        userId: tc.companion.userId,
        canEdit: tc.canEdit || false, // Get permission from join table
      }))
    );

    return {
      tripCompanions,
      tripOwnerId: trip.userId,
    };
  } catch (error) {
    logger.error('Error loading trip companions with permissions:', error);
    return { tripCompanions: [], tripOwnerId: trip?.userId };
  }
}

module.exports = {
  loadTripCompanions,
  loadTripCompanionsWithPermissions,
};
