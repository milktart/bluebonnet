const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CompanionRelationship = sequelize.define(
    'CompanionRelationship',
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
      companionUserId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      status: {
        type: DataTypes.ENUM('pending', 'accepted', 'declined'),
        allowNull: false,
        defaultValue: 'pending',
      },
      permissionLevel: {
        type: DataTypes.ENUM('view_travel', 'manage_travel'),
        allowNull: false,
        defaultValue: 'view_travel',
      },
      requestedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
      respondedAt: {
        type: DataTypes.DATE,
        allowNull: true,
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
      tableName: 'companion_relationships',
      indexes: [
        {
          fields: ['userId'],
        },
        {
          fields: ['companionUserId'],
        },
        {
          fields: ['status'],
        },
        {
          fields: ['userId', 'companionUserId'],
          unique: true,
        },
      ],
    }
  );

  CompanionRelationship.associate = (models) => {
    CompanionRelationship.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'requester',
      onDelete: 'CASCADE',
    });

    CompanionRelationship.belongsTo(models.User, {
      foreignKey: 'companionUserId',
      as: 'recipient',
      onDelete: 'CASCADE',
    });
  };

  return CompanionRelationship;
};
