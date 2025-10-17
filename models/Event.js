module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define('Event', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true, // Temporarily nullable for migration
      references: {
        model: 'users',
        key: 'id'
      }
    },
    tripId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'trips',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    startDateTime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDateTime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    location: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    timezone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    lat: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true
    },
    lng: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true
    },
    contactPhone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    contactEmail: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true
      }
    }
  }, {
    tableName: 'events',
    timestamps: true
  });

  Event.associate = (models) => {
    Event.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });

    Event.belongsTo(models.Trip, {
      foreignKey: 'tripId',
      as: 'trip',
      constraints: false
    });
  };

  return Event;
};