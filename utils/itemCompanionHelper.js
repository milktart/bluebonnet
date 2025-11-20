const db = require('../models');
const logger = require('./logger');

/**
 * Sort companions: self (current user) first, then alphabetically by first name
 * @param {Array} companions - Array of companion objects with name and email
 * @param {string} currentUserEmail - Email of the current user
 * @returns {Array} Sorted array of companions
 */
exports.sortCompanions = (companions, currentUserEmail) => {
  const selfCompanion = companions.find((c) => c.email === currentUserEmail);
  const others = companions
    .filter((c) => c.email !== currentUserEmail)
    .sort((a, b) => {
      const firstNameA = a.name.split(' ')[0];
      const firstNameB = b.name.split(' ')[0];
      return firstNameA.localeCompare(firstNameB);
    });

  return selfCompanion ? [selfCompanion, ...others] : others;
};

/**
 * Gets trip-level companions for an item's trip
 */
exports.getTripLevelCompanions = async (tripId) => {
  const tripCompanions = await db.TripCompanion.findAll({
    where: { tripId },
    include: [
      {
        model: db.TravelCompanion,
        as: 'companion',
      },
    ],
  });

  return tripCompanions.map((tc) => ({
    id: tc.companion.id,
    name: tc.companion.name,
    email: tc.companion.email,
    inheritedFromTrip: true,
    companionUserId: tc.companion.userId,
  }));
};

/**
 * Gets item-level companions for a specific item
 */
exports.getItemLevelCompanions = async (itemType, itemId) => {
  const itemCompanions = await db.ItemCompanion.findAll({
    where: { itemType, itemId },
    include: [
      {
        model: db.TravelCompanion,
        as: 'companion',
      },
    ],
  });

  return itemCompanions.map((ic) => ({
    id: ic.companion.id,
    name: ic.companion.name,
    email: ic.companion.email,
    status: ic.status,
    inheritedFromTrip: ic.inheritedFromTrip,
    companionUserId: ic.companion.userId,
  }));
};

/**
 * Gets all companions for an item (trip-level + item-level)
 */
exports.getAllCompanionsForItem = async (itemType, itemId, tripId) => {
  const tripCompanions = tripId ? await this.getTripLevelCompanions(tripId) : [];
  const itemCompanions = await this.getItemLevelCompanions(itemType, itemId);

  // Merge arrays, avoiding duplicates
  const companionMap = new Map();

  // Add trip companions
  tripCompanions.forEach((tc) => {
    companionMap.set(tc.id, { ...tc, inheritedFromTrip: true });
  });

  // Add/update with item companions
  itemCompanions.forEach((ic) => {
    if (companionMap.has(ic.id)) {
      // Update existing entry with item-specific status
      const existing = companionMap.get(ic.id);
      companionMap.set(ic.id, {
        ...existing,
        status: ic.status,
        inheritedFromTrip: ic.inheritedFromTrip,
      });
    } else {
      companionMap.set(ic.id, ic);
    }
  });

  return Array.from(companionMap.values());
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
 * Add a companion to all existing items in a trip
 * Used when adding a new companion to a trip - they should be added to all existing items
 */
exports.addCompanionToAllItems = async (companionId, tripId, addedBy) => {
  const { Flight, Hotel, Transportation, CarRental, Event } = db;

  // Find all items in the trip
  const [flights, hotels, transportation, carRentals, events] = await Promise.all([
    Flight.findAll({ where: { tripId } }),
    Hotel.findAll({ where: { tripId } }),
    Transportation.findAll({ where: { tripId } }),
    CarRental.findAll({ where: { tripId } }),
    Event.findAll({ where: { tripId } }),
  ]);

  // Add companion to all items
  const itemCompanionRecords = [];

  flights.forEach((f) => {
    itemCompanionRecords.push({
      itemType: 'flight',
      itemId: f.id,
      companionId,
      status: 'attending',
      addedBy,
      inheritedFromTrip: true,
    });
  });

  hotels.forEach((h) => {
    itemCompanionRecords.push({
      itemType: 'hotel',
      itemId: h.id,
      companionId,
      status: 'attending',
      addedBy,
      inheritedFromTrip: true,
    });
  });

  transportation.forEach((t) => {
    itemCompanionRecords.push({
      itemType: 'transportation',
      itemId: t.id,
      companionId,
      status: 'attending',
      addedBy,
      inheritedFromTrip: true,
    });
  });

  carRentals.forEach((cr) => {
    itemCompanionRecords.push({
      itemType: 'car_rental',
      itemId: cr.id,
      companionId,
      status: 'attending',
      addedBy,
      inheritedFromTrip: true,
    });
  });

  events.forEach((e) => {
    itemCompanionRecords.push({
      itemType: 'event',
      itemId: e.id,
      companionId,
      status: 'attending',
      addedBy,
      inheritedFromTrip: true,
    });
  });

  if (itemCompanionRecords.length > 0) {
    await db.ItemCompanion.bulkCreate(itemCompanionRecords, {
      ignoreDuplicates: true,
    });
  }
};
