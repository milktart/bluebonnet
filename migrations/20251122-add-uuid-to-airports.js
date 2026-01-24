/**
 * Migration: Add UUID primary key to airports table
 *
 * This migration:
 * 1. Adds a new 'id' column with UUID type
 * 2. Generates UUIDs for all existing airports
 * 3. Drops the old primary key constraint on 'iata'
 * 4. Sets 'id' as the new primary key
 * 5. Adds a unique index on 'iata'
 *
 * Note: No foreign key constraints exist on airports table,
 * so this migration is safe without cascading updates.
 */

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Step 1: Add new UUID column (nullable initially)
      await queryInterface.addColumn(
        'airports',
        'id',
        {
          type: Sequelize.UUID,
          allowNull: true,
        },
        { transaction }
      );

      // Step 2: Generate UUIDs for all existing records
      const [airports] = await queryInterface.sequelize.query('SELECT iata FROM airports', {
        transaction,
      });

      for (const airport of airports) {
        await queryInterface.sequelize.query('UPDATE airports SET id = :uuid WHERE iata = :iata', {
          replacements: { uuid: uuidv4(), iata: airport.iata },
          transaction,
        });
      }

      // Step 3: Make id column non-nullable
      await queryInterface.changeColumn(
        'airports',
        'id',
        {
          type: Sequelize.UUID,
          allowNull: false,
        },
        { transaction }
      );

      // Step 4: Remove primary key constraint from iata
      await queryInterface.removeConstraint('airports', 'airports_pkey', { transaction });

      // Step 5: Add primary key constraint to id
      await queryInterface.addConstraint(
        'airports',
        {
          fields: ['id'],
          type: 'primary key',
          name: 'airports_pkey',
        },
        { transaction }
      );

      // Step 6: Add unique constraint to iata (if not already exists)
      await queryInterface.addConstraint(
        'airports',
        {
          fields: ['iata'],
          type: 'unique',
          name: 'airports_iata_unique',
        },
        { transaction }
      );

      // Step 7: Add index on iata for fast lookups
      await queryInterface.addIndex('airports', ['iata'], {
        name: 'idx_airports_iata',
        unique: true,
        transaction,
      });

      await transaction.commit();
      console.log('✓ Successfully migrated airports table to use UUID primary key');
    } catch (error) {
      await transaction.rollback();
      console.error('✗ Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Step 1: Remove index on iata
      await queryInterface.removeIndex('airports', 'idx_airports_iata', { transaction });

      // Step 2: Remove unique constraint on iata
      await queryInterface.removeConstraint('airports', 'airports_iata_unique', { transaction });

      // Step 3: Remove primary key constraint from id
      await queryInterface.removeConstraint('airports', 'airports_pkey', { transaction });

      // Step 4: Add primary key constraint back to iata
      await queryInterface.addConstraint(
        'airports',
        {
          fields: ['iata'],
          type: 'primary key',
          name: 'airports_pkey',
        },
        { transaction }
      );

      // Step 5: Drop id column
      await queryInterface.removeColumn('airports', 'id', { transaction });

      await transaction.commit();
      console.log('✓ Successfully rolled back airports table migration');
    } catch (error) {
      await transaction.rollback();
      console.error('✗ Rollback failed:', error);
      throw error;
    }
  },
};
