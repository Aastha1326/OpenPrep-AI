/**
 * @fileoverview Sequelize model for storing collaborative note highlights and discussion threads.
 */
module.exports = (sequelize, DataTypes) => {
    const NoteHighlight = sequelize.define('NoteHighlight', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        noteId: {
            type: DataTypes.UUID,
            allowNull: false,
            comment: 'Reference to the parent study note',
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            comment: 'User who created the highlight',
        },
        startOffset: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Starting character index of the highlighted text',
        },
        endOffset: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Ending character index of the highlighted text',
        },
        highlightedText: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        color: {
            type: DataTypes.STRING,
            defaultValue: '#fde047', // Default yellow
            comment: 'Hex color code for the highlight',
        },
        isResolved: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    }, {
        tableName: 'note_highlights',
        timestamps: true,
        indexes: [
            { fields: ['noteId'] },
            { fields: ['userId'] }
        ]
    });

    return NoteHighlight;
};
