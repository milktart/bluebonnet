import { Sequelize, Model, DataTypes } from 'sequelize';

/**
 * Attributes for the CarRental model
 */
export interface CarRentalAttributes {
  id: string;
  userId: string | null;
  tripId: string | null;
  company: string;
  pickupLocation: string;
  pickupTimezone: string | null;
  dropoffLocation: string;
  dropoffTimezone: string | null;
  pickupLat: number | null;
  pickupLng: number | null;
  dropoffLat: number | null;
  dropoffLng: number | null;
  pickupDateTime: Date;
  dropoffDateTime: Date;
  confirmationNumber: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * CarRental model representing a car rental booking
 */
export class CarRental extends Model<CarRentalAttributes> implements CarRentalAttributes {
  declare id: string;
  declare userId: string | null;
  declare tripId: string | null;
  declare company: string;
  declare pickupLocation: string;
  declare pickupTimezone: string | null;
  declare dropoffLocation: string;
  declare dropoffTimezone: string | null;
  declare pickupLat: number | null;
  declare pickupLng: number | null;
  declare dropoffLat: number | null;
  declare dropoffLng: number | null;
  declare pickupDateTime: Date;
  declare dropoffDateTime: Date;
  declare confirmationNumber: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

/**
 * Initialize CarRental model
 * @param sequelize - Sequelize instance
 * @returns CarRental model class
 */
export function initCarRental(sequelize: Sequelize): typeof CarRental {
  CarRental.init(
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
      company: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      pickupLocation: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      pickupTimezone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      dropoffLocation: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      dropoffTimezone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      pickupLat: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },
      pickupLng: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },
      dropoffLat: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },
      dropoffLng: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },
      pickupDateTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      dropoffDateTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      confirmationNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'car_rentals',
      timestamps: true,
    }
  );

  return CarRental;
}
