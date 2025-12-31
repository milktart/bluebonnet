import { Sequelize, Model, DataTypes } from 'sequelize';

/**
 * Attributes for the Event model
 */
export interface EventAttributes {
  id: string;
  userId: string | null;
  tripId: string | null;
  name: string;
  startDateTime: Date;
  endDateTime: Date | null;
  location: string;
  lat: number | null;
  lng: number | null;
  contactPhone: string | null;
  contactEmail: string | null;
  description: string | null;
  eventUrl: string | null;
  isConfirmed: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Event model representing a travel event or activity
 */
export class Event extends Model<EventAttributes> implements EventAttributes {
  declare id: string;
  declare userId: string | null;
  declare tripId: string | null;
  declare name: string;
  declare startDateTime: Date;
  declare endDateTime: Date | null;
  declare location: string;
  declare lat: number | null;
  declare lng: number | null;
  declare contactPhone: string | null;
  declare contactEmail: string | null;
  declare description: string | null;
  declare eventUrl: string | null;
  declare isConfirmed: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

/**
 * Initialize Event model
 * @param sequelize - Sequelize instance
 * @returns Event model class
 */
export function initEvent(sequelize: Sequelize): typeof Event {
  Event.init(
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
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      startDateTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      endDateTime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      location: {
        type: DataTypes.TEXT,
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
      contactPhone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      contactEmail: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isEmail: true,
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      eventUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isConfirmed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      tableName: 'events',
      timestamps: true,
    }
  );

  return Event;
}
