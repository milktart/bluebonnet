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

    // Handle companion_permissions table specially
    // If it exists with mixed/problematic schema, drop it for fresh creation
    try {
      const tables = await sequelize.showAllTables();
      if (tables.includes('companion_permissions')) {
        const columns = await sequelize.describeTable('companion_permissions');

        // If old schema exists (has ownerId) OR if new schema has null values in companionId
        // Drop the table so sync can recreate it cleanly
        const hasOldSchema = columns.ownerId && columns.trustedUserId;
        const hasProblematicSchema = columns.companionId || columns.grantedBy;

        if (hasOldSchema || hasProblematicSchema) {
          logger.info('Companion_permissions table needs recreation, dropping...');
          await sequelize.query('DROP TABLE IF EXISTS companion_permissions CASCADE');
          logger.info('Dropped companion_permissions table for clean recreation');
        }
      }
    } catch (tableCheckError) {
      logger.warn('Could not check companion_permissions table:', tableCheckError.message);
      // Continue anyway - might not exist yet
    }

    // Sync all models with alter:true to update existing tables
    // This creates new tables and alters existing ones to match models
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
