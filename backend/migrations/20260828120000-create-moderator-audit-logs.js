'use strict';

/**
 * Creates the table models/ModeratorAuditLog.js has always described.
 *
 * The model shipped without an init call, without a registry entry and without
 * a migration, so `const { ModeratorAuditLog } = require('../models')` in
 * AnalyticsService resolved to undefined and every moderation-log read threw
 * on first call. The comment flag pipeline needs somewhere to record why an
 * account was silenced, and this is the table that was meant to hold it.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('moderator_audit_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      moderatorId: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'The moderator or admin who acted. A system id implies an automated action.',
      },
      targetUserId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onDelete: 'RESTRICT',
      },
      contentItemId: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      actionType: { type: Sequelize.STRING(100), allowNull: false },
      entityModel: { type: Sequelize.STRING(50), allowNull: true },
      reason: { type: Sequelize.TEXT, allowNull: false },
      metadata: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      detectedByAI: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      aiConfidenceScore: { type: Sequelize.FLOAT, allowNull: true },
      revertedAt: { type: Sequelize.DATE, allowNull: true },
      revertedById: { type: Sequelize.UUID, allowNull: true },
      revertReason: { type: Sequelize.TEXT, allowNull: true },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
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
      // The model is paranoid: audit rows are never hard deleted.
      deletedAt: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.addIndex('moderator_audit_logs', ['moderatorId'], {
      name: 'idx_modlog_moderator',
    });
    await queryInterface.addIndex('moderator_audit_logs', ['targetUserId'], {
      name: 'idx_modlog_target_user',
    });
    await queryInterface.addIndex('moderator_audit_logs', ['actionType', 'timestamp'], {
      name: 'idx_modlog_action_timestamp',
    });
    await queryInterface.addIndex('moderator_audit_logs', ['entityModel', 'contentItemId'], {
      name: 'idx_modlog_content_item',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('moderator_audit_logs');
  },
};
