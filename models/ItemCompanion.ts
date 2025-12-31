import { Sequelize, Model, DataTypes } from 'sequelize';

/**
 * Attributes for the ItemCompanion model
 */
export interface ItemCompanionAttributes {
  id: string;
  itemType: 'flight' | 'hotel' | 'transportation' | 'car_rental' | 'event';
  itemId: string;
  companionId: string;
  status: 'attending' | 'not_attending';
  addedBy: string;
  inheritedFromTrip: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * ItemCompanion model representing companion attendance for travel items
 */
export class ItemCompanion extends Model<ItemCompanionAttributes> implements ItemCompanionAttributes {
  declare id: string;
  declare itemType: 'flight' | 'hotel' | 'transportation' | 'car_rental' | 'event';
  declare itemId: string;
  declare companionId: string;
  declare status: 'attending' | 'not_attending';
  declare addedBy: string;
  declare inheritedFromTrip: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

/**
 * Initialize ItemCompanion model
 * @param sequelize - Sequelize instance
 * @returns ItemCompanion model class
 */
export function initItemCompanion(sequelize: Sequelize): typeof ItemCompanion {
  ItemCompanion.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      itemType: {
        type: DataTypes.ENUM('flight', 'hotel', 'transportation', 'car_rental', 'event'),
        allowNull: false,
      },
      itemId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      companionId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'travel_companions',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      status: {
        type: DataTypes.ENUM('attending', 'not_attending'),
        allowNull: false,
        defaultValue: 'attending',
      },
      addedBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'RESTRICT',
      },
      inheritedFromTrip: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      tableName: 'item_companions',
      timestamps: true,
      indexes: [
        {
          fields: ['itemType', 'itemId'],
        },
        {
          fields: ['companionId'],
        },
        {
          fields: ['addedBy'],
        },
        {
          fields: ['status'],
        },
        {
          fields: ['itemType', 'itemId', 'companionId'],
          unique: true,
        },
      ],
    }
  );

  return ItemCompanion;
}
