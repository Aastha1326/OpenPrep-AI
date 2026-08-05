const fs = require('fs');
const path = require('path');
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PYQ = sequelize.define(
  'PYQ',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Please add a paper title' },
      },
    },
    exam: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    subject: {
      type: DataTypes.UUID,
      allowNull: false,
    },
year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    difficulty: {
      type: DataTypes.ENUM('Easy', 'Medium', 'Hard'),
      defaultValue: 'Medium',
    },
    chapters: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    fileUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },    analyzed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    analysisResults: {
      type: DataTypes.JSONB,
      defaultValue: {
        chapterWeightage: [],
        importantTopics: [],
        repeatedQuestions: [],
        trendAnalysis: '',
      },
    },
    user: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    timestamps: true,
      {
        name: 'pyq_user_id_idx',
        unique: false,
        fields: ['user', 'id'],
      },
      {
        name: 'pyq_exam_idx',
        fields: ['exam'],
      },
      {
        name: 'pyq_subject_idx',
        fields: ['subject'],
      },
      {
        name: 'pyq_user_exam_idx',
        fields: ['user', 'exam'],
      },
      {
        name: 'pyq_subject_year_difficulty_idx',
        fields: ['subject', 'year', 'difficulty'],
      },
    ],
    hooks: {
      afterDestroy: (pyq) => {
        if (!pyq.fileUrl) return;

        const uploadsDir = path.resolve(path.join(__dirname, '../uploads'));
        const absolutePath = path.resolve(path.join(__dirname, '..', pyq.fileUrl));
        const relative = path.relative(uploadsDir, absolutePath);
        const isInside = relative && !relative.startsWith('..') && !path.isAbsolute(relative);

        if (!isInside) {
          console.warn(`[PYQ Model] Path traversal blocked for fileUrl: ${pyq.fileUrl}`);
          return;
        }

        try {
          if (fs.existsSync(absolutePath)) {
            fs.unlinkSync(absolutePath);
          }
        } catch (err) {
          console.error(`[PYQ Model] Failed to delete file ${absolutePath}:`, err.message);
        }
      },
    },
  }
);

module.exports = PYQ;
