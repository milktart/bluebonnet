'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Make tripId nullable in hotels table
    await queryInterface.changeColumn('hotels', 'tripId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'trips',
        key: 'id',
      },
    });

    // Make tripId nullable in car_rentals table
    await queryInterface.changeColumn('car_rentals', 'tripId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'trips',
        key: 'id',
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert tripId to NOT NULL in hotels table
    await queryInterface.changeColumn('hotels', 'tripId', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'trips',
        key: 'id',
      },
    });

    // Revert tripId to NOT NULL in car_rentals table
    await queryInterface.changeColumn('car_rentals', 'tripId', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'trips',
        key: 'id',
      },
    });
  },
};
