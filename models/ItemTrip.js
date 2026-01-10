module.exports = (sequelize, DataTypes) => {
  const ItemTrip = sequelize.define(
    'ItemTrip',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      itemId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      itemType: {
        type: DataTypes.ENUM('flight', 'hotel', 'event', 'transportation', 'car_rental'),
        allowNull: false,
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
    },
    {
      tableName: 'item_trips',
      timestamps: true,
      indexes: [
        {
          fields: ['itemId', 'itemType'],
        },
        {
          fields: ['tripId'],
        },
        {
          unique: true,
          fields: ['itemId', 'itemType', 'tripId'],
        },
      ],
    }
  );

  ItemTrip.associate = (models) => {
    ItemTrip.belongsTo(models.Trip, {
      foreignKey: 'tripId',
      as: 'trip',
    });
  };

  return ItemTrip;
};
