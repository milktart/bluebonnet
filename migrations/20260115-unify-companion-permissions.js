'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const tables = await queryInterface.showAllTables();

      // Step 1: Modify CompanionPermission table
      if (tables.includes('companion_permissions')) {
        const columns = await queryInterface.describeTable('companion_permissions');

        // Check if old schema exists
        if (columns.canShareTrips && columns.canManageTrips && !columns.canView) {
          // Drop old columns and add new ones
          if (columns.canShareTrips) {
            await queryInterface.removeColumn('companion_permissions', 'canShareTrips', { transaction });
          }
          if (columns.canManageTrips) {
            await queryInterface.removeColumn('companion_permissions', 'canManageTrips', { transaction });
          }
        }

        // Add new columns if they don't exist
        if (!columns.canView) {
          await queryInterface.addColumn(
            'companion_permissions',
            'canView',
            {
              type: Sequelize.BOOLEAN,
              allowNull: false,
              defaultValue: true,
            },
            { transaction }
          );
        }

        if (!columns.canEdit) {
          await queryInterface.addColumn(
            'companion_permissions',
            'canEdit',
            {
              type: Sequelize.BOOLEAN,
              allowNull: false,
              defaultValue: false,
            },
            { transaction }
          );
        }

        if (!columns.canManageCompanions) {
          await queryInterface.addColumn(
            'companion_permissions',
            'canManageCompanions',
            {
              type: Sequelize.BOOLEAN,
              allowNull: false,
              defaultValue: false,
            },
            { transaction }
          );
        }
      }

      // Step 2: Modify TripCompanion table
      if (tables.includes('trip_companions')) {
        const columns = await queryInterface.describeTable('trip_companions');

        // Remove old canEdit column if it exists
        if (columns.canEdit) {
          await queryInterface.removeColumn('trip_companions', 'canEdit', { transaction });
        }

        // Add new permission columns if they don't exist
        if (!columns.canView) {
          await queryInterface.addColumn(
            'trip_companions',
            'canView',
            {
              type: Sequelize.BOOLEAN,
              allowNull: false,
              defaultValue: true,
            },
            { transaction }
          );
        }

        if (!columns.canEdit) {
          await queryInterface.addColumn(
            'trip_companions',
            'canEdit',
            {
              type: Sequelize.BOOLEAN,
              allowNull: false,
              defaultValue: false,
            },
            { transaction }
          );
        }

        if (!columns.canManageCompanions) {
          await queryInterface.addColumn(
            'trip_companions',
            'canManageCompanions',
            {
              type: Sequelize.BOOLEAN,
              allowNull: false,
              defaultValue: false,
            },
            { transaction }
          );
        }

        // Ensure inheritedFromTrip column exists
        if (!columns.inheritedFromTrip) {
          await queryInterface.addColumn(
            'trip_companions',
            'inheritedFromTrip',
            {
              type: Sequelize.BOOLEAN,
              allowNull: false,
              defaultValue: false,
            },
            { transaction }
          );
        }
      }

      // Step 3: Create ItemCompanionPermission table
      if (!tables.includes('item_companion_permissions')) {
        await queryInterface.createTable(
          'item_companion_permissions',
          {
            id: {
              type: Sequelize.UUID,
              defaultValue: Sequelize.UUIDV4,
              primaryKey: true,
            },
            itemType: {
              type: Sequelize.ENUM('flight', 'hotel', 'transportation', 'car_rental', 'event'),
              allowNull: false,
            },
            itemId: {
              type: Sequelize.UUID,
              allowNull: false,
            },
            companionId: {
              type: Sequelize.UUID,
              allowNull: false,
              references: {
                model: 'travel_companions',
                key: 'id',
              },
              onDelete: 'CASCADE',
            },
            canView: {
              type: Sequelize.BOOLEAN,
              allowNull: false,
              defaultValue: true,
            },
            canEdit: {
              type: Sequelize.BOOLEAN,
              allowNull: false,
              defaultValue: false,
            },
            canManageCompanions: {
              type: Sequelize.BOOLEAN,
              allowNull: false,
              defaultValue: false,
            },
            createdAt: {
              type: Sequelize.DATE,
              allowNull: false,
              defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updatedAt: {
              type: Sequelize.DATE,
              allowNull: false,
              defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
          },
          { transaction }
        );

        // Add indexes
        await queryInterface.addIndex(
          'item_companion_permissions',
          ['itemType', 'itemId'],
          { transaction }
        );
        await queryInterface.addIndex(
          'item_companion_permissions',
          ['companionId'],
          { transaction }
        );
        await queryInterface.addIndex(
          'item_companion_permissions',
          ['itemType', 'itemId', 'companionId'],
          { unique: true, transaction }
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const tables = await queryInterface.showAllTables();

      // Drop ItemCompanionPermission table
      if (tables.includes('item_companion_permissions')) {
        await queryInterface.dropTable('item_companion_permissions', { transaction });
      }

      // Revert TripCompanion table
      if (tables.includes('trip_companions')) {
        const columns = await queryInterface.describeTable('trip_companions');

        // Remove new columns
        if (columns.canView) {
          await queryInterface.removeColumn('trip_companions', 'canView', { transaction });
        }
        if (columns.canEdit) {
          await queryInterface.removeColumn('trip_companions', 'canEdit', { transaction });
        }
        if (columns.canManageCompanions) {
          await queryInterface.removeColumn('trip_companions', 'canManageCompanions', { transaction });
        }
        if (columns.inheritedFromTrip) {
          await queryInterface.removeColumn('trip_companions', 'inheritedFromTrip', { transaction });
        }

        // Re-add old canEdit column
        await queryInterface.addColumn(
          'trip_companions',
          'canEdit',
          {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          { transaction }
        );
      }

      // Revert CompanionPermission table
      if (tables.includes('companion_permissions')) {
        const columns = await queryInterface.describeTable('companion_permissions');

        // Remove new columns
        if (columns.canView) {
          await queryInterface.removeColumn('companion_permissions', 'canView', { transaction });
        }
        if (columns.canEdit) {
          await queryInterface.removeColumn('companion_permissions', 'canEdit', { transaction });
        }
        if (columns.canManageCompanions) {
          await queryInterface.removeColumn('companion_permissions', 'canManageCompanions', { transaction });
        }

        // Re-add old columns
        await queryInterface.addColumn(
          'companion_permissions',
          'canShareTrips',
          {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          { transaction }
        );

        await queryInterface.addColumn(
          'companion_permissions',
          'canManageTrips',
          {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          { transaction }
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
