module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First check if the table exists
    const tableExists = await queryInterface.tableExists('UserBadges');
    
    if (!tableExists) {
      // Create the table if it doesn't exist
      await queryInterface.createTable('UserBadges', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        userId: {
          type: Sequelize.UUID,
          allowNull: false,
        },
        badgeCode: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        unlockedAt: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
          allowNull: false,
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
      });

      // Add unique constraint on userId and badgeCode
      await queryInterface.addIndex('UserBadges', ['userId', 'badgeCode'], {
        unique: true,
        name: 'user_badges_user_id_badge_code_unique',
      });
    } else {
      // If table exists, add the unique constraint if it doesn't exist
      try {
        await queryInterface.addIndex('UserBadges', ['userId', 'badgeCode'], {
          unique: true,
          name: 'user_badges_user_id_badge_code_unique',
        });
      } catch (error) {
        // If the index already exists, ignore the error
        if (error.name !== 'SequelizeDatabaseError') {
          throw error;
        }
      }
    }
  },

  down: async (queryInterface) => {
    // Remove the unique index
    try {
      await queryInterface.removeIndex('UserBadges', 'user_badges_user_id_badge_code_unique');
    } catch (error) {
      // Ignore if index doesn't exist
    }
    
    // Drop the table
    await queryInterface.dropTable('UserBadges');
  },
};
