import { Sequelize, Model, DataTypes } from 'sequelize';

/**
 * Attributes for the Trip model
 */
export interface TripAttributes {
  id: string;
  userId: string;
  name: string;
  departureDate: string;
  returnDate: string | null;
  defaultCompanionEditPermission: boolean;
  purpose: 'business' | 'leisure' | 'family' | 'romantic' | 'adventure' | 'pleasure' | 'other';
  isConfirmed: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Trip model representing a travel trip
 */
export class Trip extends Model<TripAttributes> implements TripAttributes {
  declare id: string;
  declare userId: string;
  declare name: string;
  declare departureDate: string;
  declare returnDate: string | null;
  declare defaultCompanionEditPermission: boolean;
  declare purpose: 'business' | 'leisure' | 'family' | 'romantic' | 'adventure' | 'pleasure' | 'other';
  declare isConfirmed: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

/**
 * Initialize Trip model
 * @param sequelize - Sequelize instance
 * @returns Trip model class
 */
export function initTrip(sequelize: Sequelize): typeof Trip {
  Trip.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      departureDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      returnDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      defaultCompanionEditPermission: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      purpose: {
        type: DataTypes.ENUM('business', 'leisure', 'family', 'romantic', 'adventure', 'pleasure', 'other'),
        allowNull: false,
        defaultValue: 'leisure',
      },
      isConfirmed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      tableName: 'trips',
      timestamps: true,
    }
  );

  return Trip;
}
