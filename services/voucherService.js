/**
 * Voucher Service
 * Business logic for voucher management
 * Phase 3 - Service Layer Pattern
 */

const { Op } = require('sequelize');
const BaseService = require('./BaseService');
const { Voucher, VoucherAttachment } = require('../models');
const logger = require('../utils/logger');
const cacheService = require('./cacheService');

class VoucherService extends BaseService {
  constructor() {
    super(Voucher, 'Voucher');
  }

  /**
   * Get all vouchers for a user
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options (status, type, etc.)
   * @returns {Promise<Array>}
   */
  async getUserVouchers(userId, filters = {}) {
    logger.debug(`${this.modelName}: Getting vouchers for user ${userId}`, { filters });

    // Try to get from cache first (only if no filters)
    if (Object.keys(filters).length === 0) {
      const cached = await cacheService.getCachedUserVouchers(userId);
      if (cached) {
        logger.debug('Cache HIT: User vouchers', { userId });
        return cached;
      }
      logger.debug('Cache MISS: User vouchers', { userId });
    }

    const where = { userId };

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
      order: [
        ['expirationDate', 'ASC NULLS LAST'],
        ['createdAt', 'DESC'],
      ],
    });

    // Cache the result (only if no filters)
    if (Object.keys(filters).length === 0) {
      await cacheService.cacheUserVouchers(userId, vouchers);
    }

    return vouchers;
  }

  /**
   * Create a new voucher
   * @param {Object} data - Voucher data
   * @param {string} userId - User ID
   * @returns {Promise<Object>}
   */
  async createVoucher(data, userId) {
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
      voucherId: voucher.id,
      userId,
    });

    // Invalidate cache
    await cacheService.invalidateUserVouchers(userId);

    return voucher;
  }

  /**
   * Update a voucher
   * @param {string} voucherId - Voucher ID
   * @param {Object} data - Updated voucher data
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>}
   */
  async updateVoucher(voucherId, data, userId) {
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
   * @param {string} voucherId - Voucher ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>}
   */
  async deleteVoucher(voucherId, userId) {
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
   * @param {string} voucherId - Voucher ID
   * @param {string} flightId - Flight ID
   * @param {string} travelerId - Traveler ID (User or TravelCompanion)
   * @param {string} travelerType - 'USER' or 'COMPANION'
   * @param {number} amountUsed - Amount used for this attachment
   * @returns {Promise<Object>}
   */
  async attachVoucherToFlight(voucherId, flightId, travelerId, travelerType, amountUsed) {
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
    const remainingBalance = voucher.getRemainingBalance();
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
    const newUsedAmount = (parseFloat(voucher.usedAmount) || 0) + parseFloat(amountUsed);
    await this.updateVoucherUsage(voucherId, newUsedAmount);

    logger.info(`${this.modelName}: Voucher attached to flight`, {
      voucherId,
      flightId,
      attachmentId: attachment.id,
    });

    return attachment;
  }

  /**
   * Update voucher usage amount and status
   * @param {string} voucherId - Voucher ID
   * @param {number} usedAmount - New used amount
   * @returns {Promise<Object>}
   */
  async updateVoucherUsage(voucherId, usedAmount) {
    const voucher = await Voucher.findByPk(voucherId);
    if (!voucher) {
      throw new Error('Voucher not found');
    }

    let { status } = voucher;

    // Update status based on usage
    if (voucher.totalValue) {
      const totalValue = parseFloat(voucher.totalValue);
      const used = parseFloat(usedAmount);

      if (used >= totalValue) {
        status = 'USED';
      } else if (used > 0) {
        status = 'PARTIALLY_USED';
      } else {
        status = 'OPEN';
      }
    }

    await voucher.update({ usedAmount, status });

    logger.info(`${this.modelName}: Voucher usage updated`, {
      voucherId,
      usedAmount,
      status,
    });

    // Invalidate cache
    await cacheService.invalidateUserVouchers(voucher.userId);

    return voucher;
  }

  /**
   * Reissue a voucher with remaining balance
   * Creates a new voucher with the remaining balance and marks the original as TRANSFERRED
   * @param {string} voucherId - Original voucher ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>}
   */
  async reissueVoucher(voucherId, userId) {
    logger.info(`${this.modelName}: Reissuing voucher`, { voucherId, userId });

    const originalVoucher = await this.findByIdAndVerifyOwnership(voucherId, userId);

    if (!originalVoucher) {
      throw new Error('Voucher not found or access denied');
    }

    const remainingBalance = originalVoucher.getRemainingBalance();

    if (!remainingBalance || remainingBalance <= 0) {
      throw new Error('No remaining balance to reissue');
    }

    if (originalVoucher.status === 'USED' || originalVoucher.status === 'TRANSFERRED') {
      throw new Error('Cannot reissue a voucher that is already used or transferred');
    }

    // Create new voucher with remaining balance
    const newVoucher = await this.create({
      userId,
      type: originalVoucher.type,
      issuer: originalVoucher.issuer,
      voucherNumber: `${originalVoucher.voucherNumber}-R${Date.now()}`, // Add reissue suffix
      associatedAccount: originalVoucher.associatedAccount,
      currency: originalVoucher.currency,
      totalValue: remainingBalance,
      usedAmount: 0,
      status: 'OPEN',
      expirationDate: originalVoucher.expirationDate,
      parentVoucherId: originalVoucher.id,
      notes: `Reissued from voucher ${originalVoucher.voucherNumber}`,
    });

    // Mark original voucher as transferred
    await originalVoucher.update({ status: 'TRANSFERRED' });

    logger.info(`${this.modelName}: Voucher reissued`, {
      originalVoucherId: voucherId,
      newVoucherId: newVoucher.id,
      remainingBalance,
    });

    // Invalidate cache
    await cacheService.invalidateUserVouchers(userId);

    return newVoucher;
  }

  /**
   * Get vouchers that are expiring soon
   * @param {string} userId - User ID
   * @param {number} days - Days threshold (default: 30)
   * @returns {Promise<Array>}
   */
  async getExpiringVouchers(userId, days = 30) {
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
   * @param {string} userId - User ID
   * @param {string} query - Search query
   * @param {number} limit - Max results
   * @returns {Promise<Array>}
   */
  async searchVouchers(userId, query, limit = 10) {
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
   * @param {string} userId - User ID
   * @returns {Promise<Object>}
   */
  async getVoucherStatistics(userId) {
    const [total, open, partiallyUsed, used, expired, totalValue] = await Promise.all([
      this.count({ userId }),
      this.count({ userId, status: 'OPEN' }),
      this.count({ userId, status: 'PARTIALLY_USED' }),
      this.count({ userId, status: 'USED' }),
      this.count({ userId, status: 'EXPIRED' }),
      Voucher.sum('totalValue', {
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

module.exports = new VoucherService();
