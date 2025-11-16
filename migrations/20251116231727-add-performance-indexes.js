module.exports = {
  async up(queryInterface) {
    // Trips indexes
    await queryInterface.addIndex('trips', ['userId', 'departureDate'], {
      name: 'idx_trips_user_departure',
      concurrently: true,
    });

    await queryInterface.addIndex('trips', ['userId'], {
      name: 'idx_trips_user',
      concurrently: true,
    });

    // Flights indexes
    await queryInterface.addIndex('flights', ['tripId', 'departureDateTime'], {
      name: 'idx_flights_trip_departure',
      concurrently: true,
    });

    await queryInterface.addIndex('flights', ['userId'], {
      name: 'idx_flights_user',
      concurrently: true,
    });

    await queryInterface.addIndex('flights', ['departureDateTime'], {
      name: 'idx_flights_departure',
      concurrently: true,
    });

    // Hotels indexes
    await queryInterface.addIndex('hotels', ['tripId', 'checkIn'], {
      name: 'idx_hotels_trip_checkin',
      concurrently: true,
    });

    await queryInterface.addIndex('hotels', ['userId'], {
      name: 'idx_hotels_user',
      concurrently: true,
    });

    // Events indexes
    await queryInterface.addIndex('events', ['tripId', 'startDateTime'], {
      name: 'idx_events_trip_start',
      concurrently: true,
    });

    await queryInterface.addIndex('events', ['userId'], {
      name: 'idx_events_user',
      concurrently: true,
    });

    // Transportation indexes
    await queryInterface.addIndex('transportation', ['tripId'], {
      name: 'idx_transportation_trip',
      concurrently: true,
    });

    await queryInterface.addIndex('transportation', ['userId'], {
      name: 'idx_transportation_user',
      concurrently: true,
    });

    // Car rentals indexes
    await queryInterface.addIndex('car_rentals', ['tripId'], {
      name: 'idx_car_rentals_trip',
      concurrently: true,
    });

    await queryInterface.addIndex('car_rentals', ['userId'], {
      name: 'idx_car_rentals_user',
      concurrently: true,
    });

    // Travel companions indexes
    await queryInterface.addIndex('travel_companions', ['userId'], {
      name: 'idx_travel_companions_user',
      concurrently: true,
    });

    await queryInterface.addIndex('travel_companions', ['linkedAccountId'], {
      name: 'idx_travel_companions_linked_account',
      concurrently: true,
    });

    // Trip companions indexes
    await queryInterface.addIndex('trip_companions', ['tripId'], {
      name: 'idx_trip_companions_trip',
      concurrently: true,
    });

    await queryInterface.addIndex('trip_companions', ['companionId'], {
      name: 'idx_trip_companions_companion',
      concurrently: true,
    });

    // Vouchers indexes
    await queryInterface.addIndex('vouchers', ['userId', 'status'], {
      name: 'idx_vouchers_user_status',
      concurrently: true,
    });

    await queryInterface.addIndex('vouchers', ['expirationDate'], {
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
    await queryInterface.removeIndex('hotels', 'idx_hotels_user');

    // Remove events indexes
    await queryInterface.removeIndex('events', 'idx_events_trip_start');
    await queryInterface.removeIndex('events', 'idx_events_user');

    // Remove transportation indexes
    await queryInterface.removeIndex('transportation', 'idx_transportation_trip');
    await queryInterface.removeIndex('transportation', 'idx_transportation_user');

    // Remove car rentals indexes
    await queryInterface.removeIndex('car_rentals', 'idx_car_rentals_trip');
    await queryInterface.removeIndex('car_rentals', 'idx_car_rentals_user');

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
