import { Sequelize, Model, DataTypes } from 'sequelize';

/**
 * Attributes for the TripInvitation model
 */
export interface TripInvitationAttributes {
  id: string;
  tripId: string;
  invitedUserId: string;
  invitedByUserId: string;
  status: 'pending' | 'joined' | 'declined';
  createdAt?: Date;
  respondedAt: Date | null;
  updatedAt?: Date;
}

/**
 * TripInvitation model representing invitations to join trips
 */
export class TripInvitation extends Model<TripInvitationAttributes> implements TripInvitationAttributes {
  declare id: string;
  declare tripId: string;
  declare invitedUserId: string;
  declare invitedByUserId: string;
  declare status: 'pending' | 'joined' | 'declined';
  declare readonly createdAt: Date;
  declare respondedAt: Date | null;
  declare readonly updatedAt: Date;
}

/**
 * Initialize TripInvitation model
 * @param sequelize - Sequelize instance
 * @returns TripInvitation model class
 */
export function initTripInvitation(sequelize: Sequelize): typeof TripInvitation {
  TripInvitation.init(
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
        onDelete: 'CASCADE',
      },
      invitedUserId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      invitedByUserId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      status: {
        type: DataTypes.ENUM('pending', 'joined', 'declined'),
        allowNull: false,
        defaultValue: 'pending',
      },
      respondedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'trip_invitations',
      timestamps: true,
      indexes: [
        {
          fields: ['tripId'],
        },
        {
          fields: ['invitedUserId'],
        },
        {
          fields: ['invitedByUserId'],
        },
        {
          fields: ['status'],
        },
        {
          fields: ['tripId', 'invitedUserId'],
          unique: true,
        },
      ],
    }
  );

  return TripInvitation;
}
