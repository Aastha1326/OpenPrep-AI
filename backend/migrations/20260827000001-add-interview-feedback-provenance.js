'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('mock_interviews', 'feedbackProvenance', {
      type: Sequelize.JSONB,
      allowNull: true,
      comment: 'Evidence, AI model, prompt version, and confidence metadata for interview feedback',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn(
      'mock_interviews',
      'feedbackProvenance'
    );
  },
};