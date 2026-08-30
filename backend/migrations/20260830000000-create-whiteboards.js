'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Whiteboards', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      roomId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      squadId: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Collaborative Whiteboard',
      },
      state: {
        type: Sequelize.JSONB,
        defaultValue: { strokes: [], nodes: [], edges: [] },
        allowNull: false,
      },
      previewUrl: {
        type: Sequelize.TEXT,
        allowNull: true,
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

    await queryInterface.addIndex('Whiteboards', ['roomId'], {
      name: 'whiteboard_room_idx',
    });
    await queryInterface.addIndex('Whiteboards', ['squadId'], {
      name: 'whiteboard_squad_idx',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('Whiteboards', 'whiteboard_room_idx');
    await queryInterface.removeIndex('Whiteboards', 'whiteboard_squad_idx');
    await queryInterface.dropTable('Whiteboards');
  },
};
