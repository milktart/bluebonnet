/**
 * Event Service
 * Extends TravelItemService with event-specific business logic
 * Handles event creation, updates, and retrieval with all related data
 */

const TravelItemService = require('./TravelItemService');
const logger = require('../utils/logger');

class EventService extends TravelItemService {
  constructor(Event) {
    super(Event, 'Event', 'event');
  }

  /**
   * Create a new event
   * @param {Object} data - Event data (should be processed by prepareItemData first)
   * @param {string} userId - User ID of event owner
   * @param {Object} options - Creation options
   * @returns {Promise<Object>} Created event
   */
  async createEvent(data, userId, options = {}) {
    try {
      return await this.createItem(data, userId, options);
    } catch (error) {
      logger.error('Error creating event:', error);
      throw error;
    }
  }

  /**
   * Update an existing event
   * @param {Object} event - Event instance
   * @param {Object} data - Updated event data
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Updated event
   */
  async updateEvent(event, data, options = {}) {
    try {
      return await this.updateItem(event, data, options);
    } catch (error) {
      logger.error('Error updating event:', error);
      throw error;
    }
  }

  /**
   * Delete an event
   * @param {Object} event - Event instance
   * @returns {Promise<void>}
   */
  async deleteEvent(event) {
    try {
      return await this.deleteItem(event);
    } catch (error) {
      logger.error('Error deleting event:', error);
      throw error;
    }
  }

  /**
   * Restore a deleted event
   * @param {Object} event - Event instance
   * @returns {Promise<Object>} Restored event
   */
  async restoreEvent(event) {
    try {
      return await this.restoreItem(event);
    } catch (error) {
      logger.error('Error restoring event:', error);
      throw error;
    }
  }

  /**
   * Get event with all related data
   * @param {string} eventId - Event ID
   * @returns {Promise<Object>} Event with companions, trip, and vouchers
   */
  async getEventWithDetails(eventId) {
    try {
      return await this.getItemWithAssociations(eventId);
    } catch (error) {
      logger.error('Error loading event with details:', error);
      throw error;
    }
  }

  /**
   * Prepare event data for creation/update
   * Handles event-specific: datetime parsing, timezone conversion, location geocoding
   * @param {Object} data - Raw event data
   * @returns {Promise<Object>} Processed event data
   */
  async prepareEventData(data) {
    try {
      return await this.prepareItemData(data, {
        // Parse start/end dates and times into datetimes
        datePairs: ['start', 'end'],
        // Sanitize timezone fields
        timezoneFields: ['startTimezone', 'endTimezone'],
        // Geocode location
        locationFields: ['location'],
        // Convert datetimes to UTC using timezone
        dateTimeFields: ['startDateTime', 'endDateTime'],
        tzPairs: ['startTimezone', 'endTimezone'],
      });
    } catch (error) {
      logger.error('Error preparing event data:', error);
      throw error;
    }
  }
}

module.exports = EventService;
