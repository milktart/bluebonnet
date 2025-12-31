import { Sequelize, Model, DataTypes } from 'sequelize';

/**
 * Attributes for the Flight model
 */
export interface FlightAttributes {
  id: string;
  userId: string | null;
  tripId: string | null;
  airline: string | null;
  flightNumber: string;
  departureDateTime: Date;
  arrivalDateTime: Date;
  origin: string;
  originTimezone: string | null;
  destination: string;
  destinationTimezone: string | null;
  originLat: number | null;
  originLng: number | null;
  destinationLat: number | null;
  destinationLng: number | null;
  pnr: string | null;
  seat: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Flight model representing a flight booking
 */
export class Flight extends Model<FlightAttributes> implements FlightAttributes {
  declare id: string;
  declare userId: string | null;
  declare tripId: string | null;
  declare airline: string | null;
  declare flightNumber: string;
  declare departureDateTime: Date;
  declare arrivalDateTime: Date;
  declare origin: string;
  declare originTimezone: string | null;
  declare destination: string;
  declare destinationTimezone: string | null;
  declare originLat: number | null;
  declare originLng: number | null;
  declare destinationLat: number | null;
  declare destinationLng: number | null;
  declare pnr: string | null;
  declare seat: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

/**
 * Initialize Flight model
 * @param sequelize - Sequelize instance
 * @returns Flight model class
 */
export function initFlight(sequelize: Sequelize): typeof Flight {
  Flight.init(
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
      airline: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      flightNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      departureDateTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      arrivalDateTime: {
        type: DataTypes.DATE,
        allowNull: false,
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
      pnr: {
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
      tableName: 'flights',
      timestamps: true,
    }
  );

  return Flight;
}
