'use strict';

/**
 * Migration to:
 * 1. Remove tripId foreign key from item tables (Flight, Hotel, Event, Transportation, CarRental)
 * 2. Migrate existing item-trip relationships to item_trips junction table
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Migrate flights to item_trips
      await queryInterface.sequelize.query(
        `
        INSERT INTO item_trips (id, "itemId", "itemType", "tripId", "createdAt", "updatedAt")
        SELECT
          gen_random_uuid(),
          id,
          'flight',
          "tripId",
          NOW(),
          NOW()
        FROM flights
        WHERE "tripId" IS NOT NULL
        ON CONFLICT (id) DO NOTHING
        `,
        { transaction }
      );

      // Migrate hotels to item_trips
      await queryInterface.sequelize.query(
        `
        INSERT INTO item_trips (id, "itemId", "itemType", "tripId", "createdAt", "updatedAt")
        SELECT
          gen_random_uuid(),
          id,
          'hotel',
          "tripId",
          NOW(),
          NOW()
        FROM hotels
        WHERE "tripId" IS NOT NULL
        ON CONFLICT (id) DO NOTHING
        `,
        { transaction }
      );

      // Migrate events to item_trips
      await queryInterface.sequelize.query(
        `
        INSERT INTO item_trips (id, "itemId", "itemType", "tripId", "createdAt", "updatedAt")
        SELECT
          gen_random_uuid(),
          id,
          'event',
          "tripId",
          NOW(),
          NOW()
        FROM events
        WHERE "tripId" IS NOT NULL
        ON CONFLICT (id) DO NOTHING
        `,
        { transaction }
      );

      // Migrate transportation to item_trips
      await queryInterface.sequelize.query(
        `
        INSERT INTO item_trips (id, "itemId", "itemType", "tripId", "createdAt", "updatedAt")
        SELECT
          gen_random_uuid(),
          id,
          'transportation',
          "tripId",
          NOW(),
          NOW()
        FROM transportations
        WHERE "tripId" IS NOT NULL
        ON CONFLICT (id) DO NOTHING
        `,
        { transaction }
      );

      // Migrate car rentals to item_trips
      await queryInterface.sequelize.query(
        `
        INSERT INTO item_trips (id, "itemId", "itemType", "tripId", "createdAt", "updatedAt")
        SELECT
          gen_random_uuid(),
          id,
          'car_rental',
          "tripId",
          NOW(),
          NOW()
        FROM car_rentals
        WHERE "tripId" IS NOT NULL
        ON CONFLICT (id) DO NOTHING
        `,
        { transaction }
      );

      // Remove foreign key constraints and columns
      await queryInterface.removeConstraint('flights', 'flights_tripId_fkey', {
        transaction,
      });
      await queryInterface.removeColumn('flights', 'tripId', { transaction });

      await queryInterface.removeConstraint('hotels', 'hotels_tripId_fkey', {
        transaction,
      });
      await queryInterface.removeColumn('hotels', 'tripId', { transaction });

      await queryInterface.removeConstraint('events', 'events_tripId_fkey', {
        transaction,
      });
      await queryInterface.removeColumn('events', 'tripId', { transaction });

      await queryInterface.removeConstraint('transportations', 'transportations_tripId_fkey', {
        transaction,
      });
      await queryInterface.removeColumn('transportations', 'tripId', { transaction });

      await queryInterface.removeConstraint('car_rentals', 'car_rentals_tripId_fkey', {
        transaction,
      });
      await queryInterface.removeColumn('car_rentals', 'tripId', { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Re-add tripId column to all item tables
      await queryInterface.addColumn('flights', 'tripId', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'trips',
          key: 'id',
        },
        transaction,
      });

      await queryInterface.addColumn('hotels', 'tripId', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'trips',
          key: 'id',
        },
        transaction,
      });

      await queryInterface.addColumn('events', 'tripId', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'trips',
          key: 'id',
        },
        transaction,
      });

      await queryInterface.addColumn('transportations', 'tripId', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'trips',
          key: 'id',
        },
        transaction,
      });

      await queryInterface.addColumn('car_rentals', 'tripId', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'trips',
          key: 'id',
        },
        transaction,
      });

      // Restore data from item_trips
      await queryInterface.sequelize.query(
        `
        UPDATE flights f
        SET "tripId" = it."tripId"
        FROM item_trips it
        WHERE it."itemId" = f.id AND it."itemType" = 'flight'
        `,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `
        UPDATE hotels h
        SET "tripId" = it."tripId"
        FROM item_trips it
        WHERE it."itemId" = h.id AND it."itemType" = 'hotel'
        `,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `
        UPDATE events e
        SET "tripId" = it."tripId"
        FROM item_trips it
        WHERE it."itemId" = e.id AND it."itemType" = 'event'
        `,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `
        UPDATE transportations t
        SET "tripId" = it."tripId"
        FROM item_trips it
        WHERE it."itemId" = t.id AND it."itemType" = 'transportation'
        `,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `
        UPDATE car_rentals cr
        SET "tripId" = it."tripId"
        FROM item_trips it
        WHERE it."itemId" = cr.id AND it."itemType" = 'car_rental'
        `,
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
