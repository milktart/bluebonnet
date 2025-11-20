/**
 * Unit Tests for VoucherService
 * Phase 5 - Testing Infrastructure
 */

const voucherService = require('../../../services/voucherService');
const { Voucher, VoucherAttachment } = require('../../../models');

// Mock the models
jest.mock('../../../models');

describe('VoucherService', () => {
  let mockUserId;
  let mockVoucherId;
  let mockFlightId;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUserId = 'user-123';
    mockVoucherId = 'voucher-456';
    mockFlightId = 'flight-789';
  });

  describe('getUserVouchers', () => {
    it('should get all vouchers for a user', async () => {
      const mockVouchers = [
        testHelpers.createTestVoucher(mockUserId, {
          id: mockVoucherId,
          type: 'TRAVEL_CREDIT',
          totalValue: 100,
        }),
      ];

      Voucher.findAll = jest.fn().mockResolvedValue(mockVouchers);

      const result = await voucherService.getUserVouchers(mockUserId);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('TRAVEL_CREDIT');
      expect(Voucher.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: mockUserId }),
        })
      );
    });

    it('should filter vouchers by status', async () => {
      const mockVouchers = [
        testHelpers.createTestVoucher(mockUserId, {
          id: mockVoucherId,
          status: 'OPEN',
        }),
      ];

      Voucher.findAll = jest.fn().mockResolvedValue(mockVouchers);

      const result = await voucherService.getUserVouchers(mockUserId, {
        status: 'OPEN',
      });

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('OPEN');
    });

    it('should filter out expired vouchers when requested', async () => {
      Voucher.findAll = jest.fn().mockResolvedValue([]);

      await voucherService.getUserVouchers(mockUserId, {
        showExpired: false,
      });

      expect(Voucher.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockUserId,
          }),
        })
      );
    });
  });

  describe('createVoucher', () => {
    it('should create a voucher with OPEN status', async () => {
      const voucherData = testHelpers.createTestVoucher(mockUserId, {
        voucherNumber: 'TEST123',
        totalValue: 100,
        usedAmount: 0,
      });

      Voucher.findOne = jest.fn().mockResolvedValue(null); // No existing voucher

      Voucher.create = jest.fn().mockResolvedValue({
        ...voucherData,
        id: mockVoucherId,
        status: 'OPEN',
      });

      const result = await voucherService.createVoucher(voucherData, mockUserId);

      expect(result.id).toBe(mockVoucherId);
      expect(result.status).toBe('OPEN');
      expect(Voucher.create).toHaveBeenCalled();

      // Verify the call includes userId and status
      const callArgs = Voucher.create.mock.calls[0][0];
      expect(callArgs.userId).toBe(mockUserId);
      expect(callArgs.status).toBe('OPEN');
    });

    it('should create voucher with PARTIALLY_USED status', async () => {
      const voucherData = testHelpers.createTestVoucher(mockUserId, {
        totalValue: 100,
        usedAmount: 30,
      });

      Voucher.findOne = jest.fn().mockResolvedValue(null);

      Voucher.create = jest.fn().mockResolvedValue({
        ...voucherData,
        id: mockVoucherId,
        status: 'PARTIALLY_USED',
      });

      const result = await voucherService.createVoucher(voucherData, mockUserId);

      expect(result.status).toBe('PARTIALLY_USED');
    });

    it('should create voucher with USED status', async () => {
      const voucherData = testHelpers.createTestVoucher(mockUserId, {
        totalValue: 100,
        usedAmount: 100,
      });

      Voucher.findOne = jest.fn().mockResolvedValue(null);

      Voucher.create = jest.fn().mockResolvedValue({
        ...voucherData,
        id: mockVoucherId,
        status: 'USED',
      });

      const result = await voucherService.createVoucher(voucherData, mockUserId);

      expect(result.status).toBe('USED');
    });

    it('should create voucher with EXPIRED status for past expiration', async () => {
      const voucherData = testHelpers.createTestVoucher(mockUserId, {
        expirationDate: '2020-01-01', // Past date
      });

      Voucher.findOne = jest.fn().mockResolvedValue(null);

      Voucher.create = jest.fn().mockResolvedValue({
        ...voucherData,
        id: mockVoucherId,
        status: 'EXPIRED',
      });

      const result = await voucherService.createVoucher(voucherData, mockUserId);

      expect(result.status).toBe('EXPIRED');
    });

    it('should throw error if voucher number already exists', async () => {
      const voucherData = testHelpers.createTestVoucher(mockUserId, {
        voucherNumber: 'DUPLICATE123',
      });

      Voucher.findOne = jest.fn().mockResolvedValue({
        id: 'existing-voucher',
        voucherNumber: 'DUPLICATE123',
      });

      await expect(voucherService.createVoucher(voucherData, mockUserId)).rejects.toThrow(
        'A voucher with this number already exists'
      );
    });
  });

  describe('updateVoucher', () => {
    it('should update voucher and recalculate status', async () => {
      const mockVoucher = {
        id: mockVoucherId,
        userId: mockUserId,
        totalValue: 100,
        usedAmount: 0,
        status: 'OPEN',
        update: jest.fn().mockResolvedValue(true),
      };

      Voucher.findByPk = jest.fn().mockResolvedValue(mockVoucher);

      const updatedData = {
        usedAmount: 50,
        totalValue: 100,
      };

      const result = await voucherService.updateVoucher(mockVoucherId, updatedData, mockUserId);

      expect(mockVoucher.update).toHaveBeenCalledWith({
        usedAmount: 50,
        totalValue: 100,
        status: 'PARTIALLY_USED',
      });
    });

    it('should update status to USED when fully used', async () => {
      const mockVoucher = {
        id: mockVoucherId,
        userId: mockUserId,
        update: jest.fn().mockResolvedValue(true),
      };

      Voucher.findByPk = jest.fn().mockResolvedValue(mockVoucher);

      const updatedData = {
        usedAmount: 100,
        totalValue: 100,
      };

      await voucherService.updateVoucher(mockVoucherId, updatedData, mockUserId);

      expect(mockVoucher.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'USED',
        })
      );
    });

    it('should return null when voucher not found', async () => {
      Voucher.findByPk = jest.fn().mockResolvedValue(null);

      const result = await voucherService.updateVoucher('non-existent', {}, mockUserId);

      expect(result).toBeNull();
    });
  });

  describe('deleteVoucher', () => {
    it('should delete voucher successfully', async () => {
      const mockVoucher = {
        id: mockVoucherId,
        userId: mockUserId,
        destroy: jest.fn().mockResolvedValue(true),
      };

      Voucher.findByPk = jest.fn().mockResolvedValue(mockVoucher);
      VoucherAttachment.count = jest.fn().mockResolvedValue(0);

      const result = await voucherService.deleteVoucher(mockVoucherId, mockUserId);

      expect(result).toBe(true);
      expect(mockVoucher.destroy).toHaveBeenCalled();
    });

    it('should delete voucher even with attachments (cascade)', async () => {
      const mockVoucher = {
        id: mockVoucherId,
        userId: mockUserId,
        destroy: jest.fn().mockResolvedValue(true),
      };

      Voucher.findByPk = jest.fn().mockResolvedValue(mockVoucher);
      VoucherAttachment.count = jest.fn().mockResolvedValue(2); // Has attachments

      const result = await voucherService.deleteVoucher(mockVoucherId, mockUserId);

      expect(result).toBe(true);
      expect(mockVoucher.destroy).toHaveBeenCalled();
    });

    it('should return false when voucher not found', async () => {
      Voucher.findByPk = jest.fn().mockResolvedValue(null);

      const result = await voucherService.deleteVoucher('non-existent', mockUserId);

      expect(result).toBe(false);
    });
  });

  describe('attachVoucherToFlight', () => {
    it('should attach voucher to flight successfully', async () => {
      const mockVoucher = {
        id: mockVoucherId,
        totalValue: 100,
        usedAmount: 0,
        status: 'OPEN',
        getRemainingBalance: jest.fn().mockReturnValue(100),
        update: jest.fn().mockResolvedValue(true),
      };

      // First call returns voucher for attachVoucherToFlight
      // Second call returns voucher for updateVoucherUsage
      Voucher.findByPk = jest.fn().mockResolvedValue(mockVoucher);

      VoucherAttachment.create = jest.fn().mockResolvedValue({
        id: 'attachment-123',
        voucherId: mockVoucherId,
        flightId: mockFlightId,
        amountUsed: 50,
      });

      const result = await voucherService.attachVoucherToFlight(
        mockVoucherId,
        mockFlightId,
        'traveler-123',
        'USER',
        50
      );

      expect(result.voucherId).toBe(mockVoucherId);
      expect(result.flightId).toBe(mockFlightId);
      expect(VoucherAttachment.create).toHaveBeenCalled();
      expect(mockVoucher.update).toHaveBeenCalled();
    });

    it('should throw error if voucher not found', async () => {
      Voucher.findByPk = jest.fn().mockResolvedValue(null);

      await expect(
        voucherService.attachVoucherToFlight(mockVoucherId, mockFlightId, 'traveler', 'USER', 50)
      ).rejects.toThrow('Voucher not found');
    });

    it('should throw error if insufficient balance', async () => {
      const mockVoucher = {
        id: mockVoucherId,
        totalValue: 100,
        usedAmount: 90,
        getRemainingBalance: jest.fn().mockReturnValue(10),
      };

      Voucher.findByPk = jest.fn().mockResolvedValue(mockVoucher);

      await expect(
        voucherService.attachVoucherToFlight(mockVoucherId, mockFlightId, 'traveler', 'USER', 50)
      ).rejects.toThrow('Insufficient voucher balance');
    });
  });

  describe('reissueVoucher', () => {
    it('should reissue voucher with remaining balance', async () => {
      const mockVoucher = {
        id: mockVoucherId,
        userId: mockUserId,
        type: 'TRAVEL_CREDIT',
        issuer: 'Test Airlines',
        voucherNumber: 'ABC123',
        totalValue: 100,
        usedAmount: 30,
        status: 'PARTIALLY_USED',
        expirationDate: '2026-01-01',
        getRemainingBalance: jest.fn().mockReturnValue(70),
        update: jest.fn().mockResolvedValue(true),
      };

      Voucher.findByPk = jest.fn().mockResolvedValue(mockVoucher);

      Voucher.create = jest.fn().mockResolvedValue({
        id: 'new-voucher-123',
        totalValue: 70,
        usedAmount: 0,
        status: 'OPEN',
        voucherNumber: expect.stringContaining('ABC123-R'),
      });

      const result = await voucherService.reissueVoucher(mockVoucherId, mockUserId);

      expect(result.totalValue).toBe(70);
      expect(result.status).toBe('OPEN');
      expect(mockVoucher.update).toHaveBeenCalledWith({ status: 'TRANSFERRED' });
    });

    it('should throw error if no remaining balance', async () => {
      const mockVoucher = {
        id: mockVoucherId,
        userId: mockUserId,
        getRemainingBalance: jest.fn().mockReturnValue(0),
      };

      Voucher.findByPk = jest.fn().mockResolvedValue(mockVoucher);

      await expect(voucherService.reissueVoucher(mockVoucherId, mockUserId)).rejects.toThrow(
        'No remaining balance to reissue'
      );
    });

    it('should throw error if voucher is USED', async () => {
      const mockVoucher = {
        id: mockVoucherId,
        userId: mockUserId,
        status: 'USED',
        getRemainingBalance: jest.fn().mockReturnValue(10),
      };

      Voucher.findByPk = jest.fn().mockResolvedValue(mockVoucher);

      await expect(voucherService.reissueVoucher(mockVoucherId, mockUserId)).rejects.toThrow(
        'Cannot reissue a voucher that is already used or transferred'
      );
    });
  });

  describe('getExpiringVouchers', () => {
    it('should get vouchers expiring within 30 days', async () => {
      const mockVouchers = [
        testHelpers.createTestVoucher(mockUserId, {
          id: 'voucher-1',
          expirationDate: '2025-12-15', // Within 30 days
          status: 'OPEN',
        }),
      ];

      Voucher.findAll = jest.fn().mockResolvedValue(mockVouchers);

      const result = await voucherService.getExpiringVouchers(mockUserId, 30);

      expect(result).toHaveLength(1);
      expect(Voucher.findAll).toHaveBeenCalled();
    });

    it('should use custom days threshold', async () => {
      Voucher.findAll = jest.fn().mockResolvedValue([]);

      await voucherService.getExpiringVouchers(mockUserId, 60);

      expect(Voucher.findAll).toHaveBeenCalled();
    });
  });

  describe('searchVouchers', () => {
    it('should search vouchers by number', async () => {
      const mockVouchers = [
        testHelpers.createTestVoucher(mockUserId, {
          id: 'voucher-1',
          voucherNumber: 'ABC123',
        }),
      ];

      Voucher.findAll = jest.fn().mockResolvedValue(mockVouchers);

      const result = await voucherService.searchVouchers(mockUserId, 'ABC');

      expect(result).toHaveLength(1);
      expect(result[0].voucherNumber).toContain('ABC');
    });

    it('should search vouchers by issuer', async () => {
      const mockVouchers = [
        testHelpers.createTestVoucher(mockUserId, {
          id: 'voucher-1',
          issuer: 'Test Airlines',
        }),
      ];

      Voucher.findAll = jest.fn().mockResolvedValue(mockVouchers);

      const result = await voucherService.searchVouchers(mockUserId, 'airlines');

      expect(result).toHaveLength(1);
      expect(result[0].issuer).toContain('Airlines');
    });
  });

  describe('getVoucherStatistics', () => {
    it('should calculate voucher statistics correctly', async () => {
      Voucher.count = jest
        .fn()
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(5) // open
        .mockResolvedValueOnce(2) // partially used
        .mockResolvedValueOnce(2) // used
        .mockResolvedValueOnce(1); // expired

      Voucher.sum = jest.fn().mockResolvedValue(500); // Total value

      const result = await voucherService.getVoucherStatistics(mockUserId);

      expect(result.total).toBe(10);
      expect(result.open).toBe(5);
      expect(result.partiallyUsed).toBe(2);
      expect(result.used).toBe(2);
      expect(result.expired).toBe(1);
      expect(result.totalValue).toBe(500);
    });

    it('should handle null totalValue sum', async () => {
      Voucher.count = jest.fn().mockResolvedValue(0);
      Voucher.sum = jest.fn().mockResolvedValue(null); // No vouchers

      const result = await voucherService.getVoucherStatistics(mockUserId);

      expect(result.totalValue).toBe(0);
    });
  });

  describe('updateVoucherUsage', () => {
    it('should update voucher usage and status', async () => {
      const mockVoucher = {
        id: mockVoucherId,
        totalValue: 100,
        status: 'OPEN',
        update: jest.fn().mockResolvedValue(true),
      };

      Voucher.findByPk = jest.fn().mockResolvedValue(mockVoucher);

      const result = await voucherService.updateVoucherUsage(mockVoucherId, 50);

      expect(mockVoucher.update).toHaveBeenCalledWith({
        usedAmount: 50,
        status: 'PARTIALLY_USED',
      });
    });

    it('should throw error if voucher not found', async () => {
      Voucher.findByPk = jest.fn().mockResolvedValue(null);

      await expect(voucherService.updateVoucherUsage('non-existent', 50)).rejects.toThrow(
        'Voucher not found'
      );
    });
  });
});
