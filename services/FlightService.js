/**
 * Flight Service
 * Extends TravelItemService with flight-specific business logic
 * Handles flight creation, updates, and retrieval with all related data
 */

const TravelItemService = require('./TravelItemService');
const logger = require('../utils/logger');
const airportService = require('./airportService');

class FlightService extends TravelItemService {
  constructor(Flight) {
    super(Flight, 'Flight', 'flight');
  }

  /**
   * Create a new flight
   * @param {Object} data - Flight data (should be processed by prepareItemData first)
   * @param {string} userId - User ID of flight owner
   * @param {Object} options - Creation options
   * @returns {Promise<Object>} Created flight
   */
  async createFlight(data, userId, options = {}) {
    try {
      return await this.createItem(data, userId, options);
    } catch (error) {
      logger.error('Error creating flight:', error);
      throw error;
    }
  }

  /**
   * Update an existing flight
   * @param {Object} flight - Flight instance
   * @param {Object} data - Updated flight data
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Updated flight
   */
  async updateFlight(flight, data, options = {}) {
    try {
      return await this.updateItem(flight, data, options);
    } catch (error) {
      logger.error('Error updating flight:', error);
      throw error;
    }
  }

  /**
   * Delete a flight
   * @param {Object} flight - Flight instance
   * @returns {Promise<void>}
   */
  async deleteFlight(flight) {
    try {
      return await this.deleteItem(flight);
    } catch (error) {
      logger.error('Error deleting flight:', error);
      throw error;
    }
  }

  /**
   * Restore a deleted flight
   * @param {Object} flight - Flight instance
   * @returns {Promise<Object>} Restored flight
   */
  async restoreFlight(flight) {
    try {
      return await this.restoreItem(flight);
    } catch (error) {
      logger.error('Error restoring flight:', error);
      throw error;
    }
  }

  /**
   * Get flight with all related data
   * @param {string} flightId - Flight ID
   * @returns {Promise<Object>} Flight with companions, trip, and vouchers
   */
  async getFlightWithDetails(flightId) {
    try {
      return await this.getItemWithAssociations(flightId);
    } catch (error) {
      logger.error('Error loading flight with details:', error);
      throw error;
    }
  }

  /**
   * Prepare flight data for creation/update
   * Handles flight-specific: datetime parsing, timezone conversion, airport geocoding
   * @param {Object} data - Raw flight data
   * @returns {Promise<Object>} Processed flight data
   */
  async prepareFlightData(data) {
    try {
      return await this.prepareItemData(data, {
        // Parse departure/arrival dates and times into datetimes
        datePairs: ['departure', 'arrival'],
        // Sanitize timezone fields
        timezoneFields: ['originTimezone', 'destinationTimezone'],
        // Geocode origin and destination as airport locations
        locationFields: ['origin', 'destination'],
        geocodeService: airportService,
        // Convert datetimes to UTC using timezone
        dateTimeFields: ['departureDateTime', 'arrivalDateTime'],
        tzPairs: ['originTimezone', 'destinationTimezone'],
      });
    } catch (error) {
      logger.error('Error preparing flight data:', error);
      throw error;
    }
  }
}

module.exports = FlightService;
