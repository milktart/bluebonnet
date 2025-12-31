import { Sequelize, Model, DataTypes } from 'sequelize';

/**
 * Attributes for the TravelCompanion model
 */
export interface TravelCompanionAttributes {
  id: string;
  firstName: string | null;
  lastName: string | null;
  name: string;
  email: string;
  phone: string | null;
  userId: string | null;
  createdBy: string;
  canBeAddedByOthers: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * TravelCompanion model representing people who travel with the user
 */
export class TravelCompanion extends Model<TravelCompanionAttributes> implements TravelCompanionAttributes {
  declare id: string;
  declare firstName: string | null;
  declare lastName: string | null;
  declare name: string;
  declare email: string;
  declare phone: string | null;
  declare userId: string | null;
  declare createdBy: string;
  declare canBeAddedByOthers: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

/**
 * Initialize TravelCompanion model
 * @param sequelize - Sequelize instance
 * @returns TravelCompanion model class
 */
export function initTravelCompanion(sequelize: Sequelize): typeof TravelCompanion {
  TravelCompanion.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
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
        allowNull: true,
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
      sequelize,
      tableName: 'travel_companions',
      timestamps: true,
      indexes: [
        {
          fields: ['email'],
          unique: true,
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

  return TravelCompanion;
}
