const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ItemCompanion = sequelize.define(
    'ItemCompanion',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      itemType: {
        type: DataTypes.ENUM('flight', 'hotel', 'transportation', 'car_rental', 'event'),
        allowNull: false,
      },
      itemId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      companionId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'travel_companions',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      status: {
        type: DataTypes.ENUM('attending', 'not_attending'),
        allowNull: false,
        defaultValue: 'attending',
      },
      addedBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'RESTRICT',
      },
      inheritedFromTrip: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      canView: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      canEdit: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      canManageCompanions: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
      tableName: 'item_companions',
      indexes: [
        {
          fields: ['itemType', 'itemId'],
        },
        {
          fields: ['companionId'],
        },
        {
          fields: ['addedBy'],
        },
        {
          fields: ['status'],
        },
        {
          fields: ['itemType', 'itemId', 'companionId'],
          unique: true,
        },
      ],
    }
  );

  ItemCompanion.associate = (models) => {
    ItemCompanion.belongsTo(models.TravelCompanion, {
      foreignKey: 'companionId',
      as: 'companion',
      onDelete: 'CASCADE',
    });

    ItemCompanion.belongsTo(models.User, {
      foreignKey: 'addedBy',
      as: 'addedByUser',
      onDelete: 'RESTRICT',
    });
  };

  return ItemCompanion;
};
