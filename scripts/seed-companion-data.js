#!/usr/bin/env node

/**
 * Companion Data Seeding Script
 * Creates sample companion relationships for testing the new permission model
 */

const {
  sequelize,
  User,
  TravelCompanion,
  CompanionPermission,
  Trip,
  TripAttendee,
} = require('../models');
const logger = require('../utils/logger');

async function seedCompanionData() {
  try {
    console.log('🌱 Starting companion data seeding...\n');

    // Get or create test users
    console.log('1️⃣  Creating test users...');
    let user1 = await User.findOne({ where: { email: 'alice@example.com' } });
    if (!user1) {
      user1 = await User.create({
        email: 'alice@example.com',
        firstName: 'Alice',
        lastName: 'J',
        password: 'password123',
      });
      console.log('   ✅ Created Alice');
    } else {
      console.log('   ℹ️  Alice already exists');
    }

    let user2 = await User.findOne({ where: { email: 'bob@example.com' } });
    if (!user2) {
      user2 = await User.create({
        email: 'bob@example.com',
        firstName: 'Bob',
        lastName: 'S',
        password: 'password123',
      });
      console.log('   ✅ Created Bob');
    } else {
      console.log('   ℹ️  Bob already exists');
    }

    let user3 = await User.findOne({ where: { email: 'charlie@example.com' } });
    if (!user3) {
      user3 = await User.create({
        email: 'charlie@example.com',
        firstName: 'Charlie',
        lastName: 'D',
        password: 'password123',
      });
      console.log('   ✅ Created Charlie');
    } else {
      console.log('   ℹ️  Charlie already exists');
    }

    console.log();

    // Create companion relationships
    console.log('2️⃣  Creating companion relationships...');

    // Alice adds Bob as a companion (share trips, can't manage)
    let aliceCompanionBob = await TravelCompanion.findOne({
      where: {
        createdBy: user1.id,
        email: user2.email,
      },
    });

    if (!aliceCompanionBob) {
      aliceCompanionBob = await TravelCompanion.create({
        createdBy: user1.id,
        email: user2.email,
        firstName: user2.firstName,
        lastName: user2.lastName,
        name: `${user2.firstName} ${user2.lastName}`,
        userId: user2.id,
      });

      await CompanionPermission.create({
        companionId: aliceCompanionBob.id,
        grantedBy: user1.id,
        canShareTrips: true,
        canManageTrips: false,
      });

      console.log('   ✅ Alice added Bob (can share trips)');
    } else {
      console.log('   ℹ️  Alice-Bob relationship already exists');
    }

    // Alice adds Charlie as a companion (share trips AND manage)
    let aliceCompanionCharlie = await TravelCompanion.findOne({
      where: {
        createdBy: user1.id,
        email: user3.email,
      },
    });

    if (!aliceCompanionCharlie) {
      aliceCompanionCharlie = await TravelCompanion.create({
        createdBy: user1.id,
        email: user3.email,
        firstName: user3.firstName,
        lastName: user3.lastName,
        name: `${user3.firstName} ${user3.lastName}`,
        userId: user3.id,
      });

      await CompanionPermission.create({
        companionId: aliceCompanionCharlie.id,
        grantedBy: user1.id,
        canShareTrips: true,
        canManageTrips: true,
      });

      console.log('   ✅ Alice added Charlie (can share and manage trips)');
    } else {
      console.log('   ℹ️  Alice-Charlie relationship already exists');
    }

    // Bob adds Alice as a companion (no permissions initially)
    let bobCompanionAlice = await TravelCompanion.findOne({
      where: {
        createdBy: user2.id,
        email: user1.email,
      },
    });

    if (!bobCompanionAlice) {
      bobCompanionAlice = await TravelCompanion.create({
        createdBy: user2.id,
        email: user1.email,
        firstName: user1.firstName,
        lastName: user1.lastName,
        name: `${user1.firstName} ${user1.lastName}`,
        userId: user1.id,
      });

      await CompanionPermission.create({
        companionId: bobCompanionAlice.id,
        grantedBy: user2.id,
        canShareTrips: false,
        canManageTrips: false,
      });

      console.log('   ✅ Bob added Alice (no permissions yet)');
    } else {
      console.log('   ℹ️  Bob-Alice relationship already exists');
    }

    console.log();

    // Create sample trips
    console.log('3️⃣  Creating sample trips...');

    let aliceTrip = await Trip.findOne({
      where: {
        userId: user1.id,
        name: 'Summer Vacation',
      },
    });

    if (!aliceTrip) {
      aliceTrip = await Trip.create({
        userId: user1.id,
        name: 'Summer Vacation',
        departureDate: new Date('2025-07-01'),
        returnDate: new Date('2025-07-15'),
      });

      // Add Alice as owner
      await TripAttendee.create({
        tripId: aliceTrip.id,
        userId: user1.id,
        email: user1.email,
        name: `${user1.firstName} ${user1.lastName}`,
        role: 'owner',
      });

      // Add Charlie as admin
      await TripAttendee.create({
        tripId: aliceTrip.id,
        userId: user3.id,
        email: user3.email,
        name: `${user3.firstName} ${user3.lastName}`,
        role: 'admin',
      });

      console.log('   ✅ Created Summer Vacation (Alice owner, Charlie admin)');
    } else {
      console.log('   ℹ️  Summer Vacation already exists');
    }

    console.log();

    // Summary
    console.log('━'.repeat(60));
    console.log('✅ Companion data seeding completed\n');
    console.log('Sample relationships created:');
    console.log(`  • Alice → Bob (share trips)`);
    console.log(`  • Alice → Charlie (share + manage trips)`);
    console.log(`  • Bob → Alice (no permissions)`);
    console.log('\nSample trip created:');
    console.log(`  • Summer Vacation (Alice owner, Charlie admin)`);
    console.log();
  } catch (error) {
    logger.error('Error during seeding:', error);
    console.error('\n❌ Seeding failed with error:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run seeding
seedCompanionData()
  .then(() => {
    console.log('✅ Data seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
