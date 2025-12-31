import { Sequelize, Model, DataTypes } from 'sequelize';

/**
 * Attributes for the Hotel model
 */
export interface HotelAttributes {
  id: string;
  userId: string | null;
  tripId: string | null;
  hotelName: string;
  address: string;
  phone: string | null;
  checkInDateTime: Date;
  checkOutDateTime: Date;
  lat: number | null;
  lng: number | null;
  confirmationNumber: string | null;
  roomNumber: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Hotel model representing a hotel booking
 */
export class Hotel extends Model<HotelAttributes> implements HotelAttributes {
  declare id: string;
  declare userId: string | null;
  declare tripId: string | null;
  declare hotelName: string;
  declare address: string;
  declare phone: string | null;
  declare checkInDateTime: Date;
  declare checkOutDateTime: Date;
  declare lat: number | null;
  declare lng: number | null;
  declare confirmationNumber: string | null;
  declare roomNumber: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

/**
 * Initialize Hotel model
 * @param sequelize - Sequelize instance
 * @returns Hotel model class
 */
export function initHotel(sequelize: Sequelize): typeof Hotel {
  Hotel.init(
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
      hotelName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      checkInDateTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      checkOutDateTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      lat: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },
      lng: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },
      confirmationNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      roomNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'hotels',
      timestamps: true,
    }
  );

  return Hotel;
}
