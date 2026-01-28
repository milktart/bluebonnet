/**
 * Companion-related constants
 * Centralized source of truth for item types, permissions, and status values
 */

const { Flight, Hotel, Transportation, CarRental, Event } = require('../models');

// Item types that can have companions
const ITEM_TYPES = ['flight', 'hotel', 'transportation', 'car_rental', 'event'];

// Map of item type to Sequelize model
const ITEM_TYPE_MAP = {
  flight: Flight,
  hotel: Hotel,
  transportation: Transportation,
  car_rental: CarRental,
  event: Event,
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
  ITEM_TYPES,
  ITEM_TYPE_MAP,
  PERMISSION_DEFAULTS,
  COMPANION_STATUS,
};
