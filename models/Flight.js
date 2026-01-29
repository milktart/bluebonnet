module.exports = (sequelize, DataTypes) => {
  const Flight = sequelize.define(
    'Flight',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true, // Temporarily nullable for migration
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
      airline: {
        type: DataTypes.STRING,
        allowNull: true, // Nullable until flight number to airline lookup is implemented
      },
      flightNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      departureDateTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      arrivalDateTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      origin: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      originTimezone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      destination: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      destinationTimezone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      originLat: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },
      originLng: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },
      destinationLat: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },
      destinationLng: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },
      pnr: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      seat: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: 'flights',
      timestamps: true,
    }
  );

  Flight.associate = (models) => {
    Flight.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });

    Flight.belongsTo(models.Trip, {
      foreignKey: 'tripId',
      as: 'trip',
    });

    // Legacy association with VoucherAttachment via flightId (backward compatible)
    Flight.hasMany(models.VoucherAttachment, {
      foreignKey: 'flightId',
      as: 'voucherAttachments',
      onDelete: 'CASCADE',
    });

    // New polymorphic association with VoucherAttachment
    Flight.hasMany(models.VoucherAttachment, {
      foreignKey: 'itemId',
      as: 'voucherAttachmentsNew',
      scope: { itemType: 'flight' },
      constraints: false,
    });
  };

  return Flight;
};
