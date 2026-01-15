/**
 * Cascade Manager Integration Tests
 * Tests for cascading companion assignments across trip items
 */

const companionCascadeManager = require('../../services/CompanionCascadeManager');
const db = require('../../models');

// Mock database models
jest.mock('../../models', () => ({
  Flight: {
    findAll: jest.fn(),
  },
  Hotel: {
    findAll: jest.fn(),
  },
  Transportation: {
    findAll: jest.fn(),
  },
  CarRental: {
    findAll: jest.fn(),
  },
  Event: {
    findAll: jest.fn(),
  },
  ItemCompanion: {
    bulkCreate: jest.fn(),
    destroy: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('../../utils/logger', () => ({
  debug: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
}));

describe('Companion Cascade Manager', () => {
  const companionId = 'companion-123';
  const tripId = 'trip-123';
  const userId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('cascadeAddToAllItems', () => {
    it('should add companion to all items in a trip', async () => {
      const mockFlights = [{ id: 'flight-1' }, { id: 'flight-2' }];
      const mockHotels = [{ id: 'hotel-1' }];
      const mockTransportation = [{ id: 'transport-1' }];
      const mockCarRentals = [];
      const mockEvents = [{ id: 'event-1' }];

      db.Flight.findAll.mockResolvedValue(mockFlights);
      db.Hotel.findAll.mockResolvedValue(mockHotels);
      db.Transportation.findAll.mockResolvedValue(mockTransportation);
      db.CarRental.findAll.mockResolvedValue(mockCarRentals);
      db.Event.findAll.mockResolvedValue(mockEvents);
      db.ItemCompanion.bulkCreate.mockResolvedValue([]);

      const result = await companionCascadeManager.cascadeAddToAllItems(companionId, tripId, userId);

      // Should have created 5 records (2 flights + 1 hotel + 1 transportation + 0 car rentals + 1 event)
      expect(result).toBe(5);
      expect(db.ItemCompanion.bulkCreate).toHaveBeenCalled();

      const bulkCreateCall = db.ItemCompanion.bulkCreate.mock.calls[0];
      const records = bulkCreateCall[0];

      // Verify structure of created records
      expect(records).toHaveLength(5);
      expect(records[0]).toMatchObject({
        itemType: 'flight',
        companionId,
        status: 'attending',
        addedBy: userId,
        inheritedFromTrip: true,
        canView: true,
        canEdit: false,
        canManageCompanions: false,
      });
    });

    it('should pass correct permissions when adding with canEdit', async () => {
      db.Flight.findAll.mockResolvedValue([{ id: 'flight-1' }]);
      db.Hotel.findAll.mockResolvedValue([]);
      db.Transportation.findAll.mockResolvedValue([]);
      db.CarRental.findAll.mockResolvedValue([]);
      db.Event.findAll.mockResolvedValue([]);
      db.ItemCompanion.bulkCreate.mockResolvedValue([]);

      await companionCascadeManager.cascadeAddToAllItems(
        companionId,
        tripId,
        userId,
        { canEdit: true }
      );

      const bulkCreateCall = db.ItemCompanion.bulkCreate.mock.calls[0];
      const records = bulkCreateCall[0];

      expect(records[0]).toMatchObject({
        canView: true,
        canEdit: true,
        canManageCompanions: false,
      });
    });

    it('should return 0 when trip has no items', async () => {
      db.Flight.findAll.mockResolvedValue([]);
      db.Hotel.findAll.mockResolvedValue([]);
      db.Transportation.findAll.mockResolvedValue([]);
      db.CarRental.findAll.mockResolvedValue([]);
      db.Event.findAll.mockResolvedValue([]);

      const result = await companionCascadeManager.cascadeAddToAllItems(companionId, tripId, userId);

      expect(result).toBe(0);
      expect(db.ItemCompanion.bulkCreate).not.toHaveBeenCalled();
    });

    it('should handle bulkCreate with ignoreDuplicates', async () => {
      db.Flight.findAll.mockResolvedValue([{ id: 'flight-1' }]);
      db.Hotel.findAll.mockResolvedValue([]);
      db.Transportation.findAll.mockResolvedValue([]);
      db.CarRental.findAll.mockResolvedValue([]);
      db.Event.findAll.mockResolvedValue([]);
      db.ItemCompanion.bulkCreate.mockResolvedValue([]);

      await companionCascadeManager.cascadeAddToAllItems(companionId, tripId, userId);

      expect(db.ItemCompanion.bulkCreate).toHaveBeenCalledWith(
        expect.any(Array),
        { ignoreDuplicates: true }
      );
    });
  });

  describe('cascadeRemoveFromAllItems', () => {
    it('should remove companion from all inherited items in a trip', async () => {
      const mockFlights = [{ id: 'flight-1' }, { id: 'flight-2' }];
      const mockHotels = [{ id: 'hotel-1' }];
      const mockTransportation = [];
      const mockCarRentals = [{ id: 'car-1' }];
      const mockEvents = [];

      db.Flight.findAll.mockResolvedValue(mockFlights);
      db.Hotel.findAll.mockResolvedValue(mockHotels);
      db.Transportation.findAll.mockResolvedValue(mockTransportation);
      db.CarRental.findAll.mockResolvedValue(mockCarRentals);
      db.Event.findAll.mockResolvedValue(mockEvents);
      db.ItemCompanion.destroy.mockResolvedValue(1); // Returns number destroyed

      const result = await companionCascadeManager.cascadeRemoveFromAllItems(companionId, tripId);

      // Should have removed from 4 items (2 flights + 1 hotel + 0 transportation + 1 car rental + 0 events)
      expect(result).toBe(4);
      expect(db.ItemCompanion.destroy).toHaveBeenCalledTimes(4);
    });

    it('should only remove inherited companions', async () => {
      db.Flight.findAll.mockResolvedValue([{ id: 'flight-1' }]);
      db.Hotel.findAll.mockResolvedValue([]);
      db.Transportation.findAll.mockResolvedValue([]);
      db.CarRental.findAll.mockResolvedValue([]);
      db.Event.findAll.mockResolvedValue([]);
      db.ItemCompanion.destroy.mockResolvedValue(1);

      await companionCascadeManager.cascadeRemoveFromAllItems(companionId, tripId);

      const destroyCall = db.ItemCompanion.destroy.mock.calls[0];
      expect(destroyCall[0]).toMatchObject({
        where: {
          itemType: 'flight',
          itemId: 'flight-1',
          companionId,
          inheritedFromTrip: true, // Must check this flag
        },
      });
    });

    it('should return 0 when no items exist', async () => {
      db.Flight.findAll.mockResolvedValue([]);
      db.Hotel.findAll.mockResolvedValue([]);
      db.Transportation.findAll.mockResolvedValue([]);
      db.CarRental.findAll.mockResolvedValue([]);
      db.Event.findAll.mockResolvedValue([]);

      const result = await companionCascadeManager.cascadeRemoveFromAllItems(companionId, tripId);

      expect(result).toBe(0);
      expect(db.ItemCompanion.destroy).not.toHaveBeenCalled();
    });

    it('should accumulate counts from all item types', async () => {
      db.Flight.findAll.mockResolvedValue([{ id: 'f1' }, { id: 'f2' }]);
      db.Hotel.findAll.mockResolvedValue([{ id: 'h1' }]);
      db.Transportation.findAll.mockResolvedValue([{ id: 't1' }, { id: 't2' }, { id: 't3' }]);
      db.CarRental.findAll.mockResolvedValue([]);
      db.Event.findAll.mockResolvedValue([{ id: 'e1' }]);

      // Each destroy call returns 1
      db.ItemCompanion.destroy.mockResolvedValue(1);

      const result = await companionCascadeManager.cascadeRemoveFromAllItems(companionId, tripId);

      // 2 flights + 1 hotel + 3 transportation + 0 car rentals + 1 event = 7
      expect(result).toBe(7);
      expect(db.ItemCompanion.destroy).toHaveBeenCalledTimes(7);
    });
  });

  describe('updateCascadedPermissions', () => {
    it('should update permissions for all inherited items', async () => {
      db.Flight.findAll.mockResolvedValue([{ id: 'flight-1' }]);
      db.Hotel.findAll.mockResolvedValue([{ id: 'hotel-1' }]);
      db.Transportation.findAll.mockResolvedValue([]);
      db.CarRental.findAll.mockResolvedValue([]);
      db.Event.findAll.mockResolvedValue([]);

      // update() returns [affectedCount, ...]
      db.ItemCompanion.update.mockResolvedValue([1]);

      const permissions = { canView: true, canEdit: true, canManageCompanions: false };
      const result = await companionCascadeManager.updateCascadedPermissions(
        companionId,
        tripId,
        permissions
      );

      expect(result).toBe(2); // 1 flight + 1 hotel
      expect(db.ItemCompanion.update).toHaveBeenCalledTimes(2);
      expect(db.ItemCompanion.update).toHaveBeenCalledWith(permissions, expect.any(Object));
    });

    it('should only update inherited items', async () => {
      db.Flight.findAll.mockResolvedValue([{ id: 'flight-1' }]);
      db.Hotel.findAll.mockResolvedValue([]);
      db.Transportation.findAll.mockResolvedValue([]);
      db.CarRental.findAll.mockResolvedValue([]);
      db.Event.findAll.mockResolvedValue([]);
      db.ItemCompanion.update.mockResolvedValue([1]);

      const permissions = { canView: false, canEdit: false, canManageCompanions: true };
      await companionCascadeManager.updateCascadedPermissions(companionId, tripId, permissions);

      const updateCall = db.ItemCompanion.update.mock.calls[0];
      expect(updateCall[1]).toMatchObject({
        where: {
          itemType: 'flight',
          itemId: 'flight-1',
          companionId,
          inheritedFromTrip: true,
        },
      });
    });

    it('should return 0 when no items exist', async () => {
      db.Flight.findAll.mockResolvedValue([]);
      db.Hotel.findAll.mockResolvedValue([]);
      db.Transportation.findAll.mockResolvedValue([]);
      db.CarRental.findAll.mockResolvedValue([]);
      db.Event.findAll.mockResolvedValue([]);

      const result = await companionCascadeManager.updateCascadedPermissions(
        companionId,
        tripId,
        { canEdit: true }
      );

      expect(result).toBe(0);
      expect(db.ItemCompanion.update).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle cascadeAddToAllItems errors', async () => {
      const error = new Error('Database error');
      db.Flight.findAll.mockRejectedValue(error);

      await expect(
        companionCascadeManager.cascadeAddToAllItems(companionId, tripId, userId)
      ).rejects.toThrow('Database error');
    });

    it('should handle cascadeRemoveFromAllItems errors', async () => {
      const error = new Error('Database error');
      db.Flight.findAll.mockRejectedValue(error);

      await expect(
        companionCascadeManager.cascadeRemoveFromAllItems(companionId, tripId)
      ).rejects.toThrow('Database error');
    });

    it('should handle updateCascadedPermissions errors', async () => {
      const error = new Error('Database error');
      db.Flight.findAll.mockRejectedValue(error);

      await expect(
        companionCascadeManager.updateCascadedPermissions(companionId, tripId, {
          canEdit: true,
        })
      ).rejects.toThrow('Database error');
    });
  });

  describe('Cascade Behavior Scenarios', () => {
    it('should cascade add then remove companion correctly', async () => {
      // Setup: trip has 3 items
      const mockItems = [{ id: 'item-1' }, { id: 'item-2' }, { id: 'item-3' }];

      // Add phase
      db.Flight.findAll.mockResolvedValueOnce(mockItems);
      db.Hotel.findAll.mockResolvedValueOnce([]);
      db.Transportation.findAll.mockResolvedValueOnce([]);
      db.CarRental.findAll.mockResolvedValueOnce([]);
      db.Event.findAll.mockResolvedValueOnce([]);
      db.ItemCompanion.bulkCreate.mockResolvedValueOnce([]);

      await companionCascadeManager.cascadeAddToAllItems(companionId, tripId, userId);

      expect(db.ItemCompanion.bulkCreate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ itemType: 'flight', itemId: 'item-1', inheritedFromTrip: true }),
          expect.objectContaining({ itemType: 'flight', itemId: 'item-2', inheritedFromTrip: true }),
          expect.objectContaining({ itemType: 'flight', itemId: 'item-3', inheritedFromTrip: true }),
        ]),
        { ignoreDuplicates: true }
      );

      // Reset mocks for remove phase
      jest.clearAllMocks();

      // Remove phase
      db.Flight.findAll.mockResolvedValueOnce(mockItems);
      db.Hotel.findAll.mockResolvedValueOnce([]);
      db.Transportation.findAll.mockResolvedValueOnce([]);
      db.CarRental.findAll.mockResolvedValueOnce([]);
      db.Event.findAll.mockResolvedValueOnce([]);
      db.ItemCompanion.destroy.mockResolvedValue(1);

      const result = await companionCascadeManager.cascadeRemoveFromAllItems(companionId, tripId);

      expect(result).toBe(3); // 3 items removed
      expect(db.ItemCompanion.destroy).toHaveBeenCalledTimes(3);
    });

    it('should handle partial cascade (some items have no companions)', async () => {
      db.Flight.findAll.mockResolvedValue([{ id: 'f1' }]);
      db.Hotel.findAll.mockResolvedValue([]);
      db.Transportation.findAll.mockResolvedValue([]);
      db.CarRental.findAll.mockResolvedValue([]);
      db.Event.findAll.mockResolvedValue([]);
      db.ItemCompanion.destroy.mockResolvedValue(0); // No companions to remove

      const result = await companionCascadeManager.cascadeRemoveFromAllItems(companionId, tripId);

      expect(result).toBe(0);
      expect(db.ItemCompanion.destroy).toHaveBeenCalled();
    });
  });
});
