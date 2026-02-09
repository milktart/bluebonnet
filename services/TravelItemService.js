/**
 * Travel Item Service Base Class
 * Extends BaseService with common logic for all travel items
 * Handles: creation, updates, geocoding, timezone conversion, companions
 */

const BaseService = require('./BaseService');
const logger = require('../utils/logger');
const DateTimeService = require('./DateTimeService');
const { geocodeWithAirportFallback } = require('../controllers/helpers/resourceController');
const itemCompanionService = require('./itemCompanionService');
const itemTripService = require('./itemTripService');

class TravelItemService extends BaseService {
  constructor(model, modelName, itemType) {
    super(model, modelName);
    this.itemType = itemType;
  }

  /**
   * Process and prepare item data for creation/update
   * Handles: datetime parsing, timezone sanitization, geocoding
   * @param {Object} data - Raw item data from request
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Processed item data ready for database
   */
  async prepareItemData(data, options = {}) {
    try {
      let processedData = { ...data };

      // 1. Combine and parse datetime fields if needed
      if (options.datePairs) {
        processedData = DateTimeService.combineDateTimeFields(processedData, options.datePairs);
      }

      // 2. Sanitize timezone fields
      if (options.timezoneFields) {
        processedData = DateTimeService.sanitizeTimezones(processedData, options.timezoneFields);
      }

      // 3. Geocode location fields if needed
      if (options.locationFields && options.geocodeService) {
        for (const locField of options.locationFields) {
          const tzField = options.timezoneFields?.[options.locationFields.indexOf(locField)];
          const location = processedData[locField];

          if (location) {
            const geocodeResult = await geocodeWithAirportFallback(
              location,
              options.geocodeService,
              processedData[tzField]
            );

            // Update location and timezone from geocoding result
            processedData[locField] = geocodeResult.formattedLocation;

            const tzKey = locField.replace('Location', 'Timezone');
            if (!processedData[tzKey]) {
              processedData[tzKey] = geocodeResult.timezone;
            }

            // Store coordinates
            const latKey = locField.replace('Location', 'Lat');
            const lngKey = locField.replace('Location', 'Lng');
            if (geocodeResult.coords) {
              processedData[latKey] = geocodeResult.coords.lat;
              processedData[lngKey] = geocodeResult.coords.lng;
            }
          }
        }
      }

      // 4. Convert datetimes to UTC
      if (options.dateTimeFields && options.tzPairs) {
        options.dateTimeFields.forEach((dtField, index) => {
          const tzField = options.tzPairs[index];

          if (processedData[dtField]) {
            processedData[dtField] = DateTimeService.convertToUTC(
              processedData[dtField],
              processedData[tzField]
            );
          }
        });
      }

      return processedData;
    } catch (error) {
      logger.error(`Error preparing ${this.modelName} data:`, error);
      throw error;
    }
  }

  /**
   * Create a new travel item with optional trip association and companions
   * @param {Object} data - Item data (already processed by prepareItemData)
   * @param {string} userId - User ID of item owner
   * @param {Object} options - Creation options
   * @param {string} options.tripId - Optional trip ID to associate with
   * @param {Array} options.companions - Optional companion IDs to add
   * @returns {Promise<Object>} Created item with trip and companions
   */
  async createItem(data, userId, options = {}) {
    try {
      // Create the item
      const itemData = {
        ...data,
        userId,
      };

      const item = await this.create(itemData);

      // Add to trip if tripId provided
      if (options.tripId) {
        await itemTripService.addItemToTrip(this.itemType, item.id, options.tripId, userId);
      }

      // Add companions if provided
      if (options.companions && options.companions.length > 0) {
        for (const companionId of options.companions) {
          await itemCompanionService.addCompanionToItem(
            item.id,
            this.itemType,
            companionId,
            userId
          );
        }
      }

      logger.info(`${this.modelName} created successfully - ID: ${item.id}, UserID: ${userId}`);

      return item;
    } catch (error) {
      logger.error(`Error creating ${this.modelName}:`, error);
      throw error;
    }
  }

  /**
   * Update an existing travel item
   * @param {Object} item - Item instance to update
   * @param {Object} data - Update data (already processed by prepareItemData)
   * @param {Object} options - Update options
   * @param {Array} options.companions - Optional updated companion list
   * @returns {Promise<Object>} Updated item
   */
  async updateItem(item, data, options = {}) {
    try {
      const updatedItem = await this.update(item, data);

      // Update companions if provided
      if (options.companions) {
        // Get current companions
        const currentCompanions = await itemCompanionService.getItemCompanions(
          item.id,
          this.itemType
        );

        const currentIds = new Set(currentCompanions.map((c) => c.companionId));
        const newIds = new Set(options.companions);

        // Add new companions
        for (const companionId of newIds) {
          if (!currentIds.has(companionId)) {
            await itemCompanionService.addCompanionToItem(
              item.id,
              this.itemType,
              companionId,
              item.userId
            );
          }
        }

        // Remove companions not in new list
        for (const companionId of currentIds) {
          if (!newIds.has(companionId)) {
            await itemCompanionService.removeCompanionFromItem(item.id, this.itemType, companionId);
          }
        }
      }

      logger.info(`${this.modelName} updated successfully - ID: ${item.id}`);

      return updatedItem;
    } catch (error) {
      logger.error(`Error updating ${this.modelName}:`, error);
      throw error;
    }
  }

  /**
   * Delete a travel item and cascade delete relationships
   * @param {Object} item - Item instance to delete
   * @returns {Promise<void>}
   */
  async deleteItem(item) {
    try {
      // Remove from trips
      await itemTripService.removeItemFromAllTrips(this.itemType, item.id);

      // Remove companions
      await itemCompanionService.removeCompanionFromItem(item.id, this.itemType);

      // Delete the item
      await this.delete(item);

      logger.info(`${this.modelName} deleted successfully - ID: ${item.id}`);
    } catch (error) {
      logger.error(`Error deleting ${this.modelName}:`, error);
      throw error;
    }
  }

  /**
   * Restore a soft-deleted travel item
   * @param {Object} item - Item instance to restore
   * @returns {Promise<Object>} Restored item
   */
  async restoreItem(item) {
    try {
      // Restore the item (implementation depends on soft delete implementation)
      const restored = await this.update(item, {
        deletedAt: null,
      });

      logger.info(`${this.modelName} restored successfully - ID: ${item.id}`);

      return restored;
    } catch (error) {
      logger.error(`Error restoring ${this.modelName}:`, error);
      throw error;
    }
  }

  /**
   * Get item with all associations
   * @param {string} itemId - Item ID
   * @returns {Promise<Object>} Item with companions, trip, and vouchers
   */
  async getItemWithAssociations(itemId) {
    try {
      const item = await this.findById(itemId);

      if (!item) {
        return null;
      }

      // Load companions
      const companions = await itemCompanionService.getItemCompanions(itemId, this.itemType);

      // Load trip association
      const tripAssociation = await itemTripService.getItemTrip(itemId, this.itemType);

      return {
        ...item.toJSON(),
        companions,
        trip: tripAssociation,
      };
    } catch (error) {
      logger.error(`Error loading ${this.modelName} with associations:`, error);
      throw error;
    }
  }
}

module.exports = TravelItemService;
