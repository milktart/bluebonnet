/**
 * Companion Permissions Integration Tests
 * Tests for unified permission model across global, trip, and item levels
 */

const companionPermissionManager = require('../../services/CompanionPermissionManager');
const db = require('../../models');

// Mock database models
jest.mock('../../models', () => ({
  CompanionPermission: {
    findOne: jest.fn(),
    findOrCreate: jest.fn(),
  },
  TripCompanion: {
    findOne: jest.fn(),
  },
  ItemCompanion: {
    findOne: jest.fn(),
  },
  Trip: {
    findByPk: jest.fn(),
  },
  Flight: {
    findByPk: jest.fn(),
  },
  Hotel: {
    findByPk: jest.fn(),
  },
  Transportation: {
    findByPk: jest.fn(),
  },
  CarRental: {
    findByPk: jest.fn(),
  },
  Event: {
    findByPk: jest.fn(),
  },
  TravelCompanion: {
    findAll: jest.fn(),
  },
  Sequelize: {
    Op: {
      in: Symbol('in'),
      is: Symbol('is'),
      ne: Symbol('ne'),
    },
  },
}));

describe('Companion Permission Manager', () => {
  const userId = 'user-123';
  const targetUserId = 'user-456';
  const companionId = 'companion-123';
  const tripId = 'trip-123';
  const itemId = 'item-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Global Permissions (User to User)', () => {
    describe('canViewTripsOf', () => {
      it('should return true when companion has canView permission', async () => {
        const mockPermission = {
          companionId,
          grantedBy: userId,
          canView: true,
          canEdit: false,
          canManageCompanions: false,
        };

        db.TravelCompanion.findAll.mockResolvedValue([{ id: companionId }]);
        db.CompanionPermission.findOne.mockResolvedValue(mockPermission);

        const result = await companionPermissionManager.canViewTripsOf(userId, targetUserId);

        expect(result).toBe(true);
        expect(db.CompanionPermission.findOne).toHaveBeenCalled();
      });

      it('should return false when companion does not have canView permission', async () => {
        const mockPermission = {
          companionId,
          grantedBy: userId,
          canView: false,
          canEdit: false,
          canManageCompanions: false,
        };

        db.TravelCompanion.findAll.mockResolvedValue([{ id: companionId }]);
        db.CompanionPermission.findOne.mockResolvedValue(mockPermission);

        const result = await companionPermissionManager.canViewTripsOf(userId, targetUserId);

        expect(result).toBe(false);
      });

      it('should return false when no permission record exists', async () => {
        db.TravelCompanion.findAll.mockResolvedValue([{ id: companionId }]);
        db.CompanionPermission.findOne.mockResolvedValue(null);

        const result = await companionPermissionManager.canViewTripsOf(userId, targetUserId);

        expect(result).toBe(false);
      });
    });

    describe('canEditTripsOf', () => {
      it('should return true when companion has canEdit permission', async () => {
        const mockPermission = {
          companionId,
          grantedBy: userId,
          canView: true,
          canEdit: true,
          canManageCompanions: false,
        };

        db.TravelCompanion.findAll.mockResolvedValue([{ id: companionId }]);
        db.CompanionPermission.findOne.mockResolvedValue(mockPermission);

        const result = await companionPermissionManager.canEditTripsOf(userId, targetUserId);

        expect(result).toBe(true);
      });

      it('should return false when companion does not have canEdit permission', async () => {
        const mockPermission = {
          companionId,
          grantedBy: userId,
          canView: true,
          canEdit: false,
          canManageCompanions: false,
        };

        db.TravelCompanion.findAll.mockResolvedValue([{ id: companionId }]);
        db.CompanionPermission.findOne.mockResolvedValue(mockPermission);

        const result = await companionPermissionManager.canEditTripsOf(userId, targetUserId);

        expect(result).toBe(false);
      });
    });

    describe('canManageCompanionsOf', () => {
      it('should return true when companion has canManageCompanions permission', async () => {
        const mockPermission = {
          companionId,
          grantedBy: userId,
          canView: true,
          canEdit: false,
          canManageCompanions: true,
        };

        db.TravelCompanion.findAll.mockResolvedValue([{ id: companionId }]);
        db.CompanionPermission.findOne.mockResolvedValue(mockPermission);

        const result = await companionPermissionManager.canManageCompanionsOf(userId, targetUserId);

        expect(result).toBe(true);
      });

      it('should allow independent permissions (edit without manage)', async () => {
        const mockPermission = {
          companionId,
          grantedBy: userId,
          canView: true,
          canEdit: true,
          canManageCompanions: false,
        };

        db.TravelCompanion.findAll.mockResolvedValue([{ id: companionId }]);
        db.CompanionPermission.findOne.mockResolvedValue(mockPermission);

        const canEdit = await companionPermissionManager.canEditTripsOf(userId, targetUserId);
        const canManage = await companionPermissionManager.canManageCompanionsOf(userId, targetUserId);

        expect(canEdit).toBe(true);
        expect(canManage).toBe(false);
      });
    });
  });

  describe('Trip-Level Permissions', () => {
    describe('canViewTrip', () => {
      it('should return true if user is trip owner', async () => {
        const mockTrip = {
          id: tripId,
          userId,
        };

        db.Trip.findByPk.mockResolvedValue(mockTrip);

        const result = await companionPermissionManager.canViewTrip(userId, tripId);

        expect(result).toBe(true);
      });

      it('should return true if companion has canView permission on trip', async () => {
        const mockTrip = {
          id: tripId,
          userId: targetUserId,
        };

        const mockTripCompanion = {
          tripId,
          companionId,
          canView: true,
          canEdit: false,
          canManageCompanions: false,
        };

        db.Trip.findByPk.mockResolvedValue(mockTrip);
        db.TravelCompanion.findAll.mockResolvedValue([{ id: companionId }]);
        db.TripCompanion.findOne.mockResolvedValue(mockTripCompanion);

        const result = await companionPermissionManager.canViewTrip(userId, tripId);

        expect(result).toBe(true);
      });

      it('should return false if companion does not have canView permission', async () => {
        const mockTrip = {
          id: tripId,
          userId: targetUserId,
        };

        const mockTripCompanion = {
          tripId,
          companionId,
          canView: false,
          canEdit: false,
          canManageCompanions: false,
        };

        db.Trip.findByPk.mockResolvedValue(mockTrip);
        db.TravelCompanion.findAll.mockResolvedValue([{ id: companionId }]);
        db.TripCompanion.findOne.mockResolvedValue(mockTripCompanion);

        const result = await companionPermissionManager.canViewTrip(userId, tripId);

        expect(result).toBe(false);
      });
    });

    describe('canEditTrip', () => {
      it('should return true if user is trip owner', async () => {
        const mockTrip = {
          id: tripId,
          userId,
        };

        db.Trip.findByPk.mockResolvedValue(mockTrip);

        const result = await companionPermissionManager.canEditTrip(userId, tripId);

        expect(result).toBe(true);
      });

      it('should return true if companion has canEdit permission on trip', async () => {
        const mockTrip = {
          id: tripId,
          userId: targetUserId,
        };

        const mockTripCompanion = {
          tripId,
          companionId,
          canView: true,
          canEdit: true,
          canManageCompanions: false,
        };

        db.Trip.findByPk.mockResolvedValue(mockTrip);
        db.TravelCompanion.findAll.mockResolvedValue([{ id: companionId }]);
        db.TripCompanion.findOne.mockResolvedValue(mockTripCompanion);

        const result = await companionPermissionManager.canEditTrip(userId, tripId);

        expect(result).toBe(true);
      });
    });

    describe('canManageCompanionsOnTrip', () => {
      it('should return true if user is trip owner', async () => {
        const mockTrip = {
          id: tripId,
          userId,
        };

        db.Trip.findByPk.mockResolvedValue(mockTrip);

        const result = await companionPermissionManager.canManageCompanionsOnTrip(userId, tripId);

        expect(result).toBe(true);
      });

      it('should return true if companion has canManageCompanions permission on trip', async () => {
        const mockTrip = {
          id: tripId,
          userId: targetUserId,
        };

        const mockTripCompanion = {
          tripId,
          companionId,
          canView: true,
          canEdit: false,
          canManageCompanions: true,
        };

        db.Trip.findByPk.mockResolvedValue(mockTrip);
        db.TravelCompanion.findAll.mockResolvedValue([{ id: companionId }]);
        db.TripCompanion.findOne.mockResolvedValue(mockTripCompanion);

        const result = await companionPermissionManager.canManageCompanionsOnTrip(userId, tripId);

        expect(result).toBe(true);
      });
    });
  });

  describe('Item-Level Permissions (with fallback)', () => {
    describe('canViewItem', () => {
      it('should return true if user is item owner', async () => {
        const mockItem = {
          id: itemId,
          userId,
          tripId: null,
        };

        db.Flight.findByPk.mockResolvedValue(mockItem);

        const result = await companionPermissionManager.canViewItem(userId, 'flight', itemId);

        expect(result).toBe(true);
      });

      it('should use item-level permission if it exists', async () => {
        const mockItem = {
          id: itemId,
          userId: targetUserId,
          tripId: null,
        };

        const mockItemCompanion = {
          itemType: 'flight',
          itemId,
          companionId,
          canView: true,
          canEdit: false,
          canManageCompanions: false,
        };

        db.Flight.findByPk.mockResolvedValue(mockItem);
        db.TravelCompanion.findAll.mockResolvedValue([{ id: companionId }]);
        db.ItemCompanion.findOne.mockResolvedValue(mockItemCompanion);

        const result = await companionPermissionManager.canViewItem(userId, 'flight', itemId);

        expect(result).toBe(true);
      });

      it('should fall back to trip permission if item permission does not exist', async () => {
        const mockItem = {
          id: itemId,
          userId: targetUserId,
          tripId,
        };

        const mockTripCompanion = {
          tripId,
          companionId,
          canView: true,
          canEdit: false,
          canManageCompanions: false,
        };

        db.Flight.findByPk.mockResolvedValue(mockItem);
        db.TravelCompanion.findAll.mockResolvedValue([{ id: companionId }]);
        db.ItemCompanion.findOne.mockResolvedValue(null);
        db.TripCompanion.findOne.mockResolvedValue(mockTripCompanion);

        const result = await companionPermissionManager.canViewItem(userId, 'flight', itemId);

        expect(result).toBe(true);
      });

      it('should prioritize item-level permission over trip-level', async () => {
        const mockItem = {
          id: itemId,
          userId: targetUserId,
          tripId,
        };

        const mockItemCompanion = {
          itemType: 'flight',
          itemId,
          companionId,
          canView: false, // Item level says no
          canEdit: false,
          canManageCompanions: false,
        };

        const mockTripCompanion = {
          tripId,
          companionId,
          canView: true, // Trip level says yes
          canEdit: false,
          canManageCompanions: false,
        };

        db.Flight.findByPk.mockResolvedValue(mockItem);
        db.TravelCompanion.findAll.mockResolvedValue([{ id: companionId }]);
        db.ItemCompanion.findOne.mockResolvedValue(mockItemCompanion);
        db.TripCompanion.findOne.mockResolvedValue(mockTripCompanion);

        const result = await companionPermissionManager.canViewItem(userId, 'flight', itemId);

        expect(result).toBe(false); // Item-level takes precedence
      });
    });

    describe('canEditItem', () => {
      it('should return true if user is item owner', async () => {
        const mockItem = {
          id: itemId,
          userId,
          tripId: null,
        };

        db.Hotel.findByPk.mockResolvedValue(mockItem);

        const result = await companionPermissionManager.canEditItem(userId, 'hotel', itemId);

        expect(result).toBe(true);
      });

      it('should use item-level permission if it exists', async () => {
        const mockItem = {
          id: itemId,
          userId: targetUserId,
          tripId: null,
        };

        const mockItemCompanion = {
          itemType: 'hotel',
          itemId,
          companionId,
          canView: true,
          canEdit: true,
          canManageCompanions: false,
        };

        db.Hotel.findByPk.mockResolvedValue(mockItem);
        db.TravelCompanion.findAll.mockResolvedValue([{ id: companionId }]);
        db.ItemCompanion.findOne.mockResolvedValue(mockItemCompanion);

        const result = await companionPermissionManager.canEditItem(userId, 'hotel', itemId);

        expect(result).toBe(true);
      });

      it('should fall back to trip permission', async () => {
        const mockItem = {
          id: itemId,
          userId: targetUserId,
          tripId,
        };

        const mockTripCompanion = {
          tripId,
          companionId,
          canView: true,
          canEdit: true,
          canManageCompanions: false,
        };

        db.Hotel.findByPk.mockResolvedValue(mockItem);
        db.TravelCompanion.findAll.mockResolvedValue([{ id: companionId }]);
        db.ItemCompanion.findOne.mockResolvedValue(null);
        db.TripCompanion.findOne.mockResolvedValue(mockTripCompanion);

        const result = await companionPermissionManager.canEditItem(userId, 'hotel', itemId);

        expect(result).toBe(true);
      });
    });

    describe('canManageCompanionsOnItem', () => {
      it('should return true if user is item owner', async () => {
        const mockItem = {
          id: itemId,
          userId,
          tripId: null,
        };

        db.Event.findByPk.mockResolvedValue(mockItem);

        const result = await companionPermissionManager.canManageCompanionsOnItem(
          userId,
          'event',
          itemId
        );

        expect(result).toBe(true);
      });

      it('should use item-level permission if it exists', async () => {
        const mockItem = {
          id: itemId,
          userId: targetUserId,
          tripId: null,
        };

        const mockItemCompanion = {
          itemType: 'event',
          itemId,
          companionId,
          canView: true,
          canEdit: false,
          canManageCompanions: true,
        };

        db.Event.findByPk.mockResolvedValue(mockItem);
        db.TravelCompanion.findAll.mockResolvedValue([{ id: companionId }]);
        db.ItemCompanion.findOne.mockResolvedValue(mockItemCompanion);

        const result = await companionPermissionManager.canManageCompanionsOnItem(
          userId,
          'event',
          itemId
        );

        expect(result).toBe(true);
      });
    });
  });

  describe('Permission Updates', () => {
    describe('updateCompanionPermissions', () => {
      it('should create permission record if not exists', async () => {
        const permissions = { canView: true, canEdit: true, canManageCompanions: false };
        const mockPermission = { ...permissions, companionId, grantedBy: userId, update: jest.fn() };

        db.CompanionPermission.findOrCreate.mockResolvedValue([mockPermission, true]);

        await companionPermissionManager.updateCompanionPermissions(userId, companionId, permissions);

        expect(db.CompanionPermission.findOrCreate).toHaveBeenCalledWith({
          where: { companionId, grantedBy: userId },
          defaults: { companionId, grantedBy: userId, ...permissions },
        });
      });

      it('should update permission record if exists', async () => {
        const permissions = { canView: true, canEdit: false, canManageCompanions: true };
        const mockPermission = { ...permissions, companionId, grantedBy: userId, update: jest.fn() };

        db.CompanionPermission.findOrCreate.mockResolvedValue([mockPermission, false]);

        await companionPermissionManager.updateCompanionPermissions(userId, companionId, permissions);

        expect(mockPermission.update).toHaveBeenCalledWith(permissions);
      });
    });

    describe('updateTripCompanionPermissions', () => {
      it('should update trip companion permissions', async () => {
        const permissions = { canView: true, canEdit: true, canManageCompanions: false };
        const mockTripCompanion = {
          tripId,
          companionId,
          ...permissions,
          update: jest.fn(),
        };

        db.TripCompanion.findOne.mockResolvedValue(mockTripCompanion);

        await companionPermissionManager.updateTripCompanionPermissions(
          userId,
          tripId,
          companionId,
          permissions
        );

        expect(mockTripCompanion.update).toHaveBeenCalledWith(permissions);
      });
    });

    describe('updateItemCompanionPermissions', () => {
      it('should update item companion permissions', async () => {
        const permissions = { canView: true, canEdit: false, canManageCompanions: true };
        const mockItemCompanion = {
          itemType: 'flight',
          itemId,
          companionId,
          ...permissions,
          update: jest.fn(),
        };

        db.ItemCompanion.findOne.mockResolvedValue(mockItemCompanion);

        await companionPermissionManager.updateItemCompanionPermissions(
          userId,
          'flight',
          itemId,
          companionId,
          permissions
        );

        expect(mockItemCompanion.update).toHaveBeenCalledWith(permissions);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle non-existent trip', async () => {
      db.Trip.findByPk.mockResolvedValue(null);

      const result = await companionPermissionManager.canViewTrip(userId, tripId);

      expect(result).toBe(false);
    });

    it('should handle non-existent item', async () => {
      db.Flight.findByPk.mockResolvedValue(null);

      const result = await companionPermissionManager.canViewItem(userId, 'flight', itemId);

      expect(result).toBe(false);
    });

    it('should throw error for invalid item type', async () => {
      const mockItem = { id: itemId, userId, tripId: null };
      db.Flight.findByPk.mockResolvedValue(mockItem);

      expect(() => {
        companionPermissionManager._getItemModel('invalid_type');
      }).toThrow('Unknown item type: invalid_type');
    });
  });
});
