/**
 * Hotel Service
 * Extends TravelItemService with hotel-specific business logic
 * Handles hotel creation, updates, and retrieval with all related data
 */

const TravelItemService = require('./TravelItemService');
const logger = require('../utils/logger');
const geocodingService = require('./geocodingService');

class HotelService extends TravelItemService {
  constructor(Hotel) {
    super(Hotel, 'Hotel', 'hotel');
  }

  /**
   * Create a new hotel
   * @param {Object} data - Hotel data (should be processed by prepareItemData first)
   * @param {string} userId - User ID of hotel owner
   * @param {Object} options - Creation options
   * @returns {Promise<Object>} Created hotel
   */
  async createHotel(data, userId, options = {}) {
    try {
      return await this.createItem(data, userId, options);
    } catch (error) {
      logger.error('Error creating hotel:', error);
      throw error;
    }
  }

  /**
   * Update an existing hotel
   * @param {Object} hotel - Hotel instance
   * @param {Object} data - Updated hotel data
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Updated hotel
   */
  async updateHotel(hotel, data, options = {}) {
    try {
      return await this.updateItem(hotel, data, options);
    } catch (error) {
      logger.error('Error updating hotel:', error);
      throw error;
    }
  }

  /**
   * Delete a hotel
   * @param {Object} hotel - Hotel instance
   * @returns {Promise<void>}
   */
  async deleteHotel(hotel) {
    try {
      return await this.deleteItem(hotel);
    } catch (error) {
      logger.error('Error deleting hotel:', error);
      throw error;
    }
  }

  /**
   * Restore a deleted hotel
   * @param {Object} hotel - Hotel instance
   * @returns {Promise<Object>} Restored hotel
   */
  async restoreHotel(hotel) {
    try {
      return await this.restoreItem(hotel);
    } catch (error) {
      logger.error('Error restoring hotel:', error);
      throw error;
    }
  }

  /**
   * Get hotel with all related data
   * @param {string} hotelId - Hotel ID
   * @returns {Promise<Object>} Hotel with companions, trip, and vouchers
   */
  async getHotelWithDetails(hotelId) {
    try {
      return await this.getItemWithAssociations(hotelId);
    } catch (error) {
      logger.error('Error loading hotel with details:', error);
      throw error;
    }
  }

  /**
   * Prepare hotel data for creation/update
   * Handles hotel-specific: datetime parsing, timezone conversion, address geocoding
   * @param {Object} data - Raw hotel data
   * @returns {Promise<Object>} Processed hotel data
   */
  async prepareHotelData(data) {
    try {
      return await this.prepareItemData(data, {
        // Parse check-in/out dates and times into datetimes
        datePairs: ['checkIn', 'checkOut'],
        // Sanitize timezone fields
        timezoneFields: ['checkInTimezone', 'checkOutTimezone'],
        // Geocode address as location
        locationFields: ['address'],
        geocodeService: geocodingService,
        // Convert datetimes to UTC using timezone
        dateTimeFields: ['checkInDateTime', 'checkOutDateTime'],
        tzPairs: ['checkInTimezone', 'checkOutTimezone'],
      });
    } catch (error) {
      logger.error('Error preparing hotel data:', error);
      throw error;
    }
  }
}

module.exports = HotelService;
