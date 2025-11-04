const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Notification = sequelize.define(
    'Notification',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      type: {
        type: DataTypes.ENUM(
          'companion_request_received',
          'companion_request_accepted',
          'companion_request_declined',
          'trip_invitation_received',
          'trip_invitation_accepted',
          'trip_invitation_declined'
        ),
        allowNull: false,
      },
      relatedId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      relatedType: {
        type: DataTypes.ENUM(
          'companion_relationship',
          'trip_invitation'
        ),
        allowNull: true,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      actionRequired: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
    },
    {
      tableName: 'notifications',
      indexes: [
        {
          fields: ['userId'],
        },
        {
          fields: ['type'],
        },
        {
          fields: ['relatedId'],
        },
        {
          fields: ['read'],
        },
        {
          fields: ['userId', 'read'],
        },
      ],
    }
  );

  Notification.associate = (models) => {
    Notification.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE',
    });
  };

  return Notification;
};
