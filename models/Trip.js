module.exports = (sequelize, DataTypes) => {
  const Trip = sequelize.define(
    'Trip',
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
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      departureDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      returnDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      defaultCompanionEditPermission: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      purpose: {
        type: DataTypes.ENUM('business', 'leisure', 'family', 'romantic', 'adventure', 'pleasure', 'other'),
        allowNull: false,
        defaultValue: 'leisure',
      },
      isConfirmed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: 'trips',
      timestamps: true,
    }
  );

  Trip.associate = (models) => {
    Trip.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });

    Trip.hasMany(models.Flight, {
      foreignKey: 'tripId',
      as: 'flights',
      onDelete: 'CASCADE',
    });

    Trip.hasMany(models.Hotel, {
      foreignKey: 'tripId',
      as: 'hotels',
      onDelete: 'CASCADE',
    });

    Trip.hasMany(models.Transportation, {
      foreignKey: 'tripId',
      as: 'transportation',
      onDelete: 'CASCADE',
    });

    Trip.hasMany(models.CarRental, {
      foreignKey: 'tripId',
      as: 'carRentals',
      onDelete: 'CASCADE',
    });

    Trip.hasMany(models.Event, {
      foreignKey: 'tripId',
      as: 'events',
      onDelete: 'CASCADE',
    });

    // Many-to-many relationship with companions through junction table
    Trip.belongsToMany(models.TravelCompanion, {
      through: models.TripCompanion,
      foreignKey: 'tripId',
      otherKey: 'companionId',
      as: 'companions',
    });

    // Direct access to trip companion junction records
    Trip.hasMany(models.TripCompanion, {
      foreignKey: 'tripId',
      as: 'tripCompanions',
      onDelete: 'CASCADE',
    });
  };

  return Trip;
};
