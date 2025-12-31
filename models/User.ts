import { Sequelize, Model, DataTypes } from 'sequelize';

/**
 * Attributes for the User model
 */
export interface UserAttributes {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * User model representing application users with authentication
 */
export class User extends Model<UserAttributes> implements UserAttributes {
  declare id: string;
  declare email: string;
  declare password: string;
  declare firstName: string;
  declare lastName: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

/**
 * Initialize User model
 * @param sequelize - Sequelize instance
 * @returns User model class
 */
export function initUser(sequelize: Sequelize): typeof User {
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING(1),
        allowNull: false,
        validate: {
          len: {
            args: [1, 1],
            msg: 'Last initial must be exactly one character',
          },
        },
      },
    },
    {
      sequelize,
      tableName: 'users',
      timestamps: true,
    }
  );

  return User;
}
