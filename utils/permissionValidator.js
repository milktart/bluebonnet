/**
 * Permission Validator
 * Shared validation logic for companion permissions
 * Used by models, controllers, and services
 */

const { PERMISSION_FIELDS, DEFAULT_PERMISSIONS } = require('../constants/permissionConstants');

/**
 * Validate permission object has correct fields
 * @param {Object} permissions - Permission object to validate
 * @returns {Array<string>} - Array of error messages (empty if valid)
 */
function validatePermissions(permissions) {
  const errors = [];

  if (!permissions || typeof permissions !== 'object') {
    errors.push('Permissions must be an object');
    return errors;
  }

  // Check for unknown fields
  const allowedFields = [...PERMISSION_FIELDS, 'id', 'createdAt', 'updatedAt'];
  const providedFields = Object.keys(permissions);
  const unknownFields = providedFields.filter(field => !allowedFields.includes(field));

  if (unknownFields.length > 0) {
    errors.push(`Unknown permission fields: ${unknownFields.join(', ')}`);
  }

  // Validate boolean fields
  PERMISSION_FIELDS.forEach(field => {
    if (field in permissions && typeof permissions[field] !== 'boolean') {
      errors.push(`${field} must be a boolean`);
    }
  });

  // Business rule: canManageCompanions requires canEdit
  if (permissions.canManageCompanions && !permissions.canEdit) {
    errors.push('canManageCompanions requires canEdit to be true');
  }

  return errors;
}

/**
 * Check if a user has a specific permission for a resource
 * @param {Object} user - User object with permissions
 * @param {Object} resource - Resource object (trip, item, etc.)
 * @param {string} action - Action to check ('view', 'edit', 'manage')
 * @returns {boolean} - True if user has permission
 */
function hasPermission(user, resource, action) {
  if (!user || !resource) return false;

  // Owner has all permissions
  if (resource.userId === user.id || resource.ownerId === user.id) {
    return true;
  }

  // Check companion permissions
  if (resource.companions && Array.isArray(resource.companions)) {
    const userCompanion = resource.companions.find(c =>
      c.companionId === user.companionId || c.companion?.userId === user.id
    );

    if (userCompanion) {
      switch (action) {
        case 'view':
          return userCompanion.canView === true;
        case 'edit':
          return userCompanion.canEdit === true;
        case 'manage':
        case 'manageCompanions':
          return userCompanion.canManageCompanions === true;
        default:
          return false;
      }
    }
  }

  return false;
}

/**
 * Check if a permission can cascade from source to target
 * @param {string} permission - Permission type ('canView', 'canEdit', 'canManageCompanions')
 * @param {string} source - Source level ('trip', 'item')
 * @param {string} target - Target level ('trip', 'item')
 * @returns {boolean} - True if permission can cascade
 */
function canCascadePermission(permission, source, target) {
  // Trip permissions can cascade down to items
  if (source === 'trip' && target === 'item') {
    return true;
  }

  // Item permissions cannot cascade up to trip
  if (source === 'item' && target === 'trip') {
    return false;
  }

  // Same level doesn't cascade
  return false;
}

/**
 * Merge default permissions with provided permissions
 * @param {Object} permissions - Partial permission object
 * @returns {Object} - Complete permission object with defaults
 */
function mergeWithDefaults(permissions = {}) {
  return {
    ...DEFAULT_PERMISSIONS,
    ...permissions
  };
}

/**
 * Check if permissions are valid and safe to save
 * @param {Object} permissions - Permission object to check
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
function isValidPermissionSet(permissions) {
  const errors = validatePermissions(permissions);
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize permission object (remove unknown fields, apply defaults)
 * @param {Object} permissions - Permission object to sanitize
 * @returns {Object} - Sanitized permission object
 */
function sanitizePermissions(permissions = {}) {
  const sanitized = {};

  PERMISSION_FIELDS.forEach(field => {
    if (field in permissions) {
      sanitized[field] = Boolean(permissions[field]);
    } else {
      sanitized[field] = DEFAULT_PERMISSIONS[field];
    }
  });

  // Enforce business rule: canManageCompanions requires canEdit
  if (sanitized.canManageCompanions && !sanitized.canEdit) {
    sanitized.canManageCompanions = false;
  }

  return sanitized;
}

module.exports = {
  validatePermissions,
  hasPermission,
  canCascadePermission,
  mergeWithDefaults,
  isValidPermissionSet,
  sanitizePermissions,
};
