module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Add isAdmin field
      await queryInterface.addColumn(
        'users',
        'isAdmin',
        {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false,
        },
        { transaction }
      );

      // Add lastLogin field
      await queryInterface.addColumn(
        'users',
        'lastLogin',
        {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: null,
        },
        { transaction }
      );

      // Add isActive field for soft deletes
      await queryInterface.addColumn(
        'users',
        'isActive',
        {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
          allowNull: false,
        },
        { transaction }
      );

      // Create index on isAdmin for faster filtering
      await queryInterface.addIndex('users', ['isAdmin'], {
        name: 'idx_users_is_admin',
        transaction,
      });

      // Create index on isActive for soft delete filtering
      await queryInterface.addIndex('users', ['isActive'], {
        name: 'idx_users_is_active',
        transaction,
      });

      // Create index on lastLogin for sorting
      await queryInterface.addIndex('users', ['lastLogin'], {
        name: 'idx_users_last_login',
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Remove indexes
      await queryInterface.removeIndex('users', 'idx_users_is_admin', { transaction });
      await queryInterface.removeIndex('users', 'idx_users_is_active', { transaction });
      await queryInterface.removeIndex('users', 'idx_users_last_login', { transaction });

      // Remove columns
      await queryInterface.removeColumn('users', 'isAdmin', { transaction });
      await queryInterface.removeColumn('users', 'lastLogin', { transaction });
      await queryInterface.removeColumn('users', 'isActive', { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
