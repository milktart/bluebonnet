'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Backup existing data if the table exists
      const tables = await queryInterface.showAllTables();
      if (tables.includes('companion_permissions')) {
        // Check if old schema exists (has ownerId and trustedUserId)
        const columns = await queryInterface.describeTable('companion_permissions');
        if (columns.ownerId && columns.trustedUserId) {
          // Old schema exists - need to migrate
          // 1. Create temporary table with new schema
          await queryInterface.createTable(
            'companion_permissions_new',
            {
              id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
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
              grantedBy: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                  model: 'users',
                  key: 'id',
                },
                onDelete: 'CASCADE',
              },
              canShareTrips: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
              },
              canManageTrips: {
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

          // 2. Migrate data: Map trustedUserId to a companion record
          // For each permission, find or create a TravelCompanion for the trustedUser
          // with ownerId as createdBy
          await queryInterface.sequelize.query(
            `INSERT INTO companion_permissions_new (id, "companionId", "grantedBy", "canShareTrips", "canManageTrips", "createdAt", "updatedAt")
             SELECT
               gen_random_uuid() as id,
               tc.id as "companionId",
               cp."ownerId" as "grantedBy",
               cp."canViewAllTrips" as "canShareTrips",
               cp."canManageAllTrips" as "canManageTrips",
               cp."createdAt",
               cp."updatedAt"
             FROM companion_permissions cp
             JOIN travel_companions tc ON tc."userId" = cp."trustedUserId" AND tc."createdBy" = cp."ownerId"`,
            { transaction }
          );

          // 3. Drop old table
          await queryInterface.dropTable('companion_permissions', { transaction });

          // 4. Rename new table to old name
          await queryInterface.renameTable('companion_permissions_new', 'companion_permissions', {
            transaction,
          });

          // 5. Add indexes
          await queryInterface.addIndex('companion_permissions', ['companionId'], { transaction });
          await queryInterface.addIndex('companion_permissions', ['grantedBy'], { transaction });
          await queryInterface.addIndex('companion_permissions', ['companionId', 'grantedBy'], {
            unique: true,
            transaction,
          });
        }
      } else {
        // Table doesn't exist - create it with new schema
        await queryInterface.createTable(
          'companion_permissions',
          {
            id: {
              type: Sequelize.UUID,
              defaultValue: Sequelize.UUIDV4,
              primaryKey: true,
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
            grantedBy: {
              type: Sequelize.UUID,
              allowNull: false,
              references: {
                model: 'users',
                key: 'id',
              },
              onDelete: 'CASCADE',
            },
            canShareTrips: {
              type: Sequelize.BOOLEAN,
              allowNull: false,
              defaultValue: false,
            },
            canManageTrips: {
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
        await queryInterface.addIndex('companion_permissions', ['companionId'], { transaction });
        await queryInterface.addIndex('companion_permissions', ['grantedBy'], { transaction });
        await queryInterface.addIndex('companion_permissions', ['companionId', 'grantedBy'], {
          unique: true,
          transaction,
        });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // For down migration, we'll keep the old schema
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Create old table structure
      await queryInterface.createTable(
        'companion_permissions_old',
        {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
          },
          ownerId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id',
            },
            onDelete: 'CASCADE',
          },
          trustedUserId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id',
            },
            onDelete: 'CASCADE',
          },
          canManageAllTrips: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          canViewAllTrips: {
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

      // Migrate back data
      await queryInterface.sequelize.query(
        `INSERT INTO companion_permissions_old (id, "ownerId", "trustedUserId", "canManageAllTrips", "canViewAllTrips", "createdAt", "updatedAt")
         SELECT
           gen_random_uuid() as id,
           cp."grantedBy" as "ownerId",
           u.id as "trustedUserId",
           cp."canManageTrips" as "canManageAllTrips",
           cp."canShareTrips" as "canViewAllTrips",
           cp."createdAt",
           cp."updatedAt"
         FROM companion_permissions cp
         JOIN travel_companions tc ON cp."companionId" = tc.id
         JOIN users u ON tc."userId" = u.id`,
        { transaction }
      );

      // Drop new table and rename old
      await queryInterface.dropTable('companion_permissions', { transaction });
      await queryInterface.renameTable('companion_permissions_old', 'companion_permissions', {
        transaction,
      });

      // Add old indexes
      await queryInterface.addIndex('companion_permissions', ['ownerId'], { transaction });
      await queryInterface.addIndex('companion_permissions', ['trustedUserId'], { transaction });
      await queryInterface.addIndex('companion_permissions', ['ownerId', 'trustedUserId'], {
        unique: true,
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
