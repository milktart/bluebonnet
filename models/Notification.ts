import { Sequelize, Model, DataTypes } from 'sequelize';

/**
 * Attributes for the Notification model
 */
export interface NotificationAttributes {
  id: string;
  userId: string;
  type: 'companion_request_received' | 'companion_request_accepted' | 'companion_request_declined' | 'trip_invitation_received' | 'trip_invitation_accepted' | 'trip_invitation_declined';
  relatedId: string | null;
  relatedType: 'companion_relationship' | 'trip_invitation' | null;
  message: string | null;
  read: boolean;
  actionRequired: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Notification model representing user notifications
 */
export class Notification extends Model<NotificationAttributes> implements NotificationAttributes {
  declare id: string;
  declare userId: string;
  declare type: 'companion_request_received' | 'companion_request_accepted' | 'companion_request_declined' | 'trip_invitation_received' | 'trip_invitation_accepted' | 'trip_invitation_declined';
  declare relatedId: string | null;
  declare relatedType: 'companion_relationship' | 'trip_invitation' | null;
  declare message: string | null;
  declare read: boolean;
  declare actionRequired: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

/**
 * Initialize Notification model
 * @param sequelize - Sequelize instance
 * @returns Notification model class
 */
export function initNotification(sequelize: Sequelize): typeof Notification {
  Notification.init(
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
      type: {
        type: DataTypes.ENUM(
          'companion_request_received',
          'companion_request_accepted',
          'companion_request_declined',
          'trip_invitation_received',
          'trip_invitation_accepted',
          'trip_invitation_declined'
        ),
        allowNull: false,
      },
      relatedId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      relatedType: {
        type: DataTypes.ENUM('companion_relationship', 'trip_invitation'),
        allowNull: true,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      actionRequired: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      tableName: 'notifications',
      timestamps: true,
      indexes: [
        {
          fields: ['userId'],
        },
        {
          fields: ['type'],
        },
        {
          fields: ['relatedId'],
        },
        {
          fields: ['read'],
        },
        {
          fields: ['userId', 'read'],
        },
      ],
    }
  );

  return Notification;
}
