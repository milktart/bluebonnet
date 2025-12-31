module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('travel_companions', 'firstName', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('travel_companions', 'lastName', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('travel_companions', 'firstName');
    await queryInterface.removeColumn('travel_companions', 'lastName');
  },
};
