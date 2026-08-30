'use strict';

/**
 * Replaces the Mongoose-backed doubt session store with Postgres tables.
 *
 * The feature shipped with `models/DoubtSessionModel.js` defining a Mongoose
 * schema, which meant `require('./routes/doubtSessionRoutes')` in server.js
 * threw MODULE_NOT_FOUND and the API could not boot. There is no MongoDB in
 * this stack to migrate data out of, so this is a create-only migration.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('DoubtSessions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      studentId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
      },
      question: { type: Sequelize.TEXT, allowNull: false },
      subject: { type: Sequelize.STRING, allowNull: true },
      imageUrls: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
      hints: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
      currentLevel: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      status: {
        type: Sequelize.ENUM('active', 'solved', 'abandoned'),
        allowNull: false,
        defaultValue: 'active',
      },
      hintsAreFallback: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      resolvedAt: { type: Sequelize.DATE, allowNull: true },
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

    await queryInterface.createTable('DoubtSessionMessages', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      sessionId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'DoubtSessions', key: 'id' },
        onDelete: 'CASCADE',
      },
      role: { type: Sequelize.ENUM('student', 'tutor'), allowNull: false },
      content: { type: Sequelize.TEXT, allowNull: false },
      hintLevelAtSend: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
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

    await queryInterface.addIndex('DoubtSessions', ['studentId', 'createdAt'], {
      name: 'doubt_sessions_student_idx',
    });
    await queryInterface.addIndex('DoubtSessions', ['status'], {
      name: 'doubt_sessions_status_idx',
    });
    await queryInterface.addIndex('DoubtSessionMessages', ['sessionId', 'createdAt'], {
      name: 'doubt_session_messages_session_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('DoubtSessionMessages');
    await queryInterface.dropTable('DoubtSessions');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_DoubtSessionMessages_role";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_DoubtSessions_status";');
  },
};
