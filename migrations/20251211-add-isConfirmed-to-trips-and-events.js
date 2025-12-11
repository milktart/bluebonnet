'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add isConfirmed column to trips table
    await queryInterface.addColumn('trips', 'isConfirmed', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });

    // Add isConfirmed column to events table
    await queryInterface.addColumn('events', 'isConfirmed', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove isConfirmed column from trips table
    await queryInterface.removeColumn('trips', 'isConfirmed');

    // Remove isConfirmed column from events table
    await queryInterface.removeColumn('events', 'isConfirmed');
  },
};
