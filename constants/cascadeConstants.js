/**
 * Cascade Constants
 * Centralized configuration for companion cascade behavior
 * Used by CompanionCascadeManager service
 */

/**
 * Cascade trigger events - when cascade operations should occur
 */
const CASCADE_TRIGGERS = {
  ADD_TO_TRIP: 'add_to_trip',             // Companion added to trip
  REMOVE_FROM_TRIP: 'remove_from_trip',   // Companion removed from trip
  PROMOTE_PERMISSIONS: 'promote_permissions',  // Permissions increased (e.g., view -> edit)
  DEMOTE_PERMISSIONS: 'demote_permissions',    // Permissions decreased (e.g., edit -> view)
};

/**
 * Item types that can have companions
 * These are the targets for cascade operations
 */
const CASCADE_TARGETS = [
  'flight',
  'hotel',
  'event',
  'transportation',
  'car_rental',
];

/**
 * Cascade behavior configuration
 */
const CASCADE_BEHAVIOR = {
  // When adding companion to trip, add to all items
  AUTO_ADD_TO_ITEMS: true,
  // When removing companion from trip, remove from items (inherited only)
  AUTO_REMOVE_FROM_ITEMS: true,
  // When promoting to edit, add companion to all items with edit permission
  AUTO_PROMOTE_ITEMS: true,
  // When demoting from edit, remove edit permission from items
  AUTO_DEMOTE_ITEMS: true,
};

module.exports = {
  CASCADE_TRIGGERS,
  CASCADE_TARGETS,
  CASCADE_BEHAVIOR,
};
