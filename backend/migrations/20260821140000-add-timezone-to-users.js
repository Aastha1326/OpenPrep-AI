'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'timezone', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'Asia/Kolkata',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'timezone');
  },
};
