'use strict';

/**
 * Migration to convert TripCompanion records to TripAttendee records
 *
 * Maps:
 * - TripCompanion.companionId → TravelCompanion.id → TripAttendee data
 * - TripCompanion.canEdit/canAddItems → TripAttendee.role
 * - Creates "owner" entries for trip creators
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Create owner entries for each trip (trip creator = owner)
      await queryInterface.sequelize.query(
        `
        INSERT INTO trip_attendees (id, "tripId", "userId", email, "firstName", "lastName", name, role, "createdAt", "updatedAt")
        SELECT
          gen_random_uuid(),
          t.id,
          t."userId",
          u.email,
          u."firstName",
          u."lastName",
          COALESCE(u."firstName" || ' ' || u."lastName", u.email),
          'owner',
          NOW(),
          NOW()
        FROM trips t
        JOIN users u ON t."userId" = u.id
        WHERE NOT EXISTS (
          SELECT 1 FROM trip_attendees ta
          WHERE ta."tripId" = t.id AND ta.role = 'owner'
        )
        `,
        { transaction }
      );

      // Convert TripCompanion records to TripAttendee records
      // canEdit=true and canAddItems=true → role='admin'
      // canEdit=true and canAddItems=false → role='admin'
      // canEdit=false → role='attendee'
      await queryInterface.sequelize.query(
        `
        INSERT INTO trip_attendees (id, "tripId", "userId", email, "firstName", "lastName", name, role, "createdAt", "updatedAt")
        SELECT
          gen_random_uuid(),
          tc."tripId",
          tc2."userId",
          tc2.email,
          tc2."firstName",
          tc2."lastName",
          tc2.name,
          CASE
            WHEN tc."canEdit" = true THEN 'admin'
            ELSE 'attendee'
          END as role,
          tc."createdAt",
          tc."updatedAt"
        FROM trip_companions tc
        JOIN travel_companions tc2 ON tc."companionId" = tc2.id
        WHERE NOT EXISTS (
          SELECT 1 FROM trip_attendees ta
          WHERE ta."tripId" = tc."tripId" AND ta.email = tc2.email
        )
        `,
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Remove all owner entries that were created during migration
      // (cannot reliably determine which were created vs existed)
      // For safety, only remove attendees that came from TripCompanion
      await queryInterface.sequelize.query(
        `
        DELETE FROM trip_attendees ta
        WHERE ta.role = 'attendee'
        AND ta."userId" IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM trip_companions tc
          JOIN travel_companions tc2 ON tc."companionId" = tc2.id
          WHERE tc."tripId" = ta."tripId" AND tc2.email = ta.email
        )
        `,
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
