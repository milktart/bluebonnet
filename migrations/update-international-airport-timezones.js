'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Update timezones for international airports
    const updates = [
      { iata: 'LHR', timezone: 'Europe/London' }, // London Heathrow
      { iata: 'CDG', timezone: 'Europe/Paris' }, // Paris Charles de Gaulle
      { iata: 'AMS', timezone: 'Europe/Amsterdam' }, // Amsterdam Schiphol
      { iata: 'FRA', timezone: 'Europe/Berlin' }, // Frankfurt am Main
      { iata: 'IST', timezone: 'Europe/Istanbul' }, // Istanbul International
      { iata: 'NRT', timezone: 'Asia/Tokyo' }, // Narita International
      { iata: 'KIX', timezone: 'Asia/Tokyo' }, // Kansai International
      { iata: 'PEK', timezone: 'Asia/Shanghai' }, // Beijing Capital International
      { iata: 'PVG', timezone: 'Asia/Shanghai' }, // Shanghai Pudong International
      { iata: 'SIN', timezone: 'Asia/Singapore' }, // Singapore Changi International
      { iata: 'ICN', timezone: 'Asia/Seoul' }, // Incheon International
      { iata: 'BKK', timezone: 'Asia/Bangkok' }, // Suvarnabhumi International
      { iata: 'HKG', timezone: 'Asia/Hong_Kong' }, // Hong Kong International
      { iata: 'DXB', timezone: 'Asia/Dubai' }, // Dubai International
      { iata: 'JNB', timezone: 'Africa/Johannesburg' }, // O.R. Tambo International
      { iata: 'SYD', timezone: 'Australia/Sydney' }, // Sydney Kingsford Smith International
      { iata: 'MEL', timezone: 'Australia/Melbourne' }, // Melbourne International
      { iata: 'AKL', timezone: 'Pacific/Auckland' }, // Auckland International
      { iata: 'LAX', timezone: 'America/Los_Angeles' }, // Los Angeles International
      { iata: 'JFK', timezone: 'America/New_York' }, // John F. Kennedy International
      { iata: 'ORD', timezone: 'America/Chicago' }, // Chicago O'Hare International
      { iata: 'DFW', timezone: 'America/Chicago' }, // Dallas/Fort Worth International
      { iata: 'ATL', timezone: 'America/New_York' }, // Hartsfield-Jackson Atlanta International
      { iata: 'MIA', timezone: 'America/New_York' }, // Miami International
      { iata: 'SFO', timezone: 'America/Los_Angeles' }, // San Francisco International
      { iata: 'SEA', timezone: 'America/Los_Angeles' }, // Seattle-Tacoma International
      { iata: 'YVR', timezone: 'America/Vancouver' }, // Vancouver International
      { iata: 'YYZ', timezone: 'America/Toronto' }, // Toronto Pearson International
      { iata: 'MEX', timezone: 'America/Mexico_City' }, // Mexico City International
      { iata: 'GRU', timezone: 'America/Sao_Paulo' }, // São Paulo/Guarulhos International
      { iata: 'EZE', timezone: 'America/Argentina/Buenos_Aires' }, // Buenos Aires Ministro Pistarini International
      { iata: 'SCL', timezone: 'America/Santiago' }, // Santiago International
      { iata: 'AUH', timezone: 'Asia/Dubai' }, // Abu Dhabi International
      { iata: 'DOH', timezone: 'Asia/Qatar' }, // Doha Hamad International
    ];

    for (const update of updates) {
      await queryInterface.sequelize.query(
        `UPDATE airports SET timezone = :timezone WHERE iata = :iata`,
        {
          replacements: update,
          type: queryInterface.sequelize.QueryTypes.UPDATE,
        }
      );
    }
  },

  down: async (queryInterface, Sequelize) => {
    // This migration cannot be easily reversed as we don't know the original values
    // Do nothing on rollback
  },
};
