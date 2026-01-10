module.exports = (sequelize, DataTypes) => {
  const TripAttendee = sequelize.define(
    'TripAttendee',
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
        onDelete: 'CASCADE',
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true, // Null until attendee creates account
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM('owner', 'admin', 'attendee'),
        allowNull: false,
        defaultValue: 'attendee',
      },
    },
    {
      tableName: 'trip_attendees',
      timestamps: true,
      indexes: [
        {
          fields: ['tripId'],
        },
        {
          fields: ['userId'],
        },
        {
          fields: ['email'],
        },
        {
          unique: true,
          fields: ['tripId', 'userId'],
          where: {
            userId: { [sequelize.Sequelize.Op.ne]: null },
          },
        },
      ],
    }
  );

  TripAttendee.associate = (models) => {
    TripAttendee.belongsTo(models.Trip, {
      foreignKey: 'tripId',
      as: 'trip',
    });

    TripAttendee.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  };

  return TripAttendee;
};
