module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'users',
    timestamps: true
  });

  User.associate = (models) => {
    User.hasMany(models.Trip, {
      foreignKey: 'userId',
      as: 'trips',
      onDelete: 'CASCADE'
    });

    // Travel companions created by this user
    User.hasMany(models.TravelCompanion, {
      foreignKey: 'createdBy',
      as: 'createdCompanions',
      onDelete: 'CASCADE'
    });

    // Travel companion profile linked to this user account
    User.hasOne(models.TravelCompanion, {
      foreignKey: 'userId',
      as: 'companionProfile'
    });

    // Vouchers owned by this user
    User.hasMany(models.Voucher, {
      foreignKey: 'userId',
      as: 'vouchers',
      onDelete: 'CASCADE'
    });
  };

  return User;
};