/**
 * Unit Tests for CompanionService
 * Phase 5 - Testing Infrastructure
 */

const companionService = require('../../../services/companionService');
const { TravelCompanion, User, Trip, TripCompanion } = require('../../../models');

// Mock the models
jest.mock('../../../models');

describe('CompanionService', () => {
  let mockUserId;
  let mockCompanionId;
  let mockTripId;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUserId = 'user-123';
    mockCompanionId = 'companion-456';
    mockTripId = 'trip-789';
  });

  describe('getUserCompanions', () => {
    it('should get all companions for a user', async () => {
      const mockCompanions = [
        testHelpers.createTestCompanion(mockUserId, {
          id: mockCompanionId,
          firstName: 'Jane',
          lastName: 'Doe',
        }),
      ];

      TravelCompanion.findAll = jest.fn().mockResolvedValue(mockCompanions);

      const result = await companionService.getUserCompanions(mockUserId);

      expect(result).toHaveLength(1);
      expect(result[0].firstName).toBe('Jane');
      // Verify the call includes the filter to exclude the user's own companion profile
      const callArg = TravelCompanion.findAll.mock.calls[0][0];
      expect(callArg.where.createdBy).toBe(mockUserId);
      const orSymbol = Symbol.for('or') || Object.getOwnPropertySymbols(callArg.where)[0];
      expect(callArg.where[orSymbol]).toBeDefined();
    });

    it('should return empty array when user has no companions', async () => {
      TravelCompanion.findAll = jest.fn().mockResolvedValue([]);

      const result = await companionService.getUserCompanions(mockUserId);

      expect(result).toHaveLength(0);
    });
  });

  describe('createCompanion', () => {
    it('should create a companion successfully', async () => {
      const companionData = testHelpers.createTestCompanion(mockUserId);

      TravelCompanion.findOne = jest.fn().mockResolvedValue(null); // No existing
      User.findOne = jest.fn().mockResolvedValue(null); // No linked account

      TravelCompanion.create = jest.fn().mockResolvedValue({
        ...companionData,
        id: mockCompanionId,
      });

      const result = await companionService.createCompanion(companionData, mockUserId);

      expect(result.id).toBe(mockCompanionId);
      expect(result.email).toBe(companionData.email);
      expect(TravelCompanion.create).toHaveBeenCalled();

      // Verify the call includes createdBy and userId
      const callArgs = TravelCompanion.create.mock.calls[0][0];
      expect(callArgs.createdBy).toBe(mockUserId);
      expect(callArgs.userId).toBeNull(); // No linked account
    });

    it('should link companion to existing user account', async () => {
      const companionData = testHelpers.createTestCompanion(mockUserId, {
        email: 'existing@example.com',
      });

      const mockLinkedUser = {
        id: 'linked-user-123',
        email: 'existing@example.com',
      };

      TravelCompanion.findOne = jest.fn().mockResolvedValue(null);
      User.findOne = jest.fn().mockResolvedValue(mockLinkedUser);

      TravelCompanion.create = jest.fn().mockResolvedValue({
        ...companionData,
        id: mockCompanionId,
        userId: mockLinkedUser.id,
      });

      const result = await companionService.createCompanion(companionData, mockUserId);

      expect(result.userId).toBe(mockLinkedUser.id);
      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: companionData.email },
      });
    });

    it('should throw error if companion with email already exists', async () => {
      const companionData = testHelpers.createTestCompanion(mockUserId);

      TravelCompanion.findOne = jest.fn().mockResolvedValue({
        id: 'existing-companion',
        email: companionData.email,
      });

      await expect(companionService.createCompanion(companionData, mockUserId)).rejects.toThrow(
        'A companion with this email already exists'
      );
    });
  });

  describe('updateCompanion', () => {
    it('should update companion successfully', async () => {
      const mockCompanion = {
        id: mockCompanionId,
        firstName: 'Jane',
        email: 'jane@example.com',
        userId: mockUserId, // BaseService.verifyOwnership checks userId field
        update: jest.fn().mockImplementation(function (data) {
          Object.assign(this, data);
          return Promise.resolve(this);
        }),
      };

      TravelCompanion.findByPk = jest.fn().mockResolvedValue(mockCompanion);

      const updatedData = { firstName: 'Janet' };
      const result = await companionService.updateCompanion(
        mockCompanionId,
        updatedData,
        mockUserId
      );

      expect(result).toBeDefined();
      expect(mockCompanion.update).toHaveBeenCalledWith(updatedData);
    });

    it('should update linked account when email changes', async () => {
      const mockCompanion = {
        id: mockCompanionId,
        email: 'old@example.com',
        userId: mockUserId, // BaseService.verifyOwnership checks userId field
        update: jest.fn().mockImplementation(function (data) {
          Object.assign(this, data);
          return Promise.resolve(this);
        }),
      };

      const mockLinkedUser = {
        id: 'new-linked-user',
        email: 'new@example.com',
      };

      TravelCompanion.findByPk = jest.fn().mockResolvedValue(mockCompanion);
      User.findOne = jest.fn().mockResolvedValue(mockLinkedUser);

      const updatedData = { email: 'new@example.com' };
      await companionService.updateCompanion(mockCompanionId, updatedData, mockUserId);

      expect(mockCompanion.update).toHaveBeenCalledWith({
        email: 'new@example.com',
        userId: mockLinkedUser.id,
      });
    });

    it('should return null when companion not found', async () => {
      TravelCompanion.findByPk = jest.fn().mockResolvedValue(null);

      const result = await companionService.updateCompanion('non-existent', {}, mockUserId);

      expect(result).toBeNull();
    });
  });

  describe('deleteCompanion', () => {
    it('should delete companion when not in use', async () => {
      const mockCompanion = {
        id: mockCompanionId,
        userId: mockUserId, // BaseService.verifyOwnership checks userId field
        destroy: jest.fn().mockResolvedValue(true),
      };

      TravelCompanion.findByPk = jest.fn().mockResolvedValue(mockCompanion);
      TripCompanion.count = jest.fn().mockResolvedValue(0); // Not in use

      const result = await companionService.deleteCompanion(mockCompanionId, mockUserId);

      expect(result).toBe(true);
      expect(mockCompanion.destroy).toHaveBeenCalled();
    });

    it('should throw error if companion is in use', async () => {
      const mockCompanion = {
        id: mockCompanionId,
        userId: mockUserId, // BaseService.verifyOwnership checks userId field
      };

      TravelCompanion.findByPk = jest.fn().mockResolvedValue(mockCompanion);
      TripCompanion.count = jest.fn().mockResolvedValue(3); // Used in 3 trips

      await expect(companionService.deleteCompanion(mockCompanionId, mockUserId)).rejects.toThrow(
        'associated with 3 trip(s)'
      );
    });

    it('should return false when companion not found', async () => {
      TravelCompanion.findByPk = jest.fn().mockResolvedValue(null);

      const result = await companionService.deleteCompanion('non-existent', mockUserId);

      expect(result).toBe(false);
    });
  });

  describe('addCompanionToTrip', () => {
    it('should add companion to trip successfully', async () => {
      const mockTrip = {
        id: mockTripId,
        userId: mockUserId,
        defaultCompanionEditPermission: false,
      };

      const mockCompanion = {
        id: mockCompanionId,
      };

      Trip.findByPk = jest.fn().mockResolvedValue(mockTrip);
      TravelCompanion.findByPk = jest.fn().mockResolvedValue(mockCompanion);
      TripCompanion.findOne = jest.fn().mockResolvedValue(null); // Not already on trip

      TripCompanion.create = jest.fn().mockResolvedValue({
        tripId: mockTripId,
        companionId: mockCompanionId,
        hasEditPermission: false,
      });

      const result = await companionService.addCompanionToTrip(
        mockTripId,
        mockCompanionId,
        mockUserId
      );

      expect(result.tripId).toBe(mockTripId);
      expect(result.companionId).toBe(mockCompanionId);
      expect(TripCompanion.create).toHaveBeenCalled();
    });

    it('should throw error if trip not found', async () => {
      Trip.findByPk = jest.fn().mockResolvedValue(null);

      await expect(
        companionService.addCompanionToTrip(mockTripId, mockCompanionId, mockUserId)
      ).rejects.toThrow('Trip not found or access denied');
    });

    it('should throw error if user is not trip owner', async () => {
      const mockTrip = {
        id: mockTripId,
        userId: 'other-user',
      };

      Trip.findByPk = jest.fn().mockResolvedValue(mockTrip);

      await expect(
        companionService.addCompanionToTrip(mockTripId, mockCompanionId, mockUserId)
      ).rejects.toThrow('Trip not found or access denied');
    });

    it('should throw error if companion already on trip', async () => {
      const mockTrip = {
        id: mockTripId,
        userId: mockUserId,
      };

      const mockCompanion = {
        id: mockCompanionId,
      };

      Trip.findByPk = jest.fn().mockResolvedValue(mockTrip);
      TravelCompanion.findByPk = jest.fn().mockResolvedValue(mockCompanion);
      TripCompanion.findOne = jest.fn().mockResolvedValue({
        tripId: mockTripId,
        companionId: mockCompanionId,
      });

      await expect(
        companionService.addCompanionToTrip(mockTripId, mockCompanionId, mockUserId)
      ).rejects.toThrow('already on this trip');
    });
  });

  describe('removeCompanionFromTrip', () => {
    it('should remove companion from trip successfully', async () => {
      const mockTrip = {
        id: mockTripId,
        userId: mockUserId,
      };

      Trip.findByPk = jest.fn().mockResolvedValue(mockTrip);
      TripCompanion.destroy = jest.fn().mockResolvedValue(1); // 1 record deleted

      const result = await companionService.removeCompanionFromTrip(
        mockTripId,
        mockCompanionId,
        mockUserId
      );

      expect(result).toBe(true);
      expect(TripCompanion.destroy).toHaveBeenCalledWith({
        where: { tripId: mockTripId, companionId: mockCompanionId },
      });
    });

    it('should return false when companion not found on trip', async () => {
      const mockTrip = {
        id: mockTripId,
        userId: mockUserId,
      };

      Trip.findByPk = jest.fn().mockResolvedValue(mockTrip);
      TripCompanion.destroy = jest.fn().mockResolvedValue(0); // 0 records deleted

      const result = await companionService.removeCompanionFromTrip(
        mockTripId,
        mockCompanionId,
        mockUserId
      );

      expect(result).toBe(false);
    });
  });

  describe('searchCompanions', () => {
    it('should search companions by name', async () => {
      const mockCompanions = [
        testHelpers.createTestCompanion(mockUserId, {
          id: 'comp-1',
          firstName: 'Jane',
          lastName: 'Doe',
        }),
      ];

      TravelCompanion.findAll = jest.fn().mockResolvedValue(mockCompanions);

      const result = await companionService.searchCompanions(mockUserId, 'jane');

      expect(result).toHaveLength(1);
      expect(result[0].firstName).toBe('Jane');
    });

    it('should search companions by email', async () => {
      const mockCompanions = [
        testHelpers.createTestCompanion(mockUserId, {
          id: 'comp-1',
          email: 'jane@example.com',
        }),
      ];

      TravelCompanion.findAll = jest.fn().mockResolvedValue(mockCompanions);

      const result = await companionService.searchCompanions(mockUserId, 'jane@');

      expect(result).toHaveLength(1);
      expect(result[0].email).toContain('jane@');
    });
  });

  describe('linkCompanionToAccount', () => {
    it('should link companion to user account', async () => {
      const mockCompanion = {
        id: mockCompanionId,
        update: jest.fn().mockResolvedValue(true),
      };

      const mockUser = {
        id: 'account-123',
      };

      TravelCompanion.findByPk = jest.fn().mockResolvedValue(mockCompanion);
      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      await companionService.linkCompanionToAccount(mockCompanionId, mockUser.id);

      expect(mockCompanion.update).toHaveBeenCalledWith({ userId: mockUser.id });
    });

    it('should throw error if companion not found', async () => {
      TravelCompanion.findByPk = jest.fn().mockResolvedValue(null);

      await expect(
        companionService.linkCompanionToAccount(mockCompanionId, 'account-123')
      ).rejects.toThrow('Companion not found');
    });

    it('should throw error if user account not found', async () => {
      const mockCompanion = {
        id: mockCompanionId,
      };

      TravelCompanion.findByPk = jest.fn().mockResolvedValue(mockCompanion);
      User.findByPk = jest.fn().mockResolvedValue(null);

      await expect(
        companionService.linkCompanionToAccount(mockCompanionId, 'non-existent')
      ).rejects.toThrow('User account not found');
    });
  });
});
