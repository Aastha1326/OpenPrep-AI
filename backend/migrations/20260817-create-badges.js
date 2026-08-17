module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Badges', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      icon: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      svgIcon: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      category: {
        type: Sequelize.ENUM('streak', 'quiz', 'flashcard', 'study', 'achievement'),
        defaultValue: 'achievement',
        allowNull: false,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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

    // Add index on category for faster filtering
    await queryInterface.addIndex('Badges', ['category']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('Badges');
  },
};
