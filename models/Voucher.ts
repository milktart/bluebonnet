import { Sequelize, Model, DataTypes } from 'sequelize';
import { MS_PER_DAY } from '../utils/constants';

/**
 * Attributes for the Voucher model
 */
export interface VoucherAttributes {
  id: string;
  userId: string | null;
  type: 'TRAVEL_CREDIT' | 'UPGRADE_CERT' | 'REGIONAL_UPGRADE_CERT' | 'GLOBAL_UPGRADE_CERT' | 'COMPANION_CERT' | 'GIFT_CARD' | 'MISC';
  issuer: string;
  voucherNumber: string;
  associatedAccount: string | null;
  pinCode: string | null;
  currency: string;
  totalValue: number | null;
  usedAmount: number | null;
  status: 'OPEN' | 'PARTIALLY_USED' | 'USED' | 'EXPIRED' | 'TRANSFERRED' | 'CANCELLED';
  expirationDate: Date | null;
  parentVoucherId: string | null;
  notes: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Voucher model representing travel vouchers and certificates
 */
export class Voucher extends Model<VoucherAttributes> implements VoucherAttributes {
  declare id: string;
  declare userId: string | null;
  declare type: 'TRAVEL_CREDIT' | 'UPGRADE_CERT' | 'REGIONAL_UPGRADE_CERT' | 'GLOBAL_UPGRADE_CERT' | 'COMPANION_CERT' | 'GIFT_CARD' | 'MISC';
  declare issuer: string;
  declare voucherNumber: string;
  declare associatedAccount: string | null;
  declare pinCode: string | null;
  declare currency: string;
  declare totalValue: number | null;
  declare usedAmount: number | null;
  declare status: 'OPEN' | 'PARTIALLY_USED' | 'USED' | 'EXPIRED' | 'TRANSFERRED' | 'CANCELLED';
  declare expirationDate: Date | null;
  declare parentVoucherId: string | null;
  declare notes: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  /**
   * Get remaining balance for the voucher
   */
  getRemainingBalance(): number | null {
    if (!this.totalValue) return null;
    const usedAmount = this.usedAmount || 0;
    return this.totalValue - usedAmount;
  }

  /**
   * Get days until expiration
   */
  getDaysUntilExpiration(): number | null {
    if (!this.expirationDate) return null;
    const today = new Date();
    const expDate = new Date(this.expirationDate);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / MS_PER_DAY);
    return diffDays;
  }

  /**
   * Check if voucher is expired
   */
  getIsExpired(): boolean {
    if (!this.expirationDate) return false;
    return new Date() > new Date(this.expirationDate);
  }
}

/**
 * Initialize Voucher model
 * @param sequelize - Sequelize instance
 * @returns Voucher model class
 */
export function initVoucher(sequelize: Sequelize): typeof Voucher {
  Voucher.init(
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
      type: {
        type: DataTypes.ENUM(
          'TRAVEL_CREDIT',
          'UPGRADE_CERT',
          'REGIONAL_UPGRADE_CERT',
          'GLOBAL_UPGRADE_CERT',
          'COMPANION_CERT',
          'GIFT_CARD',
          'MISC'
        ),
        allowNull: false,
      },
      issuer: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      voucherNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      associatedAccount: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      pinCode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      currency: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'USD',
      },
      totalValue: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      usedAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.ENUM('OPEN', 'PARTIALLY_USED', 'USED', 'EXPIRED', 'TRANSFERRED', 'CANCELLED'),
        allowNull: false,
        defaultValue: 'OPEN',
      },
      expirationDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      parentVoucherId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'vouchers',
          key: 'id',
        },
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'vouchers',
      timestamps: true,
      indexes: [
        {
          fields: ['userId'],
        },
        {
          fields: ['voucherNumber'],
        },
        {
          fields: ['status'],
        },
        {
          fields: ['expirationDate'],
        },
        {
          fields: ['parentVoucherId'],
        },
      ],
    }
  );

  return Voucher;
}
