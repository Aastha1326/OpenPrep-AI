const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PDFAnnotation = sequelize.define(
  'PDFAnnotation',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    documentId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    pageNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    rectsData: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    color: {
      type: DataTypes.STRING,
      defaultValue: '#FFE900',
    },
    commentText: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        fields: ['documentId', 'pageNumber'],
      },
      {
        fields: ['userId', 'documentId'],
      },
    ],
  }
);

module.exports = PDFAnnotation;
