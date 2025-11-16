module.exports = {
  async up(queryInterface) {
    // Create indexes for companion_relationships table
    await queryInterface.addIndex('companion_relationships', ['status'], {
      name: 'idx_companion_relationships_status',
      concurrently: true,
    });

    await queryInterface.addIndex('companion_relationships', ['userId'], {
      name: 'idx_companion_relationships_user',
      concurrently: true,
    });

    await queryInterface.addIndex('companion_relationships', ['companionUserId'], {
      name: 'idx_companion_relationships_companion_user',
      concurrently: true,
    });

    // Create indexes for trip_invitations table
    await queryInterface.addIndex('trip_invitations', ['status'], {
      name: 'idx_trip_invitations_status',
      concurrently: true,
    });

    await queryInterface.addIndex('trip_invitations', ['invitedUserId'], {
      name: 'idx_trip_invitations_invited_user',
      concurrently: true,
    });

    await queryInterface.addIndex('trip_invitations', ['tripId'], {
      name: 'idx_trip_invitations_trip',
      concurrently: true,
    });

    // Create indexes for item_companions table
    await queryInterface.addIndex('item_companions', ['itemType', 'itemId'], {
      name: 'idx_item_companions_item',
      concurrently: true,
    });

    await queryInterface.addIndex('item_companions', ['companionId'], {
      name: 'idx_item_companions_companion',
      concurrently: true,
    });

    // Create indexes for notifications table
    await queryInterface.addIndex('notifications', ['userId', 'read', 'createdAt'], {
      name: 'idx_notifications_user_read_created',
      concurrently: true,
    });

    await queryInterface.addIndex('notifications', ['userId', 'read'], {
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
