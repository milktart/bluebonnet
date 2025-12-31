import { Sequelize, Model, DataTypes } from 'sequelize';

/**
 * Attributes for the TripCompanion model (junction table)
 */
export interface TripCompanionAttributes {
  id: string;
  tripId: string;
  companionId: string;
  canEdit: boolean;
  addedBy: string;
  canAddItems: boolean;
  permissionSource: 'owner' | 'manage_travel' | 'explicit';
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * TripCompanion model representing the relationship between trips and travel companions
 */
export class TripCompanion extends Model<TripCompanionAttributes> implements TripCompanionAttributes {
  declare id: string;
  declare tripId: string;
  declare companionId: string;
  declare canEdit: boolean;
  declare addedBy: string;
  declare canAddItems: boolean;
  declare permissionSource: 'owner' | 'manage_travel' | 'explicit';
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

/**
 * Initialize TripCompanion model
 * @param sequelize - Sequelize instance
 * @returns TripCompanion model class
 */
export function initTripCompanion(sequelize: Sequelize): typeof TripCompanion {
  TripCompanion.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      tripId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'trips',
          key: 'id',
        },
      },
      companionId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'travel_companions',
          key: 'id',
        },
      },
      canEdit: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      addedBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      canAddItems: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      permissionSource: {
        type: DataTypes.ENUM('owner', 'manage_travel', 'explicit'),
        allowNull: false,
        defaultValue: 'explicit',
      },
    },
    {
      sequelize,
      tableName: 'trip_companions',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['tripId', 'companionId'],
        },
        {
          fields: ['tripId'],
        },
        {
          fields: ['companionId'],
        },
      ],
    }
  );

  return TripCompanion;
}
