'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Fix UTF-8 encoding for all tables by converting mojibake back to proper UTF-8
    // This handles data that was stored with incorrect encoding (UTF-8 interpreted as Latin-1)

    const tables = [
      'users',
      'trips',
      'flights',
      'hotels',
      'transportation',
      'carRentals',
      'events',
      'vouchers',
      'travelCompanions',
    ];

    for (const table of tables) {
      try {
        // Get all rows from the table
        const rows = await queryInterface.sequelize.query(`SELECT * FROM "${table}"`, {
          type: queryInterface.sequelize.QueryTypes.SELECT,
        });

        // For each row, fix the string columns
        for (const row of rows) {
          const updates = {};
          let hasChanges = false;

          for (const [key, value] of Object.entries(row)) {
            if (typeof value === 'string' && value) {
              try {
                // Try to convert mojibake (UTF-8 interpreted as Latin-1) back to proper UTF-8
                const fixed = Buffer.from(value, 'latin1').toString('utf8');
                // Only update if it actually changed (and contains non-ASCII characters)
                if (fixed !== value && /[^\x00-\x7F]/.test(fixed)) {
                  updates[key] = fixed;
                  hasChanges = true;
                }
              } catch (e) {
                // Skip if conversion fails
              }
            }
          }

          // Update the row if any changes were made
          if (hasChanges && row.id) {
            await queryInterface.sequelize.query(
              `UPDATE "${table}" SET ${Object.keys(updates)
                .map((k, i) => `"${k}" = $${i + 1}`)
                .join(', ')} WHERE id = $${Object.keys(updates).length + 1}`,
              {
                bind: [...Object.values(updates), row.id],
                type: queryInterface.sequelize.QueryTypes.UPDATE,
              }
            );
          }
        }

        console.log(`Fixed UTF-8 encoding for table: ${table}`);
      } catch (error) {
        console.error(`Error processing table ${table}:`, error.message);
        // Continue with next table even if one fails
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // This migration is non-reversible since we're fixing data
    console.log('UTF-8 encoding fix migration cannot be reversed');
  },
};
