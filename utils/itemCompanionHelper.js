const db = require('../models');
const logger = require('./logger');
const { sortCompanions } = require('./companionSortingService');

/**
 * Re-export sortCompanions from companionSortingService for backward compatibility
 * @deprecated Use companionSortingService.sortCompanions directly
 */
exports.sortCompanions = (companions, currentUserEmail) => {
  return sortCompanions(companions, currentUserEmail, 'email');
};

/**
 * Auto-add trip-level companions to an item
 */
exports.autoAddTripCompanions = async (itemType, itemId, tripId, addedBy) => {
  logger.info('autoAddTripCompanions called:', { itemType, itemId, tripId, addedBy });

  const tripCompanions = await db.TripCompanion.findAll({
    where: { tripId },
  });

  logger.info(
    'Found trip companions:',
    tripCompanions.map((tc) => ({ id: tc.id, companionId: tc.companionId }))
  );

  const itemCompanionRecords = tripCompanions.map((tc) => ({
    itemType,
    itemId,
    companionId: tc.companionId,
    status: 'attending',
    addedBy,
    inheritedFromTrip: true,
  }));

  logger.info('Creating item companions:', itemCompanionRecords);

  if (itemCompanionRecords.length > 0) {
    const result = await db.ItemCompanion.bulkCreate(itemCompanionRecords, {
      ignoreDuplicates: true,
    });
    logger.info('Created item companions:', result);
  } else {
    logger.info('No item companions to create');
  }
};

/**
 * Update companions for an item
 * @param {string} itemType - Type of item (flight, hotel, etc)
 * @param {string} itemId - ID of the item
 * @param {string[]} companionIds - Array of companion IDs to assign
 * @param {string} tripId - ID of the trip (for inherited companions)
 * @param {string} userId - User making the change
 */
exports.updateItemCompanions = async (itemType, itemId, companionIds, tripId, userId) => {
  // Get existing companions
  const existingCompanions = await db.ItemCompanion.findAll({
    where: { itemType, itemId },
  });

  const existingIds = existingCompanions.map((ic) => ic.companionId);

  // Get trip-level companions
  const tripCompanions = tripId
    ? await db.TripCompanion.findAll({
        where: { tripId },
        attributes: ['companionId'],
      })
    : [];
  const tripCompanionIds = tripCompanions.map((tc) => tc.companionId);

  // Process each companion in the request
  const companionIdSet = new Set(companionIds);

  // Remove companions that are no longer in the list
  for (const existingId of existingIds) {
    if (!companionIdSet.has(existingId)) {
      await db.ItemCompanion.destroy({
        where: { itemType, itemId, companionId: existingId },
      });
    }
  }

  // Add new companions
  for (const companionId of companionIds) {
    const existing = await db.ItemCompanion.findOne({
      where: { itemType, itemId, companionId },
    });

    if (!existing) {
      const inheritedFromTrip = tripCompanionIds.includes(companionId);
      await db.ItemCompanion.create({
        itemType,
        itemId,
        companionId,
        status: 'attending',
        addedBy: userId,
        inheritedFromTrip,
      });
    }
  }
};

/**
 * Remove an item (cascade delete all ItemCompanion records)
 */
exports.removeItemCompanions = async (itemType, itemId) => {
  await db.ItemCompanion.destroy({
    where: { itemType, itemId },
  });
};

/**
 * Get companions as "not attending" if they're on the trip but not on this item
 */
exports.getNotAttendingCompanions = async (itemType, itemId, tripId) => {
  const allCompanions = await this.getAllCompanionsForItem(itemType, itemId, tripId);
  return allCompanions.filter((c) => c.status === 'not_attending' || c.inheritedFromTrip);
};

/**
 * DEPRECATED: Use CompanionCascadeManager service instead
 * This functionality has been moved to services/CompanionCascadeManager.js
 * - cascadeAddToAllItems() - replaces addCompanionToAllItems()
 * - cascadeRemoveFromAllItems() - replaces removeCompanionFromAllItems()
 */
