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
    // If it exists with old schema, migrate data before sync
    try {
      const tables = await sequelize.getQueryInterface().showAllTables();
      if (tables.includes('companion_permissions')) {
        const columns = await sequelize.getQueryInterface().describeTable('companion_permissions');

        // If old schema exists (has ownerId and trustedUserId), migrate it
        if (columns.ownerId && columns.trustedUserId) {
          logger.info('Old companion_permissions schema detected, migrating data...');

          // Create new table with correct schema
          await sequelize.query(`
            CREATE TABLE IF NOT EXISTS companion_permissions_new (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              "companionId" UUID NOT NULL,
              "grantedBy" UUID NOT NULL,
              "canShareTrips" BOOLEAN NOT NULL DEFAULT false,
              "canManageTrips" BOOLEAN NOT NULL DEFAULT false,
              "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              CONSTRAINT fk_companion_permissions_new_companionId
                FOREIGN KEY ("companionId") REFERENCES travel_companions(id) ON DELETE CASCADE,
              CONSTRAINT fk_companion_permissions_new_grantedBy
                FOREIGN KEY ("grantedBy") REFERENCES users(id) ON DELETE CASCADE,
              CONSTRAINT uq_companion_permissions_new_companionId_grantedBy
                UNIQUE ("companionId", "grantedBy")
            )
          `);

          // Migrate data if there are any records
          const countResult = await sequelize.query(
            'SELECT COUNT(*) as count FROM companion_permissions',
            { type: sequelize.QueryTypes.SELECT }
          );

          if (countResult[0].count > 0) {
            logger.info(`Migrating ${countResult[0].count} companion permission records...`);

            // Try to migrate existing data
            try {
              await sequelize.query(`
                INSERT INTO companion_permissions_new (id, "companionId", "grantedBy", "canShareTrips", "canManageTrips", "createdAt", "updatedAt")
                SELECT
                  gen_random_uuid(),
                  tc.id,
                  cp."ownerId",
                  cp."canViewAllTrips",
                  cp."canManageAllTrips",
                  cp."createdAt",
                  cp."updatedAt"
                FROM companion_permissions cp
                JOIN travel_companions tc ON tc."userId" = cp."trustedUserId" AND tc."createdBy" = cp."ownerId"
                ON CONFLICT DO NOTHING
              `);
              logger.info('Data migration completed');
            } catch (migrateError) {
              logger.warn(
                'Could not migrate old data (may not have matching companions):',
                migrateError.message
              );
            }
          }

          // Drop old table and rename new one
          await sequelize.query('DROP TABLE IF EXISTS companion_permissions CASCADE');
          await sequelize.query(
            'ALTER TABLE companion_permissions_new RENAME TO companion_permissions'
          );

          // Recreate indexes
          await sequelize.query(
            'CREATE INDEX idx_companion_permissions_companionId ON companion_permissions("companionId")'
          );
          await sequelize.query(
            'CREATE INDEX idx_companion_permissions_grantedBy ON companion_permissions("grantedBy")'
          );

          logger.info('Companion_permissions table migration completed');
        } else if (columns.companionId && !columns.grantedBy) {
          // Partial new schema detected - likely from incomplete alter
          logger.warn(
            'Partial companion_permissions schema detected, will attempt to repair via sync'
          );
        }
      }
    } catch (tableCheckError) {
      logger.warn('Could not check companion_permissions table:', tableCheckError.message);
      // Continue anyway - might not exist yet
    }

    // Drop voucher_attachments table if it exists (due to Sequelize ENUM alter issue)
    // This table will be recreated by sync with the correct schema
    try {
      const tables = await sequelize.getQueryInterface().showAllTables();
      if (tables.includes('voucher_attachments')) {
        logger.info('Dropping voucher_attachments table to recreate with correct schema...');
        await sequelize.query('DROP TABLE IF EXISTS voucher_attachments CASCADE');
      }
    } catch (tableCheckError) {
      logger.warn('Could not check voucher_attachments table:', tableCheckError.message);
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
