module.exports = (sequelize, DataTypes) => {
  const CollaborativeCodingSession = sequelize.define('CollaborativeCodingSession', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    roomId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      index: true,
    },
    // Versioning
    stateVersion: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
      comment: 'Monotonically increasing version number',
    },
    // Room state
    code: {
      type: DataTypes.TEXT,
      defaultValue: '// Collaborative Coding Room\n',
    },
    language: {
      type: DataTypes.STRING,
      defaultValue: 'javascript',
    },
    output: {
      type: DataTypes.JSON,
      defaultValue: null,
    },
    // Update log (last 1000 updates stored)
    updateLog: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    // Participants and state
    participants: {
      type: DataTypes.JSON,
      defaultValue: {},
      comment: 'Active participants and their cursors',
    },
    chatMessages: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    // Metadata
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    expiresAt: {
      type: DataTypes.DATE,
      index: true,
    },
  }, {
    tableName: 'collaborative_coding_sessions',
    timestamps: true,
  });

  return CollaborativeCodingSession;
};