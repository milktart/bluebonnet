import { Sequelize, Model, DataTypes } from 'sequelize';

/**
 * Attributes for the Transportation model
 */
export interface TransportationAttributes {
  id: string;
  userId: string | null;
  tripId: string | null;
  method: string;
  journeyNumber: string | null;
  origin: string;
  originTimezone: string | null;
  destination: string;
  destinationTimezone: string | null;
  originLat: number | null;
  originLng: number | null;
  destinationLat: number | null;
  destinationLng: number | null;
  departureDateTime: Date;
  arrivalDateTime: Date;
  confirmationNumber: string | null;
  seat: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Transportation model representing ground transportation bookings
 */
export class Transportation extends Model<TransportationAttributes> implements TransportationAttributes {
  declare id: string;
  declare userId: string | null;
  declare tripId: string | null;
  declare method: string;
  declare journeyNumber: string | null;
  declare origin: string;
  declare originTimezone: string | null;
  declare destination: string;
  declare destinationTimezone: string | null;
  declare originLat: number | null;
  declare originLng: number | null;
  declare destinationLat: number | null;
  declare destinationLng: number | null;
  declare departureDateTime: Date;
  declare arrivalDateTime: Date;
  declare confirmationNumber: string | null;
  declare seat: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

/**
 * Initialize Transportation model
 * @param sequelize - Sequelize instance
 * @returns Transportation model class
 */
export function initTransportation(sequelize: Sequelize): typeof Transportation {
  Transportation.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      tripId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'trips',
          key: 'id',
        },
      },
      method: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      journeyNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      origin: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      originTimezone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      destination: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      destinationTimezone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      originLat: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },
      originLng: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },
      destinationLat: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },
      destinationLng: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },
      departureDateTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      arrivalDateTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      confirmationNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      seat: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'transportation',
      timestamps: true,
    }
  );

  return Transportation;
}
