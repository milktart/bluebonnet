/**
 * Item Type Color Configuration
 * Centralized color definitions for all travel item types
 * Update hex codes here and they'll be reflected throughout the application
 *
 * IMPORTANT: Change the hex values to customize colors.
 */

const ITEM_COLORS = {
  trip: {
    hex: '#0f4c6b',     // Main color - darker, high contrast (leisure trips)
  },
  business: {
    hex: '#FEA572',     // Business trip color - warm orange
  },
  flight: {
    hex: '#a68900',     // Main color - much darker gold/brown for better contrast
  },
  hotel: {
    hex: '#7c2d8f',     // Main color - darker purple with better contrast
  },
  carRental: {
    hex: '#B6ACA5',     // Main color - warm taupe/beige
  },
  transportation: {
    hex: '#0066cc',     // Main color - darker, more saturated blue
  },
  event: {
    hex: '#d6006a',     // Main color - darker, more saturated pink
  },
};

/**
 * Button Action Colors
 * Colors for approval/confirmation and decline/cancel/delete actions
 */
const ACTION_COLORS = {
  approve: '#4CAF50',     // Approval and confirmation buttons - pleasant medium green
  decline: '#E74C3C',     // Decline, cancel, and delete buttons - warm red-orange
};

/**
 * Get color configuration for an item type
 * @param {string} itemType - Type of item (flight, hotel, etc.)
 * @returns {Object} Color configuration object
 */
function getItemColor(itemType) {
  const normalized = itemType.toLowerCase().replace(/_/g, '');

  // Handle different naming conventions
  const typeMap = {
    flight: 'flight',
    hotel: 'hotel',
    carRental: 'carRental',
    carrental: 'carRental',
    car_rental: 'carRental',
    transportation: 'transportation',
    event: 'event',
    trip: 'trip',
    business: 'business',
  };

  const key = typeMap[normalized] || normalized;
  return ITEM_COLORS[key] || ITEM_COLORS.flight; // Default to flight if not found
}

/**
 * Generate CSS hex color for inline styles
 * @param {string} itemType - Type of item (flight, hotel, etc.)
 * @returns {string} Hex color code (e.g., '#f6d965')
 */
function getItemHexColor(itemType) {
  return getItemColor(itemType).hex;
}

/**
 * Generate inline style string for color
 * @param {string} itemType - Type of item (flight, hotel, etc.)
 * @param {string} property - CSS property (backgroundColor, color, borderColor, etc.)
 * @returns {string} Inline style string (e.g., 'background-color: #f6d965')
 */
function getItemColorStyle(itemType, property = 'backgroundColor') {
  const hex = getItemHexColor(itemType);
  return `${property}: ${hex}`;
}

/**
 * Get action color (approve or decline)
 * @param {string} action - 'approve' or 'decline'
 * @returns {string} Hex color code
 */
function getActionColor(action) {
  const normalized = String(action || '').toLowerCase();
  return ACTION_COLORS[normalized] || ACTION_COLORS.decline;
}

/**
 * Get approval/confirmation button color
 * @returns {string} Hex color code for approve actions
 */
function getApproveColor() {
  return ACTION_COLORS.approve;
}

/**
 * Get decline/cancel/delete button color
 * @returns {string} Hex color code for decline actions
 */
function getDeclineColor() {
  return ACTION_COLORS.decline;
}

module.exports = {
  ITEM_COLORS,
  ACTION_COLORS,
  getItemColor,
  getItemHexColor,
  getItemColorStyle,
  getActionColor,
  getApproveColor,
  getDeclineColor,
};
