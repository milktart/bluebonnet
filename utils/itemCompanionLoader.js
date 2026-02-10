/**
 * Shared helper for loading item companions and trip companions.
 * Replaces duplicated loadTripCompanions() across all 5 route files.
 */

/**
 * Load trip companions with trip owner listed first.
 * Deduplicates by userId to prevent the owner appearing twice.
 *
 * @param {string} tripId - Trip ID
 * @param {Object} trip - Trip model instance
 * @returns {Array} Array of companion objects
 */
async function loadTripCompanions(tripId, trip) {
  if (!tripId || !trip) return [];

  const { TripCompanion, TravelCompanion, User } = require('../models');
  const tripCompanions = [];

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
      tripCompanions.push({
        id: owner.id,
        companionId: null,
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
      companionId: tc.companion.id,
      email: tc.companion.email,
      firstName: tc.companion.firstName,
      lastName: tc.companion.lastName,
      name: tc.companion.name,
      userId: tc.companion.userId,
    }))
  );

  return tripCompanions;
}

/**
 * Build the item companions list from ItemCompanion records.
 * For standalone items (no trip), adds the item owner as the first entry.
 *
 * @param {Array} itemCompanionRecords - ItemCompanion records with included companion
 * @param {Object} item - The item model instance (must have userId, tripId)
 * @returns {Array} Array of companion objects
 */
async function buildItemCompanionsList(itemCompanionRecords, item) {
  const { User } = require('../models');

  const companionsList = itemCompanionRecords.map((ic) => ({
    id: ic.companion.id,
    companionId: ic.companion.id,
    email: ic.companion.email,
    firstName: ic.companion.firstName,
    lastName: ic.companion.lastName,
    name: ic.companion.name,
    userId: ic.companion.userId,
    inheritedFromTrip: ic.inheritedFromTrip,
  }));

  // Add item owner as first companion if not already in list
  // Only for standalone items (no trip) to avoid duplicate with trip owner
  if (item.userId && !item.tripId) {
    const ownerInList = companionsList.some((c) => c.userId === item.userId);
    if (!ownerInList) {
      const owner = await User.findByPk(item.userId, {
        attributes: ['id', 'firstName', 'lastName', 'email'],
      });
      if (owner) {
        companionsList.unshift({
          id: owner.id,
          companionId: null,
          email: owner.email,
          firstName: owner.firstName,
          lastName: owner.lastName,
          name: `${owner.firstName} ${owner.lastName}`.trim(),
          userId: owner.id,
          isOwner: true,
        });
      }
    }
  }

  return companionsList;
}

/**
 * Load all companion data for an item: item companions, trip companions, and trip owner ID.
 * Handles the case where trip wasn't loaded with the item.
 *
 * @param {Object} item - The item model instance (must have id, userId, tripId, trip)
 * @param {string} itemType - The item type string (e.g., 'flight', 'hotel', 'event', etc.)
 * @returns {Object} { itemCompanions, tripCompanions, tripOwnerId }
 */
async function loadItemCompanionsData(item, itemType) {
  const { TravelCompanion, ItemCompanion, Trip } = require('../models');

  // Get companions for this item
  const itemCompanionRecords = await ItemCompanion.findAll({
    where: { itemType, itemId: item.id },
    include: [
      {
        model: TravelCompanion,
        as: 'companion',
        attributes: ['id', 'email', 'firstName', 'lastName', 'name', 'userId'],
      },
    ],
  });

  const itemCompanions = await buildItemCompanionsList(itemCompanionRecords, item);

  // Load trip companions
  let tripCompanions = [];
  let tripOwnerId = null;

  if (item.tripId && item.trip) {
    tripCompanions = await loadTripCompanions(item.tripId, item.trip);
    tripOwnerId = item.trip.userId;
  } else if (item.tripId && !item.trip) {
    const trip = await Trip.findByPk(item.tripId);
    if (trip) {
      tripCompanions = await loadTripCompanions(item.tripId, trip);
      tripOwnerId = trip.userId;
    }
  }

  // Deduplicate: remove from tripCompanions anyone already in itemCompanions
  // Use both userId and companionId as dedup keys to handle all cases
  const seenUserIds = new Set();
  const seenCompanionIds = new Set();
  for (const ic of itemCompanions) {
    if (ic.userId) seenUserIds.add(ic.userId);
    if (ic.companionId) seenCompanionIds.add(ic.companionId);
  }
  const dedupedTripCompanions = tripCompanions.filter((tc) => {
    if (tc.userId && seenUserIds.has(tc.userId)) return false;
    if (tc.companionId && seenCompanionIds.has(tc.companionId)) return false;
    return true;
  });

  return { itemCompanions, tripCompanions: dedupedTripCompanions, tripOwnerId };
}

module.exports = {
  loadTripCompanions,
  buildItemCompanionsList,
  loadItemCompanionsData,
};
