module.exports = (sequelize, DataTypes) => {
  const CompanionPermission = sequelize.define(
    'CompanionPermission',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      ownerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      trustedUserId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      canManageAllTrips: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      canViewAllTrips: {
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
          fields: ['ownerId'],
        },
        {
          fields: ['trustedUserId'],
        },
        {
          unique: true,
          fields: ['ownerId', 'trustedUserId'],
        },
      ],
    }
  );

  CompanionPermission.associate = (models) => {
    CompanionPermission.belongsTo(models.User, {
      foreignKey: 'ownerId',
      as: 'owner',
    });

    CompanionPermission.belongsTo(models.User, {
      foreignKey: 'trustedUserId',
      as: 'trustedUser',
    });
  };

  return CompanionPermission;
};
