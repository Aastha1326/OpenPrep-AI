'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('skill_dependencies', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      skillId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'topics',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      prerequisiteSkillId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'topics',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      dependencyType: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: 'prerequisite',
      },
      weight: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 1,
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

    await queryInterface.addConstraint('skill_dependencies', {
      fields: ['skillId', 'prerequisiteSkillId'],
      type: 'unique',
      name: 'skill_dependencies_unique_pair',
    });

    await queryInterface.addConstraint('skill_dependencies', {
      fields: ['skillId'],
      type: 'check',
      name: 'skill_dependencies_no_self_dependency',
      where: {
        skillId: {
          [Sequelize.Op.ne]: Sequelize.col('prerequisiteSkillId'),
        },
      },
    });

    await queryInterface.addIndex(
      'skill_dependencies',
      ['skillId'],
      { name: 'skill_dependencies_skill_idx' }
    );

    await queryInterface.addIndex(
      'skill_dependencies',
      ['prerequisiteSkillId'],
      { name: 'skill_dependencies_prerequisite_idx' }
    );
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      'skill_dependencies',
      'skill_dependencies_skill_idx'
    );

    await queryInterface.removeIndex(
      'skill_dependencies',
      'skill_dependencies_prerequisite_idx'
    );

    await queryInterface.removeConstraint(
      'skill_dependencies',
      'skill_dependencies_no_self_dependency'
    );

    await queryInterface.removeConstraint(
      'skill_dependencies',
      'skill_dependencies_unique_pair'
    );

    await queryInterface.dropTable('skill_dependencies');
  },
};