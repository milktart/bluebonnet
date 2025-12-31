import { Sequelize, Model, DataTypes } from 'sequelize';

/**
 * Attributes for the CompanionRelationship model
 */
export interface CompanionRelationshipAttributes {
  id: string;
  userId: string;
  companionUserId: string;
  status: 'pending' | 'accepted' | 'declined';
  permissionLevel: 'view_travel' | 'manage_travel';
  requestedAt: Date;
  respondedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * CompanionRelationship model representing relationships between users for companion sharing
 */
export class CompanionRelationship extends Model<CompanionRelationshipAttributes>
  implements CompanionRelationshipAttributes {
  declare id: string;
  declare userId: string;
  declare companionUserId: string;
  declare status: 'pending' | 'accepted' | 'declined';
  declare permissionLevel: 'view_travel' | 'manage_travel';
  declare requestedAt: Date;
  declare respondedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

/**
 * Initialize CompanionRelationship model
 * @param sequelize - Sequelize instance
 * @returns CompanionRelationship model class
 */
export function initCompanionRelationship(sequelize: Sequelize): typeof CompanionRelationship {
  CompanionRelationship.init(
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
        onDelete: 'CASCADE',
      },
      companionUserId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      status: {
        type: DataTypes.ENUM('pending', 'accepted', 'declined'),
        allowNull: false,
        defaultValue: 'pending',
      },
      permissionLevel: {
        type: DataTypes.ENUM('view_travel', 'manage_travel'),
        allowNull: false,
        defaultValue: 'view_travel',
      },
      requestedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
      respondedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'companion_relationships',
      timestamps: true,
      indexes: [
        {
          fields: ['userId'],
        },
        {
          fields: ['companionUserId'],
        },
        {
          fields: ['status'],
        },
        {
          fields: ['userId', 'companionUserId'],
          unique: true,
        },
      ],
    }
  );

  return CompanionRelationship;
}
