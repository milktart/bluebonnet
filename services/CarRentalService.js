/**
 * Car Rental Service
 * Extends TravelItemService with car rental-specific business logic
 * Handles car rental creation, updates, and retrieval with all related data
 */

const TravelItemService = require('./TravelItemService');
const logger = require('../utils/logger');

class CarRentalService extends TravelItemService {
  constructor(CarRental) {
    super(CarRental, 'CarRental', 'car_rental');
  }

  /**
   * Create a new car rental
   * @param {Object} data - Car rental data (should be processed by prepareItemData first)
   * @param {string} userId - User ID of car rental owner
   * @param {Object} options - Creation options
   * @returns {Promise<Object>} Created car rental
   */
  async createCarRental(data, userId, options = {}) {
    try {
      return await this.createItem(data, userId, options);
    } catch (error) {
      logger.error('Error creating car rental:', error);
      throw error;
    }
  }

  /**
   * Update an existing car rental
   * @param {Object} carRental - Car rental instance
   * @param {Object} data - Updated car rental data
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Updated car rental
   */
  async updateCarRental(carRental, data, options = {}) {
    try {
      return await this.updateItem(carRental, data, options);
    } catch (error) {
      logger.error('Error updating car rental:', error);
      throw error;
    }
  }

  /**
   * Delete a car rental
   * @param {Object} carRental - Car rental instance
   * @returns {Promise<void>}
   */
  async deleteCarRental(carRental) {
    try {
      return await this.deleteItem(carRental);
    } catch (error) {
      logger.error('Error deleting car rental:', error);
      throw error;
    }
  }

  /**
   * Restore a deleted car rental
   * @param {Object} carRental - Car rental instance
   * @returns {Promise<Object>} Restored car rental
   */
  async restoreCarRental(carRental) {
    try {
      return await this.restoreItem(carRental);
    } catch (error) {
      logger.error('Error restoring car rental:', error);
      throw error;
    }
  }

  /**
   * Get car rental with all related data
   * @param {string} carRentalId - Car rental ID
   * @returns {Promise<Object>} Car rental with companions, trip, and vouchers
   */
  async getCarRentalWithDetails(carRentalId) {
    try {
      return await this.getItemWithAssociations(carRentalId);
    } catch (error) {
      logger.error('Error loading car rental with details:', error);
      throw error;
    }
  }

  /**
   * Prepare car rental data for creation/update
   * Handles car rental-specific: datetime parsing, timezone conversion, location geocoding
   * @param {Object} data - Raw car rental data
   * @returns {Promise<Object>} Processed car rental data
   */
  async prepareCarRentalData(data) {
    try {
      return await this.prepareItemData(data, {
        // Parse pickup/dropoff dates and times into datetimes
        datePairs: ['pickup', 'dropoff'],
        // Sanitize timezone fields
        timezoneFields: ['pickupTimezone', 'dropoffTimezone'],
        // Geocode pickup and dropoff locations
        locationFields: ['pickupLocation', 'dropoffLocation'],
        // Convert datetimes to UTC using timezone
        dateTimeFields: ['pickupDateTime', 'dropoffDateTime'],
        tzPairs: ['pickupTimezone', 'dropoffTimezone'],
      });
    } catch (error) {
      logger.error('Error preparing car rental data:', error);
      throw error;
    }
  }
}

module.exports = CarRentalService;
