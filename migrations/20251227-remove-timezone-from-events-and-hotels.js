'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove timezone column from events table
    await queryInterface.removeColumn('events', 'timezone');

    // Remove timezone column from hotels table
    await queryInterface.removeColumn('hotels', 'timezone');
  },

  down: async (queryInterface, Sequelize) => {
    // Add timezone column back to events table
    await queryInterface.addColumn('events', 'timezone', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // Add timezone column back to hotels table
    await queryInterface.addColumn('hotels', 'timezone', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
};
