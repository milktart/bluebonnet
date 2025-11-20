module.exports = (sequelize, DataTypes) => {
  const Hotel = sequelize.define(
    'Hotel',
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
      },
      hotelName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      checkInDateTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      checkOutDateTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      timezone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      lat: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },
      lng: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },
      confirmationNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      roomNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: 'hotels',
      timestamps: true,
    }
  );

  Hotel.associate = (models) => {
    Hotel.belongsTo(models.Trip, {
      foreignKey: 'tripId',
      as: 'trip',
    });
  };

  return Hotel;
};
