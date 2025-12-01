module.exports = (sequelize, DataTypes) => {
  const CarRental = sequelize.define(
    'CarRental',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      tripId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'trips',
          key: 'id',
        },
      },
      company: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      pickupLocation: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      pickupTimezone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      dropoffLocation: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      dropoffTimezone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      pickupLat: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },
      pickupLng: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },
      dropoffLat: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },
      dropoffLng: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },
      pickupDateTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      dropoffDateTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      confirmationNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: 'car_rentals',
      timestamps: true,
    }
  );

  CarRental.associate = (models) => {
    CarRental.belongsTo(models.Trip, {
      foreignKey: 'tripId',
      as: 'trip',
    });
  };

  return CarRental;
};
