/**
 * Base Service Class
 * Provides common database operations and patterns for all services
 * Phase 3 - Service Layer Pattern
 */

import { Model, FindOptions } from 'sequelize';
import logger from '../utils/logger';

export interface IBaseService<T extends Model = Model> {
  findById(id: string | number, options?: FindOptions): Promise<T | null>;
  findOne(where: Record<string, any>, options?: FindOptions): Promise<T | null>;
  findAll(where?: Record<string, any>, options?: FindOptions): Promise<T[]>;
  create(data: Record<string, any>, options?: Record<string, any>): Promise<T>;
  update(record: T, data: Record<string, any>): Promise<T>;
  delete(record: T): Promise<void>;
  count(where?: Record<string, any>): Promise<number>;
  exists(where: Record<string, any>): Promise<boolean>;
  findByIdAndVerifyOwnership(id: string | number, userId: string | number, options?: FindOptions): Promise<T | null>;
}

export class BaseService<T extends Model = Model> implements IBaseService<T> {
  constructor(protected model: typeof Model, protected modelName: string) {}

  /**
   * Find a record by ID
   * @param {string|number} id - Record ID
   * @param {Object} options - Sequelize query options
   * @returns {Promise<Object|null>}
   */
  async findById(id: string | number, options: FindOptions = {}): Promise<T | null> {
    try {
      return (await (this.model as any).findByPk(id, options)) || null;
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
  async findOne(where: Record<string, any>, options: FindOptions = {}): Promise<T | null> {
    try {
      return (await (this.model as any).findOne({ where, ...options })) || null;
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
  async findAll(where: Record<string, any> = {}, options: FindOptions = {}): Promise<T[]> {
    try {
      return await (this.model as any).findAll({ where, ...options });
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
  async create(data: Record<string, any>, options: Record<string, any> = {}): Promise<T> {
    try {
      const record = await (this.model as any).create(data, options);
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
  async update(record: T, data: Record<string, any>): Promise<T> {
    try {
      await (record as any).update(data);
      logger.info(`${this.modelName} updated:`, { id: (record as any).id });
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
  async delete(record: T): Promise<void> {
    try {
      await (record as any).destroy();
      logger.info(`${this.modelName} deleted:`, { id: (record as any).id });
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
  async count(where: Record<string, any> = {}): Promise<number> {
    try {
      return await (this.model as any).count({ where });
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
  async exists(where: Record<string, any>): Promise<boolean> {
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
  static verifyOwnership(record: any, userId: string | number): boolean {
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
  async findByIdAndVerifyOwnership(
    id: string | number,
    userId: string | number,
    options: FindOptions = {}
  ): Promise<T | null> {
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

export default BaseService;
