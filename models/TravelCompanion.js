module.exports = (sequelize, DataTypes) => {
  const TravelCompanion = sequelize.define(
    'TravelCompanion',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isEmail: true,
        },
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true, // null until companion creates account
        references: {
          model: 'users',
          key: 'id',
        },
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      canBeAddedByOthers: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: 'travel_companions',
      timestamps: true,
      indexes: [
        {
          fields: ['email'],
        },
        {
          fields: ['createdBy'],
        },
        {
          fields: ['userId'],
        },
      ],
    }
  );

  TravelCompanion.associate = (models) => {
    // Belongs to the user who created this companion
    TravelCompanion.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator',
    });

    // Belongs to the user account (if linked)
    TravelCompanion.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'linkedAccount',
    });

    // Many-to-many relationship with trips through junction table
    TravelCompanion.belongsToMany(models.Trip, {
      through: models.TripCompanion,
      foreignKey: 'companionId',
      otherKey: 'tripId',
      as: 'trips',
    });
  };

  return TravelCompanion;
};
