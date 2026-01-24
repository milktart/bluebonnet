'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // First, get all companions and identify duplicates
    const [companions] = await queryInterface.sequelize.query(`
      SELECT id, email, "createdBy", "createdAt"
      FROM travel_companions
      ORDER BY email, "createdAt"
    `);

    // Group by email and find duplicates
    const emailMap = {};
    const idsToDelete = [];

    companions.forEach((companion) => {
      const email = companion.email.toLowerCase();
      if (!emailMap[email]) {
        emailMap[email] = [];
      }
      emailMap[email].push(companion.id);
    });

    // For each email with duplicates, keep the first one (oldest)
    // Delete the rest
    Object.values(emailMap).forEach((ids) => {
      if (ids.length > 1) {
        idsToDelete.push(...ids.slice(1)); // Keep first, delete rest
      }
    });

    // Delete duplicate companions
    if (idsToDelete.length > 0) {
      await queryInterface.sequelize.query(
        `
        DELETE FROM trip_companions WHERE "companionId" IN (:ids)
      `,
        {
          replacements: { ids: idsToDelete },
        }
      );

      await queryInterface.sequelize.query(
        `
        DELETE FROM item_companions WHERE "companionId" IN (:ids)
      `,
        {
          replacements: { ids: idsToDelete },
        }
      );

      await queryInterface.sequelize.query(
        `
        DELETE FROM travel_companions WHERE id IN (:ids)
      `,
        {
          replacements: { ids: idsToDelete },
        }
      );
    }

    // Now add the unique constraint
    try {
      await queryInterface.addConstraint('travel_companions', {
        fields: ['email'],
        type: 'unique',
        name: 'unique_email_constraint',
      });
    } catch (error) {
      // Constraint might already exist, that's fine
      console.log("Constraint already exists or couldn't be created:", error.message);
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove the unique constraint
    try {
      await queryInterface.removeConstraint('travel_companions', 'unique_email_constraint');
    } catch (error) {
      console.log('Could not remove constraint:', error.message);
    }
  },
};
