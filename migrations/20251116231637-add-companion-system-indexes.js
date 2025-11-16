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

    // Create indexes for companion_relationships table
    await createIndexIfNotExists('companion_relationships', ['status'], {
      name: 'idx_companion_relationships_status',
      concurrently: true,
    });

    await createIndexIfNotExists('companion_relationships', ['userId'], {
      name: 'idx_companion_relationships_user',
      concurrently: true,
    });

    await createIndexIfNotExists('companion_relationships', ['companionUserId'], {
      name: 'idx_companion_relationships_companion_user',
      concurrently: true,
    });

    // Create indexes for trip_invitations table
    await createIndexIfNotExists('trip_invitations', ['status'], {
      name: 'idx_trip_invitations_status',
      concurrently: true,
    });

    await createIndexIfNotExists('trip_invitations', ['invitedUserId'], {
      name: 'idx_trip_invitations_invited_user',
      concurrently: true,
    });

    await createIndexIfNotExists('trip_invitations', ['tripId'], {
      name: 'idx_trip_invitations_trip',
      concurrently: true,
    });

    // Create indexes for item_companions table
    await createIndexIfNotExists('item_companions', ['itemType', 'itemId'], {
      name: 'idx_item_companions_item',
      concurrently: true,
    });

    await createIndexIfNotExists('item_companions', ['companionId'], {
      name: 'idx_item_companions_companion',
      concurrently: true,
    });

    // Create indexes for notifications table
    await createIndexIfNotExists('notifications', ['userId', 'read', 'createdAt'], {
      name: 'idx_notifications_user_read_created',
      concurrently: true,
    });

    await createIndexIfNotExists('notifications', ['userId', 'read'], {
      name: 'idx_notifications_user_read',
      concurrently: true,
    });
  },

  async down(queryInterface) {
    // Remove companion_relationships indexes
    await queryInterface.removeIndex(
      'companion_relationships',
      'idx_companion_relationships_status'
    );
    await queryInterface.removeIndex('companion_relationships', 'idx_companion_relationships_user');
    await queryInterface.removeIndex(
      'companion_relationships',
      'idx_companion_relationships_companion_user'
    );

    // Remove trip_invitations indexes
    await queryInterface.removeIndex('trip_invitations', 'idx_trip_invitations_status');
    await queryInterface.removeIndex('trip_invitations', 'idx_trip_invitations_invited_user');
    await queryInterface.removeIndex('trip_invitations', 'idx_trip_invitations_trip');

    // Remove item_companions indexes
    await queryInterface.removeIndex('item_companions', 'idx_item_companions_item');
    await queryInterface.removeIndex('item_companions', 'idx_item_companions_companion');

    // Remove notifications indexes
    await queryInterface.removeIndex('notifications', 'idx_notifications_user_read_created');
    await queryInterface.removeIndex('notifications', 'idx_notifications_user_read');
  },
};
