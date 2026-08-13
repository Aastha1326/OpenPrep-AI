const fs = require('fs');
const path = require('path');
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Note = sequelize.define(
  'Note',
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
        notEmpty: { msg: 'Please add a note title' },
      },
    },
    content: {
      type: DataTypes.TEXT,
    },
    subject: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    topic: {
      type: DataTypes.UUID,
    },
    fileUrl: {
      type: DataTypes.STRING,
    },
    fileType: {
      type: DataTypes.STRING,
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    category: {
      type: DataTypes.ENUM('Lecture Notes', 'Study Guide', 'Cheat Sheet', 'Summary', 'Other'),
      defaultValue: 'Lecture Notes',
    },
    downloadsCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    user: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    aiSummary: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        name: 'note_user_idx',
        fields: ['user'],
      },
      {
        name: 'note_subject_idx',
        fields: ['subject'],
      },
      {
        name: 'note_topic_idx',
        fields: ['topic'],
      },
      {
        name: 'note_user_subject_idx',
        fields: ['user', 'subject'],
      },
    ],
    hooks: {
      afterDestroy: (note) => {
        if (!note.fileUrl) return;

        const uploadsDir = path.resolve(path.join(__dirname, '../uploads'));
        const absolutePath = path.resolve(path.join(__dirname, '..', note.fileUrl));
        const relative = path.relative(uploadsDir, absolutePath);
        const isInside = relative && !relative.startsWith('..') && !path.isAbsolute(relative);

        if (!isInside) {
          console.warn(`[Note Model] Path traversal blocked for fileUrl: ${note.fileUrl}`);
          return;
        }

        try {
          if (fs.existsSync(absolutePath)) {
            fs.unlinkSync(absolutePath);
          }
        } catch (err) {
          console.error(`[Note Model] Failed to delete file ${absolutePath}:`, err.message);
        }
      },
    },
  }
);

module.exports = Note;
