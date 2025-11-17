/**
 * Base Service Class
 * Provides common database operations and patterns for all services
 * Phase 3 - Service Layer Pattern
 */

const logger = require('../utils/logger');

class BaseService {
  constructor(model, modelName) {
    this.model = model;
    this.modelName = modelName;
  }

  /**
   * Find a record by ID
   * @param {string|number} id - Record ID
   * @param {Object} options - Sequelize query options
   * @returns {Promise<Object|null>}
   */
  async findById(id, options = {}) {
    try {
      return await this.model.findByPk(id, options);
    } catch (error) {
      logger.error(`Error finding ${this.modelName} by ID:`, error);
      throw error;
    }
  }

  /**
   * Find one record by criteria
   * @param {Object} where - Sequelize where clause
   * @param {Object} options - Additional query options
   * @returns {Promise<Object|null>}
   */
  async findOne(where, options = {}) {
    try {
      return await this.model.findOne({ where, ...options });
    } catch (error) {
      logger.error(`Error finding ${this.modelName}:`, error);
      throw error;
    }
  }

  /**
   * Find all records matching criteria
   * @param {Object} where - Sequelize where clause
   * @param {Object} options - Additional query options
   * @returns {Promise<Array>}
   */
  async findAll(where = {}, options = {}) {
    try {
      return await this.model.findAll({ where, ...options });
    } catch (error) {
      logger.error(`Error finding all ${this.modelName}:`, error);
      throw error;
    }
  }

  /**
   * Create a new record
   * @param {Object} data - Record data
   * @param {Object} options - Sequelize options
   * @returns {Promise<Object>}
   */
  async create(data, options = {}) {
    try {
      const record = await this.model.create(data, options);
      logger.info(`${this.modelName} created:`, { id: record.id });
      return record;
    } catch (error) {
      logger.error(`Error creating ${this.modelName}:`, error);
      throw error;
    }
  }

  /**
   * Update a record
   * @param {Object} record - Record instance to update
   * @param {Object} data - Updated data
   * @returns {Promise<Object>}
   */
  async update(record, data) {
    try {
      await record.update(data);
      logger.info(`${this.modelName} updated:`, { id: record.id });
      return record;
    } catch (error) {
      logger.error(`Error updating ${this.modelName}:`, error);
      throw error;
    }
  }

  /**
   * Delete a record
   * @param {Object} record - Record instance to delete
   * @returns {Promise<void>}
   */
  async delete(record) {
    try {
      await record.destroy();
      logger.info(`${this.modelName} deleted:`, { id: record.id });
    } catch (error) {
      logger.error(`Error deleting ${this.modelName}:`, error);
      throw error;
    }
  }

  /**
   * Count records matching criteria
   * @param {Object} where - Sequelize where clause
   * @returns {Promise<number>}
   */
  async count(where = {}) {
    try {
      return await this.model.count({ where });
    } catch (error) {
      logger.error(`Error counting ${this.modelName}:`, error);
      throw error;
    }
  }

  /**
   * Check if a record exists
   * @param {Object} where - Sequelize where clause
   * @returns {Promise<boolean>}
   */
  async exists(where) {
    try {
      const count = await this.count(where);
      return count > 0;
    } catch (error) {
      logger.error(`Error checking ${this.modelName} existence:`, error);
      throw error;
    }
  }

  /**
   * Verify record ownership
   * @param {Object} record - Record instance
   * @param {string|number} userId - User ID to verify
   * @returns {boolean}
   */
  static verifyOwnership(record, userId) {
    if (!record) return false;
    return record.userId === userId;
  }

  /**
   * Find and verify ownership in one call
   * @param {string|number} id - Record ID
   * @param {string|number} userId - User ID to verify
   * @param {Object} options - Additional query options
   * @returns {Promise<Object|null>}
   */
  async findByIdAndVerifyOwnership(id, userId, options = {}) {
    const record = await this.findById(id, options);

    if (!record) {
      logger.warn(`${this.modelName} not found:`, { id });
      return null;
    }

    if (!BaseService.verifyOwnership(record, userId)) {
      logger.warn(`${this.modelName} ownership verification failed:`, { id, userId });
      return null;
    }

    return record;
  }
}

module.exports = BaseService;
