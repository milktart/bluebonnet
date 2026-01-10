'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('item_trips', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      itemId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      itemType: {
        type: Sequelize.ENUM('flight', 'hotel', 'event', 'transportation', 'car_rental'),
        allowNull: false,
      },
      tripId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'trips',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add indexes
    await queryInterface.addIndex('item_trips', ['itemId', 'itemType']);
    await queryInterface.addIndex('item_trips', ['tripId']);
    // Unique constraint: each item in trip only once
    await queryInterface.addIndex('item_trips', ['itemId', 'itemType', 'tripId'], {
      unique: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('item_trips');
  },
};
