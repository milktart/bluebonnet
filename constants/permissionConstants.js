/**
 * Permission Constants
 * Centralized permission field names and defaults
 * Used by models, controllers, and services for consistent permission handling
 */

/**
 * Standard permission field names used across all companion models
 */
const PERMISSION_FIELDS = ['canView', 'canEdit', 'canManageCompanions'];

/**
 * Permission sources - how a permission was granted
 */
const PERMISSION_SOURCES = {
  OWNER: 'owner',           // User owns the resource
  MANAGE_TRAVEL: 'manage_travel',  // Permission granted via manage_travel flag
  EXPLICIT: 'explicit',     // Explicitly added by owner
  INHERITED: 'inherited',   // Inherited from trip-level permission
};

/**
 * Default permissions when creating new companion relationships
 */
const DEFAULT_PERMISSIONS = {
  canView: true,
  canEdit: false,
  canManageCompanions: false,
};

/**
 * Permission levels for easy comparison
 */
const PERMISSION_LEVELS = {
  VIEW: 'view',
  EDIT: 'edit',
  MANAGE: 'manage',
};

module.exports = {
  PERMISSION_FIELDS,
  PERMISSION_SOURCES,
  DEFAULT_PERMISSIONS,
  PERMISSION_LEVELS,
};
