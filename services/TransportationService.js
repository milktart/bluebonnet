/**
 * Transportation Service
 * Extends TravelItemService with transportation-specific business logic
 * Handles transportation creation, updates, and retrieval with all related data
 */

const TravelItemService = require('./TravelItemService');
const logger = require('../utils/logger');

class TransportationService extends TravelItemService {
  constructor(Transportation) {
    super(Transportation, 'Transportation', 'transportation');
  }

  /**
   * Create a new transportation item
   * @param {Object} data - Transportation data (should be processed by prepareItemData first)
   * @param {string} userId - User ID of transportation owner
   * @param {Object} options - Creation options
   * @returns {Promise<Object>} Created transportation
   */
  async createTransportation(data, userId, options = {}) {
    try {
      return await this.createItem(data, userId, options);
    } catch (error) {
      logger.error('Error creating transportation:', error);
      throw error;
    }
  }

  /**
   * Update an existing transportation item
   * @param {Object} transportation - Transportation instance
   * @param {Object} data - Updated transportation data
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Updated transportation
   */
  async updateTransportation(transportation, data, options = {}) {
    try {
      return await this.updateItem(transportation, data, options);
    } catch (error) {
      logger.error('Error updating transportation:', error);
      throw error;
    }
  }

  /**
   * Delete a transportation item
   * @param {Object} transportation - Transportation instance
   * @returns {Promise<void>}
   */
  async deleteTransportation(transportation) {
    try {
      return await this.deleteItem(transportation);
    } catch (error) {
      logger.error('Error deleting transportation:', error);
      throw error;
    }
  }

  /**
   * Restore a deleted transportation item
   * @param {Object} transportation - Transportation instance
   * @returns {Promise<Object>} Restored transportation
   */
  async restoreTransportation(transportation) {
    try {
      return await this.restoreItem(transportation);
    } catch (error) {
      logger.error('Error restoring transportation:', error);
      throw error;
    }
  }

  /**
   * Get transportation with all related data
   * @param {string} transportationId - Transportation ID
   * @returns {Promise<Object>} Transportation with companions, trip, and vouchers
   */
  async getTransportationWithDetails(transportationId) {
    try {
      return await this.getItemWithAssociations(transportationId);
    } catch (error) {
      logger.error('Error loading transportation with details:', error);
      throw error;
    }
  }

  /**
   * Prepare transportation data for creation/update
   * Handles transportation-specific: datetime parsing, timezone conversion, location geocoding
   * @param {Object} data - Raw transportation data
   * @returns {Promise<Object>} Processed transportation data
   */
  async prepareTransportationData(data) {
    try {
      return await this.prepareItemData(data, {
        // Parse departure/arrival dates and times into datetimes
        datePairs: ['departure', 'arrival'],
        // Sanitize timezone fields
        timezoneFields: ['originTimezone', 'destinationTimezone'],
        // Geocode origin and destination
        locationFields: ['origin', 'destination'],
        // Convert datetimes to UTC using timezone
        dateTimeFields: ['departureDateTime', 'arrivalDateTime'],
        tzPairs: ['originTimezone', 'destinationTimezone'],
      });
    } catch (error) {
      logger.error('Error preparing transportation data:', error);
      throw error;
    }
  }
}

module.exports = TransportationService;
