'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('PDFAnnotations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      documentId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      pageNumber: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      rectsData: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      color: {
        type: Sequelize.STRING,
        defaultValue: '#FFE900',
      },
      commentText: {
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

    await queryInterface.addIndex('PDFAnnotations', ['documentId', 'pageNumber'], {
      name: 'idx_pdfannotations_document_page',
    });
    await queryInterface.addIndex('PDFAnnotations', ['userId', 'documentId'], {
      name: 'idx_pdfannotations_user_document',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('PDFAnnotations', 'idx_pdfannotations_document_page');
    await queryInterface.removeIndex('PDFAnnotations', 'idx_pdfannotations_user_document');
    await queryInterface.dropTable('PDFAnnotations');
  },
};