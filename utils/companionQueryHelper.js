/**
 * Companion Query Helper
 * Centralized query builder for companion lookups
 * Eliminates duplicate WHERE clause patterns across companionController.js
 */
const { Op } = require('sequelize');
const { User, CompanionPermission } = require('../models');

/**
 * Get base where clause for current user's companions
 * Excludes the user's own companion profile (where userId = current user)
 *
 * @param {string} userId - User ID
 * @returns {Object} Sequelize where clause
 */
function getMyCompanionsWhere(userId) {
  return {
    createdBy: userId,
    // Exclude account owner's companion profile (where userId equals current user)
    // Must explicitly handle NULL since SQL NULL != value evaluates to NULL (not true)
    [Op.or]: [{ userId: { [Op.is]: null } }, { userId: { [Op.ne]: userId } }],
  };
}

/**
 * Get standard include clause for companions with linked user info
 *
 * @param {boolean} includePermissions - Whether to include permission records
 * @param {string} userId - User ID (required if includePermissions is true)
 * @returns {Object} Sequelize include clause
 */
function getCompanionInclude(includePermissions = false, userId = null) {
  const include = [
    {
      model: User,
      as: 'linkedAccount',
      attributes: ['id', 'firstName', 'lastName', 'email'],
    },
  ];

  if (includePermissions && userId) {
    include.push({
      model: CompanionPermission,
      as: 'permissions',
      where: { grantedBy: userId },
      required: false,
    });
  }

  return include;
}

/**
 * Get base query options for listing companions
 *
 * @param {string} userId - User ID
 * @param {Object} options - Additional query options
 * @returns {Object} Complete Sequelize query options
 */
function getMyCompanionsQuery(userId, options = {}) {
  return {
    where: getMyCompanionsWhere(userId),
    include: getCompanionInclude(
      options.includePermissions,
      options.includePermissions ? userId : null
    ),
    order: [['name', 'ASC']],
    ...options,
  };
}

module.exports = {
  getMyCompanionsWhere,
  getCompanionInclude,
  getMyCompanionsQuery,
};
