'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add userId column to hotels table (initially nullable)
    await queryInterface.addColumn('hotels', 'userId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    });

    // Add userId column to car_rentals table (initially nullable)
    await queryInterface.addColumn('car_rentals', 'userId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    });

    // Populate userId from the trip relationship if available
    // For hotels with trips, get userId from the trip owner
    await queryInterface.sequelize.query(`
      UPDATE hotels
      SET "userId" = trips."userId"
      FROM trips
      WHERE hotels."tripId" = trips.id
      AND hotels."userId" IS NULL
    `);

    // For car_rentals with trips, get userId from the trip owner
    await queryInterface.sequelize.query(`
      UPDATE car_rentals
      SET "userId" = trips."userId"
      FROM trips
      WHERE car_rentals."tripId" = trips.id
      AND car_rentals."userId" IS NULL
    `);

    // Note: Hotels and car_rentals without a trip association will still have NULL userId
    // These are data inconsistencies that should be cleaned up manually if needed
  },

  down: async (queryInterface, Sequelize) => {
    // Remove userId column from hotels table
    await queryInterface.removeColumn('hotels', 'userId');

    // Remove userId column from car_rentals table
    await queryInterface.removeColumn('car_rentals', 'userId');
  },
};
