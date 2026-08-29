'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create StudyPlanVersion table
    await queryInterface.createTable('StudyPlanVersions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      studyPlanId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'StudyPlans',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      versionNumber: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create StudyTask table
    await queryInterface.createTable('StudyTasks', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      versionId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'StudyPlanVersions',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      topic: {
        type: Sequelize.STRING,
        allowNull: false
      },
      scheduledDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      estimatedHours: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      completionStatus: {
        type: Sequelize.ENUM('pending', 'in_progress', 'completed', 'skipped'),
        defaultValue: 'pending'
      },
      isLocked: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create TaskDependency table
    await queryInterface.createTable('TaskDependencies', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      taskId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'StudyTasks',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      dependsOnTaskId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'StudyTasks',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create PlanRevisionMetadata table
    await queryInterface.createTable('PlanRevisionMetadata', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      versionId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'StudyPlanVersions',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      revisionReason: {
        type: Sequelize.ENUM('initial_creation', 'exam_date_changed', 'available_hours_changed', 'performance_change', 'manual_adjustment'),
        allowNull: false
      },
      previousExamDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      newExamDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      previousDailyHours: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      newDailyHours: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      changedTaskCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      preservedTaskCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('StudyPlanVersions', ['studyPlanId']);
    await queryInterface.addIndex('StudyPlanVersions', ['isActive']);
    await queryInterface.addIndex('StudyTasks', ['versionId']);
    await queryInterface.addIndex('StudyTasks', ['scheduledDate']);
    await queryInterface.addIndex('StudyTasks', ['completionStatus']);
    await queryInterface.addIndex('TaskDependencies', ['taskId']);
    await queryInterface.addIndex('PlanRevisionMetadata', ['versionId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('PlanRevisionMetadata');
    await queryInterface.dropTable('TaskDependencies');
    await queryInterface.dropTable('StudyTasks');
    await queryInterface.dropTable('StudyPlanVersions');
  }
};