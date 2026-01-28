/**
 * Companion Name Helper
 * Centralized logic for generating companion display names
 * Eliminates duplicate name generation logic in companionController.js
 */

/**
 * Generate display name for a companion
 * Prioritizes firstName + lastName, falls back to name field, then email
 *
 * @param {Object} data - Companion data
 * @returns {string} Generated display name
 */
function generateCompanionName(data) {
  // Destructure with defaults to handle missing fields
  const { firstName = '', lastName = '', name = '', email = '' } = data;

  // If we have firstName and lastName, use them (with lastname initial format for consistency)
  if (firstName && lastName) {
    return `${firstName} ${lastName.charAt(0)}.`;
  }

  // If we have firstName only
  if (firstName) {
    return firstName;
  }

  // If we have lastName only (unlikely but possible)
  if (lastName) {
    return lastName;
  }

  // If we have a pre-composed name
  if (name) {
    return name;
  }

  // Fall back to email username portion (should not happen normally)
  if (email) {
    const [emailName] = email.split('@');
    return emailName;
  }

  // Final fallback
  return '';
}

/**
 * Extract name components from a display name or generate from parts
 * Used for splitting a full name into firstName and lastName
 *
 * @param {string} fullName - Full name to split
 * @returns {Object} Object with firstName and lastName properties
 */
function extractNameComponents(fullName) {
  if (!fullName) {
    return { firstName: '', lastName: '' };
  }

  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) {
    return { firstName: '', lastName: '' };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }

  // Split on first space: everything before is firstName, rest is lastName
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');

  return { firstName, lastName };
}

module.exports = {
  generateCompanionName,
  extractNameComponents,
};
