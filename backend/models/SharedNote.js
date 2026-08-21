/**
 * @fileoverview Sequelize model for tracking shared notes and collaborative annotations.
 */
module.exports = (sequelize, DataTypes) => {
    const SharedNote = sequelize.define('SharedNote', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        ownerId: {
            type: DataTypes.UUID,
            allowNull: false,
            comment: 'User who uploaded the note',
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        contentUrl: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'URL to the stored note file (image/PDF)',
        },
        visibility: {
            type: DataTypes.ENUM('public', 'unlisted', 'private'),
            defaultValue: 'public',
        },
        annotations: {
            type: DataTypes.JSONB,
            defaultValue: [],
            comment: 'Array of annotation objects: { id, userId, x, y, text, timestamp }',
        },
        reportCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
    }, {
        tableName: 'shared_notes',
        timestamps: true,
        indexes: [
            { fields: ['ownerId'] },
            { fields: ['visibility'] }
        ]
    });

    return SharedNote;
};
