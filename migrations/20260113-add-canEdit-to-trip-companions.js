'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Check if column already exists
      const table = await queryInterface.describeTable('trip_companions', { transaction });
      if (!table.canEdit) {
        // Add canEdit column
        await queryInterface.addColumn(
          'trip_companions',
          'canEdit',
          {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          { transaction }
        );
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Check if column exists before removing
      const table = await queryInterface.describeTable('trip_companions', { transaction });
      if (table.canEdit) {
        await queryInterface.removeColumn('trip_companions', 'canEdit', { transaction });
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
