/**
 * Item Type Color Configuration
 * Centralized color definitions for all travel item types
 * Update hex codes here and they'll be reflected throughout the application
 *
 * IMPORTANT: Change the hex values to customize colors.
 */

const ITEM_COLORS = {
  trip: {
    hex: '#28536b',     // Main color - UPDATE THIS
  },
  flight: {
    hex: '#f6d965',     // Main color - UPDATE THIS
  },
  hotel: {
    hex: '#c2a5df',     // Main color - UPDATE THIS
  },
  carRental: {
    hex: '#fea572',     // Main color - UPDATE THIS
  },
  transportation: {
    hex: '#67b3e0',     // Main color - UPDATE THIS
  },
  event: {
    hex: '#ff99c9',     // Main color - UPDATE THIS
  },
};

/**
 * Button Action Colors
 * Colors for approval/confirmation and decline/cancel/delete actions
 */
const ACTION_COLORS = {
  approve: '#54f5a7',     // Approval and confirmation buttons - UPDATE THIS
  decline: '#f24073',     // Decline, cancel, and delete buttons - UPDATE THIS
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
