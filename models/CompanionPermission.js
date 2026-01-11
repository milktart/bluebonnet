module.exports = (sequelize, DataTypes) => {
  const CompanionPermission = sequelize.define(
    'CompanionPermission',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
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
      grantedBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      canShareTrips: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      canManageTrips: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: 'companion_permissions',
      timestamps: true,
      indexes: [
        {
          fields: ['companionId'],
        },
        {
          fields: ['grantedBy'],
        },
        {
          unique: true,
          fields: ['companionId', 'grantedBy'],
        },
      ],
    }
  );

  CompanionPermission.associate = (models) => {
    CompanionPermission.belongsTo(models.TravelCompanion, {
      foreignKey: 'companionId',
      as: 'companion',
    });

    CompanionPermission.belongsTo(models.User, {
      foreignKey: 'grantedBy',
      as: 'grantedByUser',
    });
  };

  return CompanionPermission;
};
