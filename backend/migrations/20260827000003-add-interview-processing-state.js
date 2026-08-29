'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'mock_interviews',
      'processingState',
      {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: 'IDLE',
      }
    );

    await queryInterface.addColumn(
      'mock_interviews',
      'processingError',
      {
        type: Sequelize.TEXT,
        allowNull: true,
      }
    );

    await queryInterface.addColumn(
      'mock_interviews',
      'processingUpdatedAt',
      {
        type: Sequelize.DATE,
        allowNull: true,
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.removeColumn(
      'mock_interviews',
      'processingUpdatedAt'
    );

    await queryInterface.removeColumn(
      'mock_interviews',
      'processingError'
    );

    await queryInterface.removeColumn(
      'mock_interviews',
      'processingState'
    );
  },
};