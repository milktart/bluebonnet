/**
 * Voucher Service
 * Business logic for voucher management
 * Phase 3 - Service Layer Pattern
 */

import { Op, FindOptions } from 'sequelize';
import BaseService from './BaseService';
import { Voucher, VoucherAttachment } from '../models';
import logger from '../utils/logger';
import cacheService from './CacheService';

interface VoucherFilters {
  status?: string;
  type?: string;
  issuer?: string;
  showExpired?: boolean;
}

export class VoucherService extends BaseService<Voucher> {
  constructor() {
    super(Voucher as any, 'Voucher');
  }

  /**
   * Get all vouchers for a user
   */
  async getUserVouchers(userId: string, filters: VoucherFilters = {}): Promise<Voucher[]> {
    logger.debug(`${this.modelName}: Getting vouchers for user ${userId}`, { filters });

    // Try to get from cache first (only if no filters)
    if (Object.keys(filters).length === 0) {
      const cached = await cacheService.getCachedUserVouchers(userId, {});
      if (cached) {
        logger.debug('Cache HIT: User vouchers', { userId });
        return cached;
      }
      logger.debug('Cache MISS: User vouchers', { userId });
    }

    const where: any = { userId };

    // Apply filters
    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.issuer) {
      where.issuer = filters.issuer;
    }

    // Filter by expiration status
    if (filters.showExpired === false) {
      where[Op.or] = [{ expirationDate: null }, { expirationDate: { [Op.gte]: new Date() } }];
    }

    const vouchers = await Voucher.findAll({
      where,
      include: [
        {
          model: VoucherAttachment,
          as: 'attachments',
        },
      ],
      order: [['expirationDate', 'ASC NULLS LAST'], ['createdAt', 'DESC']],
    });

    // Cache the result (only if no filters)
    if (Object.keys(filters).length === 0) {
      await cacheService.cacheUserVouchers(userId, {}, vouchers);
    }

    return vouchers;
  }

  /**
   * Create a new voucher
   */
  async createVoucher(data: Record<string, any>, userId: string): Promise<Voucher> {
    logger.info(`${this.modelName}: Creating voucher for user ${userId}`, {
      type: data.type,
      issuer: data.issuer,
    });

    // Check if voucher number already exists
    const existing = await Voucher.findOne({
      where: { voucherNumber: data.voucherNumber },
    });

    if (existing) {
      logger.warn(`${this.modelName}: Voucher number already exists`, {
        voucherNumber: data.voucherNumber,
      });
      throw new Error('A voucher with this number already exists');
    }

    // Determine initial status based on usage
    let status = 'OPEN';
    if (data.usedAmount && data.totalValue) {
      if (data.usedAmount >= data.totalValue) {
        status = 'USED';
      } else if (data.usedAmount > 0) {
        status = 'PARTIALLY_USED';
      }
    }

    // Check if expired
    if (data.expirationDate && new Date(data.expirationDate) < new Date()) {
      status = 'EXPIRED';
    }

    const voucher = await this.create({
      ...data,
      userId,
      status,
      usedAmount: data.usedAmount || 0,
    });

    logger.info(`${this.modelName}: Voucher created`, {
      voucherId: (voucher as any).id,
      userId,
    });

    // Invalidate cache
    await cacheService.invalidateUserVouchers(userId);

    return voucher;
  }

  /**
   * Update a voucher
   */
  async updateVoucher(voucherId: string, data: Record<string, any>, userId: string): Promise<Voucher | null> {
    const voucher = await this.findByIdAndVerifyOwnership(voucherId, userId, {
      include: [
        {
          model: VoucherAttachment,
          as: 'attachments',
        },
      ],
    });

    if (!voucher) {
      return null;
    }

    // Auto-update status based on usage
    if (data.usedAmount !== undefined && data.totalValue !== undefined) {
      const usedAmount = parseFloat(data.usedAmount);
      const totalValue = parseFloat(data.totalValue);

      if (usedAmount >= totalValue) {
        data.status = 'USED';
      } else if (usedAmount > 0) {
        data.status = 'PARTIALLY_USED';
      } else {
        data.status = 'OPEN';
      }
    }

    await this.update(voucher, data);
    logger.info(`${this.modelName}: Voucher updated`, { voucherId, userId });

    // Invalidate cache
    await cacheService.invalidateUserVouchers(userId);

    return voucher;
  }

  /**
   * Delete a voucher
   */
  async deleteVoucher(voucherId: string, userId: string): Promise<boolean> {
    const voucher = await this.findByIdAndVerifyOwnership(voucherId, userId);

    if (!voucher) {
      return false;
    }

    // Check if voucher has attachments
    const attachmentCount = await VoucherAttachment.count({
      where: { voucherId },
    });

    if (attachmentCount > 0) {
      logger.warn(`${this.modelName}: Voucher has attachments`, {
        voucherId,
        attachmentCount,
      });
      // Allow deletion anyway - cascade will handle attachments
    }

    await this.delete(voucher);
    logger.info(`${this.modelName}: Voucher deleted`, { voucherId, userId });

    // Invalidate cache
    await cacheService.invalidateUserVouchers(userId);

    return true;
  }

  /**
   * Attach a voucher to a flight
   */
  async attachVoucherToFlight(
    voucherId: string,
    flightId: string,
    travelerId: string,
    travelerType: string,
    amountUsed: number
  ): Promise<VoucherAttachment> {
    logger.info(`${this.modelName}: Attaching voucher to flight`, {
      voucherId,
      flightId,
      travelerId,
      travelerType,
      amountUsed,
    });

    const voucher = await Voucher.findByPk(voucherId);
    if (!voucher) {
      throw new Error('Voucher not found');
    }

    // Check remaining balance
    const remainingBalance = (voucher as any).getRemainingBalance();
    if (remainingBalance !== null && amountUsed > remainingBalance) {
      throw new Error(`Insufficient voucher balance. Remaining: ${remainingBalance}`);
    }

    // Create attachment
    const attachment = await VoucherAttachment.create({
      voucherId,
      flightId,
      travelerId,
      travelerType,
      amountUsed,
    });

    // Update voucher used amount
    const newUsedAmount = (parseFloat((voucher as any).usedAmount) || 0) + parseFloat(amountUsed as any);
    await this.updateVoucherUsage(voucherId, newUsedAmount);

    logger.info(`${this.modelName}: Voucher attached to flight`, {
      voucherId,
      flightId,
      attachmentId: (attachment as any).id,
    });

    return attachment;
  }

  /**
   * Update voucher usage amount and status
   */
  async updateVoucherUsage(voucherId: string, usedAmount: number): Promise<Voucher> {
    const voucher = await Voucher.findByPk(voucherId);
    if (!voucher) {
      throw new Error('Voucher not found');
    }

    let status = (voucher as any).status;

    // Update status based on usage
    if ((voucher as any).totalValue) {
      const totalValue = parseFloat((voucher as any).totalValue);
      const used = parseFloat(usedAmount as any);

      if (used >= totalValue) {
        status = 'USED';
      } else if (used > 0) {
        status = 'PARTIALLY_USED';
      } else {
        status = 'OPEN';
      }
    }

    await (voucher as any).update({ usedAmount, status });

    logger.info(`${this.modelName}: Voucher usage updated`, {
      voucherId,
      usedAmount,
      status,
    });

    // Invalidate cache
    await cacheService.invalidateUserVouchers((voucher as any).userId);

    return voucher;
  }

  /**
   * Reissue a voucher with remaining balance
   */
  async reissueVoucher(voucherId: string, userId: string): Promise<Voucher> {
    logger.info(`${this.modelName}: Reissuing voucher`, { voucherId, userId });

    const originalVoucher = await this.findByIdAndVerifyOwnership(voucherId, userId);

    if (!originalVoucher) {
      throw new Error('Voucher not found or access denied');
    }

    const remainingBalance = (originalVoucher as any).getRemainingBalance();

    if (!remainingBalance || remainingBalance <= 0) {
      throw new Error('No remaining balance to reissue');
    }

    if ((originalVoucher as any).status === 'USED' || (originalVoucher as any).status === 'TRANSFERRED') {
      throw new Error('Cannot reissue a voucher that is already used or transferred');
    }

    // Create new voucher with remaining balance
    const newVoucher = await this.create({
      userId,
      type: (originalVoucher as any).type,
      issuer: (originalVoucher as any).issuer,
      voucherNumber: `${(originalVoucher as any).voucherNumber}-R${Date.now()}`,
      associatedAccount: (originalVoucher as any).associatedAccount,
      currency: (originalVoucher as any).currency,
      totalValue: remainingBalance,
      usedAmount: 0,
      status: 'OPEN',
      expirationDate: (originalVoucher as any).expirationDate,
      parentVoucherId: (originalVoucher as any).id,
      notes: `Reissued from voucher ${(originalVoucher as any).voucherNumber}`,
    });

    // Mark original voucher as transferred
    await (originalVoucher as any).update({ status: 'TRANSFERRED' });

    logger.info(`${this.modelName}: Voucher reissued`, {
      originalVoucherId: voucherId,
      newVoucherId: (newVoucher as any).id,
      remainingBalance,
    });

    // Invalidate cache
    await cacheService.invalidateUserVouchers(userId);

    return newVoucher;
  }

  /**
   * Get vouchers that are expiring soon
   */
  async getExpiringVouchers(userId: string, days: number = 30): Promise<Voucher[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    logger.debug(`${this.modelName}: Getting expiring vouchers for user ${userId}`, { days });

    const vouchers = await Voucher.findAll({
      where: {
        userId,
        status: ['OPEN', 'PARTIALLY_USED'],
        expirationDate: {
          [Op.between]: [new Date(), futureDate],
        },
      },
      order: [['expirationDate', 'ASC']],
    });

    return vouchers;
  }

  /**
   * Search vouchers by number or issuer
   */
  async searchVouchers(userId: string, query: string, limit: number = 10): Promise<Voucher[]> {
    const searchTerm = query.toLowerCase().trim();

    logger.debug(`${this.modelName}: Searching vouchers for user ${userId} with query: ${query}`);

    const vouchers = await Voucher.findAll({
      where: {
        userId,
        [Op.or]: [
          { voucherNumber: { [Op.iLike]: `%${searchTerm}%` } },
          { issuer: { [Op.iLike]: `%${searchTerm}%` } },
        ],
      },
      include: [
        {
          model: VoucherAttachment,
          as: 'attachments',
        },
      ],
      limit,
      order: [['createdAt', 'DESC']],
    });

    return vouchers;
  }

  /**
   * Get voucher statistics for a user
   */
  async getVoucherStatistics(userId: string): Promise<Record<string, any>> {
    const [total, open, partiallyUsed, used, expired, totalValue] = await Promise.all([
      this.count({ userId }),
      this.count({ userId, status: 'OPEN' }),
      this.count({ userId, status: 'PARTIALLY_USED' }),
      this.count({ userId, status: 'USED' }),
      this.count({ userId, status: 'EXPIRED' }),
      (Voucher as any).sum('totalValue', {
        where: {
          userId,
          status: ['OPEN', 'PARTIALLY_USED'],
        },
      }),
    ]);

    return {
      total,
      open,
      partiallyUsed,
      used,
      expired,
      totalValue: totalValue || 0,
    };
  }
}

export const voucherService = new VoucherService();
export default voucherService;
