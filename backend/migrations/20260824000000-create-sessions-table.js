'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Sessions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      payload: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      restored: {
        type: Sequelize.BOOLEAN,
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
    });

    await queryInterface.addIndex('Sessions', ['userId'], {
      name: 'idx_sessions_user_id',
    });
    await queryInterface.addIndex('Sessions', ['userId', 'restored'], {
      name: 'idx_sessions_user_restored',
    });
    await queryInterface.addIndex('Sessions', ['expiresAt'], {
      name: 'idx_sessions_expires_at',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('Sessions', 'idx_sessions_user_id');
    await queryInterface.removeIndex('Sessions', 'idx_sessions_user_restored');
    await queryInterface.removeIndex('Sessions', 'idx_sessions_expires_at');
    await queryInterface.dropTable('Sessions');
  },
};
