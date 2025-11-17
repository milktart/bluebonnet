module.exports = {
  async up(queryInterface) {
    // Helper function to check if index exists
    const indexExists = async (indexName) => {
      const [results] = await queryInterface.sequelize.query(
        `SELECT COUNT(*) as count FROM pg_indexes WHERE indexname = '${indexName}';`
      );
      return results[0].count > 0;
    };

    // Helper function to create index if it doesn't exist
    const createIndexIfNotExists = async (tableName, fields, options) => {
      const exists = await indexExists(options.name);
      if (!exists) {
        await queryInterface.addIndex(tableName, fields, options);
      }
    };

    // Trips indexes
    await createIndexIfNotExists('trips', ['userId', 'departureDate'], {
      name: 'idx_trips_user_departure',
      concurrently: true,
    });

    await createIndexIfNotExists('trips', ['userId'], {
      name: 'idx_trips_user',
      concurrently: true,
    });

    // Flights indexes
    await createIndexIfNotExists('flights', ['tripId', 'departureDateTime'], {
      name: 'idx_flights_trip_departure',
      concurrently: true,
    });

    await createIndexIfNotExists('flights', ['userId'], {
      name: 'idx_flights_user',
      concurrently: true,
    });

    await createIndexIfNotExists('flights', ['departureDateTime'], {
      name: 'idx_flights_departure',
      concurrently: true,
    });

    // Hotels indexes
    await createIndexIfNotExists('hotels', ['tripId', 'checkInDateTime'], {
      name: 'idx_hotels_trip_checkin',
      concurrently: true,
    });

    // Events indexes
    await createIndexIfNotExists('events', ['tripId', 'startDateTime'], {
      name: 'idx_events_trip_start',
      concurrently: true,
    });

    await createIndexIfNotExists('events', ['userId'], {
      name: 'idx_events_user',
      concurrently: true,
    });

    // Transportation indexes
    await createIndexIfNotExists('transportation', ['tripId'], {
      name: 'idx_transportation_trip',
      concurrently: true,
    });

    await createIndexIfNotExists('transportation', ['userId'], {
      name: 'idx_transportation_user',
      concurrently: true,
    });

    // Car rentals indexes
    await createIndexIfNotExists('car_rentals', ['tripId'], {
      name: 'idx_car_rentals_trip',
      concurrently: true,
    });

    // Travel companions indexes
    await createIndexIfNotExists('travel_companions', ['userId'], {
      name: 'idx_travel_companions_user',
      concurrently: true,
    });

    await createIndexIfNotExists('travel_companions', ['linkedAccountId'], {
      name: 'idx_travel_companions_linked_account',
      concurrently: true,
    });

    // Trip companions indexes
    await createIndexIfNotExists('trip_companions', ['tripId'], {
      name: 'idx_trip_companions_trip',
      concurrently: true,
    });

    await createIndexIfNotExists('trip_companions', ['companionId'], {
      name: 'idx_trip_companions_companion',
      concurrently: true,
    });

    // Vouchers indexes
    await createIndexIfNotExists('vouchers', ['userId', 'status'], {
      name: 'idx_vouchers_user_status',
      concurrently: true,
    });

    await createIndexIfNotExists('vouchers', ['expirationDate'], {
      name: 'idx_vouchers_expiration',
      concurrently: true,
    });
  },

  async down(queryInterface) {
    // Remove trips indexes
    await queryInterface.removeIndex('trips', 'idx_trips_user_departure');
    await queryInterface.removeIndex('trips', 'idx_trips_user');

    // Remove flights indexes
    await queryInterface.removeIndex('flights', 'idx_flights_trip_departure');
    await queryInterface.removeIndex('flights', 'idx_flights_user');
    await queryInterface.removeIndex('flights', 'idx_flights_departure');

    // Remove hotels indexes
    await queryInterface.removeIndex('hotels', 'idx_hotels_trip_checkin');

    // Remove events indexes
    await queryInterface.removeIndex('events', 'idx_events_trip_start');
    await queryInterface.removeIndex('events', 'idx_events_user');

    // Remove transportation indexes
    await queryInterface.removeIndex('transportation', 'idx_transportation_trip');
    await queryInterface.removeIndex('transportation', 'idx_transportation_user');

    // Remove car rentals indexes
    await queryInterface.removeIndex('car_rentals', 'idx_car_rentals_trip');

    // Remove travel companions indexes
    await queryInterface.removeIndex('travel_companions', 'idx_travel_companions_user');
    await queryInterface.removeIndex('travel_companions', 'idx_travel_companions_linked_account');

    // Remove trip companions indexes
    await queryInterface.removeIndex('trip_companions', 'idx_trip_companions_trip');
    await queryInterface.removeIndex('trip_companions', 'idx_trip_companions_companion');

    // Remove vouchers indexes
    await queryInterface.removeIndex('vouchers', 'idx_vouchers_user_status');
    await queryInterface.removeIndex('vouchers', 'idx_vouchers_expiration');
  },
};
