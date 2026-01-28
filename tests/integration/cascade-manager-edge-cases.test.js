/**
 * CompanionCascadeManager Edge Case Tests
 *
 * Tests for cascade manager with large-scale operations,
 * permission updates, and complex companion structures
 */

const db = require('../../models');
const CompanionCascadeManager = require('../../services/CompanionCascadeManager');
const { ITEM_TYPES } = require('../../constants/companionConstants');

describe('CompanionCascadeManager - Edge Cases', () => {
  let testUserId;
  let companionUserId;
  let tripId;
  let companionId;

  beforeAll(async () => {
    // Setup test data
    const user = await db.User.create({
      email: `test-cascade-${Date.now()}@example.com`,
      password: 'password',
      firstName: 'Test',
      lastName: 'User',
    });
    testUserId = user.id;

    const companion = await db.User.create({
      email: `companion-cascade-${Date.now()}@example.com`,
      password: 'password',
      firstName: 'Companion',
      lastName: 'User',
    });
    companionUserId = companion.id;

    const trip = await db.Trip.create({
      name: 'Cascade Test Trip',
      ownerId: testUserId,
    });
    tripId = trip.id;

    const travelCompanion = await db.TravelCompanion.create({
      name: 'Test Companion',
      email: `companion-cascade-${Date.now()}@example.com`,
      createdBy: testUserId,
      userId: companionUserId,
    });
    companionId = travelCompanion.id;
  });

  afterAll(async () => {
    // Cleanup
    await db.Trip.destroy({ where: { id: tripId } });
    await db.User.destroy({ where: { id: testUserId } });
    await db.User.destroy({ where: { id: companionUserId } });
    await db.TravelCompanion.destroy({ where: { id: companionId } });
  });

  describe('Cascade with large number of items', () => {
    it('should add companion to trip with 100+ items across all types', async () => {
      // Create many items across all types
      const itemCounts = {};
      const itemsPerType = 20;

      for (const itemType of ITEM_TYPES) {
        itemCounts[itemType] = [];

        for (let i = 0; i < itemsPerType; i += 1) {
          let item;
          if (itemType === 'flight') {
            item = await db.Flight.create({
              tripId,
              name: `Flight ${i}`,
              departureDate: new Date(),
              returnDate: new Date(),
            });
          } else if (itemType === 'hotel') {
            item = await db.Hotel.create({
              tripId,
              name: `Hotel ${i}`,
              checkInDate: new Date(),
              checkOutDate: new Date(),
            });
          } else if (itemType === 'transportation') {
            item = await db.Transportation.create({
              tripId,
              name: `Transport ${i}`,
              departureDate: new Date(),
            });
          } else if (itemType === 'car_rental') {
            item = await db.CarRental.create({
              tripId,
              name: `Car Rental ${i}`,
              pickupDate: new Date(),
              dropoffDate: new Date(),
            });
          } else if (itemType === 'event') {
            item = await db.Event.create({
              tripId,
              name: `Event ${i}`,
              eventDate: new Date(),
            });
          }
          itemCounts[itemType].push(item.id);
        }
      }

      // Cascade add companion
      const result = await CompanionCascadeManager.cascadeAddToAllItems(
        companionId,
        tripId,
        testUserId,
        {
          canEdit: false,
        }
      );

      expect(result).toBe(100); // 5 types * 20 items

      // Verify companions were added to all items
      for (const itemType of ITEM_TYPES) {
        const companions = await db.ItemCompanion.count({
          where: { itemType, tripId, companionId },
        });
        expect(companions).toBe(itemsPerType);
      }

      // Cleanup items
      const modelMap = {
        flight: db.Flight,
        hotel: db.Hotel,
        transportation: db.Transportation,
        car_rental: db.CarRental,
        event: db.Event,
      };
      for (const itemType of ITEM_TYPES) {
        const ItemModel = modelMap[itemType];
        await ItemModel.destroy({ where: { tripId } });
      }
    });
  });

  describe('Permission cascading', () => {
    let testTripId;
    let testCompanionId;
    let testFlightId;

    beforeEach(async () => {
      const trip = await db.Trip.create({
        name: `Permission Test ${Date.now()}`,
        ownerId: testUserId,
      });
      testTripId = trip.id;

      const travelComp = await db.TravelCompanion.create({
        name: 'Perm Test Companion',
        email: `perm-test-${Date.now()}@example.com`,
        createdBy: testUserId,
      });
      testCompanionId = travelComp.id;

      const flight = await db.Flight.create({
        tripId: testTripId,
        name: 'Permission Test Flight',
        departureDate: new Date(),
        returnDate: new Date(),
      });
      testFlightId = flight.id;
    });

    afterEach(async () => {
      await db.Flight.destroy({ where: { id: testFlightId } });
      await db.Trip.destroy({ where: { id: testTripId } });
      await db.TravelCompanion.destroy({ where: { id: testCompanionId } });
    });

    it('should cascade permission updates to all items', async () => {
      // First add companion to trip
      await CompanionCascadeManager.cascadeAddToAllItems(testCompanionId, testTripId, testUserId, {
        canEdit: false,
        canView: true,
      });

      // Verify initial permissions
      let itemCompanion = await db.ItemCompanion.findOne({
        where: { itemType: 'flight', itemId: testFlightId, companionId: testCompanionId },
      });
      expect(itemCompanion.canEdit).toBe(false);

      // Update permissions
      await CompanionCascadeManager.updateCascadedPermissions(testCompanionId, testTripId, {
        canEdit: true,
        canView: true,
      });

      // Verify permissions updated
      itemCompanion = await db.ItemCompanion.findOne({
        where: { itemType: 'flight', itemId: testFlightId, companionId: testCompanionId },
      });
      expect(itemCompanion.canEdit).toBe(true);
    });

    it('should handle removal of companion from inherited items', async () => {
      // Add companion
      await CompanionCascadeManager.cascadeAddToAllItems(testCompanionId, testTripId, testUserId);

      // Verify companion on item
      const beforeRemoval = await db.ItemCompanion.findOne({
        where: { itemType: 'flight', itemId: testFlightId, companionId: testCompanionId },
      });
      expect(beforeRemoval).toBeTruthy();

      // Remove companion
      const result = await CompanionCascadeManager.cascadeRemoveFromAllItems(
        testCompanionId,
        testTripId
      );

      expect(result).toBe(1); // 1 item removed

      // Verify companion removed
      const afterRemoval = await db.ItemCompanion.findOne({
        where: { itemType: 'flight', itemId: testFlightId, companionId: testCompanionId },
      });
      expect(afterRemoval).toBeFalsy();
    });
  });

  describe('Mixed inherited and independent companions', () => {
    let mixedTripId;
    let tripCompanionId;
    let independentCompanionId;
    let itemId;

    beforeEach(async () => {
      const trip = await db.Trip.create({
        name: `Mixed Test ${Date.now()}`,
        ownerId: testUserId,
      });
      mixedTripId = trip.id;

      const tripComp = await db.TravelCompanion.create({
        name: 'Trip Companion',
        email: `trip-comp-${Date.now()}@example.com`,
        createdBy: testUserId,
      });
      tripCompanionId = tripComp.id;

      const indepComp = await db.TravelCompanion.create({
        name: 'Independent Companion',
        email: `indep-comp-${Date.now()}@example.com`,
        createdBy: testUserId,
      });
      independentCompanionId = indepComp.id;

      const flight = await db.Flight.create({
        tripId: mixedTripId,
        name: 'Mixed Test Flight',
        departureDate: new Date(),
        returnDate: new Date(),
      });
      itemId = flight.id;
    });

    afterEach(async () => {
      await db.Flight.destroy({ where: { id: itemId } });
      await db.Trip.destroy({ where: { id: mixedTripId } });
      await db.TravelCompanion.destroy({ where: { id: tripCompanionId } });
      await db.TravelCompanion.destroy({ where: { id: independentCompanionId } });
    });

    it('should handle removal of cascaded companion while preserving independent additions', async () => {
      // Add companion to trip (cascades to items)
      await CompanionCascadeManager.cascadeAddToAllItems(tripCompanionId, mixedTripId, testUserId);

      // Add independent companion directly to item
      await db.ItemCompanion.create({
        itemType: 'flight',
        itemId,
        companionId: independentCompanionId,
        status: 'attending',
        addedBy: testUserId,
        inheritedFromTrip: false,
      });

      // Remove trip companion (cascaded)
      await CompanionCascadeManager.cascadeRemoveFromAllItems(tripCompanionId, mixedTripId);

      // Verify cascaded companion removed
      const cascadedAfterRemoval = await db.ItemCompanion.findOne({
        where: { itemType: 'flight', itemId, companionId: tripCompanionId },
      });
      expect(cascadedAfterRemoval).toBeFalsy();

      // Verify independent companion still on item
      const independentAfterRemoval = await db.ItemCompanion.findOne({
        where: { itemType: 'flight', itemId, companionId: independentCompanionId },
      });
      expect(independentAfterRemoval).toBeTruthy();
    });
  });
});
