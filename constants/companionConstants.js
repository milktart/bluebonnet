/**
 * Companion-related constants
 * Centralized source of truth for item types, permissions, and status values
 */

const { Flight, Hotel, Transportation, CarRental, Event } = require('../models');

// Individual item type constants (use these instead of hardcoded strings)
const ITEM_TYPE_FLIGHT = 'flight';
const ITEM_TYPE_HOTEL = 'hotel';
const ITEM_TYPE_TRANSPORTATION = 'transportation';
const ITEM_TYPE_CAR_RENTAL = 'car_rental';
const ITEM_TYPE_EVENT = 'event';

// Item types that can have companions
const ITEM_TYPES = [
  ITEM_TYPE_FLIGHT,
  ITEM_TYPE_HOTEL,
  ITEM_TYPE_TRANSPORTATION,
  ITEM_TYPE_CAR_RENTAL,
  ITEM_TYPE_EVENT,
];

// Map of item type to Sequelize model
const ITEM_TYPE_MAP = {
  [ITEM_TYPE_FLIGHT]: Flight,
  [ITEM_TYPE_HOTEL]: Hotel,
  [ITEM_TYPE_TRANSPORTATION]: Transportation,
  [ITEM_TYPE_CAR_RENTAL]: CarRental,
  [ITEM_TYPE_EVENT]: Event,
};

// Default permission values
const PERMISSION_DEFAULTS = {
  canView: true,
  canEdit: false,
  canManageCompanions: false,
};

// Companion attendance status
const COMPANION_STATUS = {
  ATTENDING: 'attending',
  NOT_ATTENDING: 'not_attending',
};

module.exports = {
  // Individual type constants
  ITEM_TYPE_FLIGHT,
  ITEM_TYPE_HOTEL,
  ITEM_TYPE_TRANSPORTATION,
  ITEM_TYPE_CAR_RENTAL,
  ITEM_TYPE_EVENT,
  // Collections
  ITEM_TYPES,
  ITEM_TYPE_MAP,
  // Permissions and status
  PERMISSION_DEFAULTS,
  COMPANION_STATUS,
};
