'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('FocusSessionLogs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
      },
      subject: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'Subjects', key: 'id' },
        onDelete: 'SET NULL',
      },
      subjectName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      taskType: {
        type: Sequelize.ENUM('reading', 'flashcards', 'quiz', 'notes', 'revision', 'practice', 'other'),
        defaultValue: 'other',
        allowNull: false,
      },
      startedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      endedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      plannedMinutes: {
        type: Sequelize.INTEGER,
        defaultValue: 25,
        allowNull: false,
      },
      actualMinutes: {
        type: Sequelize.FLOAT,
        defaultValue: 0,
        allowNull: false,
      },
      activeSeconds: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      pausedSeconds: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      breakSeconds: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      interruptions: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      interruptionDetails: {
        type: Sequelize.JSONB,
        defaultValue: [],
        allowNull: false,
      },
      efficiencyScore: {
        type: Sequelize.FLOAT,
        defaultValue: 0,
        allowNull: false,
      },
      focusScore: {
        type: Sequelize.FLOAT,
        defaultValue: 0,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('active', 'paused', 'completed', 'abandoned'),
        defaultValue: 'active',
        allowNull: false,
      },
      pomodoroNumber: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        allowNull: false,
      },
      dailyGoalMinutes: {
        type: Sequelize.INTEGER,
        defaultValue: 120,
        allowNull: false,
      },
      metGoal: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      tags: {
        type: Sequelize.JSONB,
        defaultValue: [],
        allowNull: false,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {},
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.addIndex('FocusSessionLogs', ['user'], {
      name: 'fslog_user_status_idx',
    });
    await queryInterface.addIndex('FocusSessionLogs', ['user', 'createdAt'], {
      name: 'fslog_user_created_idx',
    });
    await queryInterface.addIndex('FocusSessionLogs', ['user', 'subject'], {
      name: 'fslog_user_subject_idx',
    });
    await queryInterface.addIndex('FocusSessionLogs', ['user', 'taskType'], {
      name: 'fslog_user_tasktype_idx',
    });
    await queryInterface.addIndex('FocusSessionLogs', ['user', 'startedAt'], {
      name: 'fslog_user_date_idx',
    });
    await queryInterface.addIndex('FocusSessionLogs', ['status'], {
      name: 'fslog_status_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('FocusSessionLogs');
  },
};
