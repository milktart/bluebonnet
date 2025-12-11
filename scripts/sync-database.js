/**
 * Database Sync Script
 * Auto-creates all tables from Sequelize models
 * For development use only - use migrations in production
 */

const { sequelize } = require('../models');
const logger = require('../utils/logger');

async function syncDatabase() {
  try {
    logger.info('Starting database sync...');

    // Force sync - drops existing tables and recreates them
    // WARNING: This will delete all data!
    await sequelize.sync({ force: false, alter: true });

    logger.info('Database sync completed successfully');
    logger.info('All tables have been created from models');

    process.exit(0);
  } catch (error) {
    logger.error('Database sync failed', { error: error.message });
    process.exit(1);
  }
}

syncDatabase();
