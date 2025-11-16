module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('airports', {
      iata: {
        type: Sequelize.STRING(3),
        primaryKey: true,
        allowNull: false,
        comment: 'IATA 3-letter airport code',
      },
      icao: {
        type: Sequelize.STRING(4),
        comment: 'ICAO 4-letter airport code',
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Full airport name',
      },
      city: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'City where airport is located',
      },
      country: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Country where airport is located',
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 6),
        comment: 'Airport latitude coordinate',
      },
      longitude: {
        type: Sequelize.DECIMAL(10, 6),
        comment: 'Airport longitude coordinate',
      },
      timezone: {
        type: Sequelize.STRING,
        comment: 'Airport timezone (e.g., America/New_York)',
      },
    });

    // Add indexes
    await queryInterface.addIndex('airports', ['city'], {
      name: 'idx_airports_city',
    });

    await queryInterface.addIndex('airports', ['country'], {
      name: 'idx_airports_country',
    });

    await queryInterface.addIndex('airports', ['name'], {
      name: 'idx_airports_name',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('airports');
  },
};
