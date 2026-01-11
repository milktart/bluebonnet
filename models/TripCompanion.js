module.exports = (sequelize, DataTypes) => {
  const TripCompanion = sequelize.define(
    'TripCompanion',
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
      companionId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'travel_companions',
          key: 'id',
        },
      },
      addedBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      permissionSource: {
        type: DataTypes.ENUM('owner', 'manage_travel', 'explicit'),
        allowNull: false,
        defaultValue: 'explicit',
      },
    },
    {
      tableName: 'trip_companions',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['tripId', 'companionId'],
        },
        {
          fields: ['tripId'],
        },
        {
          fields: ['companionId'],
        },
      ],
    }
  );

  TripCompanion.associate = (models) => {
    TripCompanion.belongsTo(models.Trip, {
      foreignKey: 'tripId',
      as: 'trip',
    });

    TripCompanion.belongsTo(models.TravelCompanion, {
      foreignKey: 'companionId',
      as: 'companion',
    });

    TripCompanion.belongsTo(models.User, {
      foreignKey: 'addedBy',
      as: 'addedByUser',
    });
  };

  return TripCompanion;
};
