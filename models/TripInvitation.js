const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TripInvitation = sequelize.define(
    'TripInvitation',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      tripId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'trips',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      invitedUserId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      invitedByUserId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      status: {
        type: DataTypes.ENUM('pending', 'joined', 'declined'),
        allowNull: false,
        defaultValue: 'pending',
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
      respondedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
    },
    {
      tableName: 'trip_invitations',
      indexes: [
        {
          fields: ['tripId'],
        },
        {
          fields: ['invitedUserId'],
        },
        {
          fields: ['invitedByUserId'],
        },
        {
          fields: ['status'],
        },
        {
          fields: ['tripId', 'invitedUserId'],
          unique: true,
        },
      ],
    }
  );

  TripInvitation.associate = (models) => {
    TripInvitation.belongsTo(models.Trip, {
      foreignKey: 'tripId',
      as: 'trip',
      onDelete: 'CASCADE',
    });

    TripInvitation.belongsTo(models.User, {
      foreignKey: 'invitedUserId',
      as: 'invitedUser',
      onDelete: 'CASCADE',
    });

    TripInvitation.belongsTo(models.User, {
      foreignKey: 'invitedByUserId',
      as: 'invitedByUser',
      onDelete: 'CASCADE',
    });
  };

  return TripInvitation;
};
