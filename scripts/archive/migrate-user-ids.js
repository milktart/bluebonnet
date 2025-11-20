// Migration script to populate userId for existing flights, transportation, and events
// This script should be run after the database has been synced with the new schema

require('dotenv').config();
const { sequelize, Flight, Transportation, Event, Trip } = require('../models');

async function migrateUserIds() {
  try {
    console.log('Starting userId migration...');

    // Start a transaction
    const transaction = await sequelize.transaction();

    try {
      // Update Flights
      console.log('Updating flights...');
      const flights = await Flight.findAll({
        where: { userId: null },
        include: [{ model: Trip, as: 'trip', required: true }],
        transaction,
      });

      for (const flight of flights) {
        await flight.update({ userId: flight.trip.userId }, { transaction });
      }
      console.log(`Updated ${flights.length} flights`);

      // Update Transportation
      console.log('Updating transportation...');
      const transportation = await Transportation.findAll({
        where: { userId: null },
        include: [{ model: Trip, as: 'trip', required: true }],
        transaction,
      });

      for (const transport of transportation) {
        await transport.update({ userId: transport.trip.userId }, { transaction });
      }
      console.log(`Updated ${transportation.length} transportation records`);

      // Update Events
      console.log('Updating events...');
      const events = await Event.findAll({
        where: { userId: null },
        include: [{ model: Trip, as: 'trip', required: true }],
        transaction,
      });

      for (const event of events) {
        await event.update({ userId: event.trip.userId }, { transaction });
      }
      console.log(`Updated ${events.length} events`);

      // Commit the transaction
      await transaction.commit();
      console.log('Migration completed successfully!');

      process.exit(0);
    } catch (error) {
      // Rollback on error
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateUserIds();
