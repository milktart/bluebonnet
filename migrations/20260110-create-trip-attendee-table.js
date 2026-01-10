'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('trip_attendees', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
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
      userId: {
        type: Sequelize.UUID,
        allowNull: true, // Null until attendee creates account
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      role: {
        type: Sequelize.ENUM('owner', 'admin', 'attendee'),
        allowNull: false,
        defaultValue: 'attendee',
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
    await queryInterface.addIndex('trip_attendees', ['tripId']);
    await queryInterface.addIndex('trip_attendees', ['userId']);
    await queryInterface.addIndex('trip_attendees', ['email']);
    // Unique constraint: one entry per trip per user (if userId exists)
    await queryInterface.addIndex('trip_attendees', ['tripId', 'userId'], {
      unique: true,
      where: {
        userId: {
          [Sequelize.Op.ne]: null,
        },
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('trip_attendees');
  },
};
