'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addIndex('Flashcards', ['user', 'nextReviewDate'], {
      name: 'idx_flashcards_user_next_review',
    });
    await queryInterface.addIndex('Flashcards', ['user', 'topic'], {
      name: 'idx_flashcards_user_topic',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('Flashcards', 'idx_flashcards_user_next_review');
    await queryInterface.removeIndex('Flashcards', 'idx_flashcards_user_topic');
  },
};