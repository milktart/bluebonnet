import { Sequelize, Model, DataTypes } from 'sequelize';

/**
 * Attributes for the VoucherAttachment model
 */
export interface VoucherAttachmentAttributes {
  id: string;
  voucherId: string;
  flightId: string;
  travelerId: string;
  travelerType: 'USER' | 'COMPANION';
  attachmentValue: number | null;
  attachmentDate: Date | null;
  notes: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * VoucherAttachment model representing voucher attachments to flights
 */
export class VoucherAttachment extends Model<VoucherAttachmentAttributes> implements VoucherAttachmentAttributes {
  declare id: string;
  declare voucherId: string;
  declare flightId: string;
  declare travelerId: string;
  declare travelerType: 'USER' | 'COMPANION';
  declare attachmentValue: number | null;
  declare attachmentDate: Date | null;
  declare notes: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

/**
 * Initialize VoucherAttachment model
 * @param sequelize - Sequelize instance
 * @returns VoucherAttachment model class
 */
export function initVoucherAttachment(sequelize: Sequelize): typeof VoucherAttachment {
  VoucherAttachment.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      voucherId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'vouchers',
          key: 'id',
        },
      },
      flightId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'flights',
          key: 'id',
        },
      },
      travelerId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      travelerType: {
        type: DataTypes.ENUM('USER', 'COMPANION'),
        allowNull: false,
      },
      attachmentValue: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      attachmentDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'voucher_attachments',
      timestamps: true,
      indexes: [
        {
          fields: ['voucherId'],
        },
        {
          fields: ['flightId'],
        },
        {
          fields: ['travelerId', 'travelerType'],
        },
      ],
    }
  );

  return VoucherAttachment;
}
