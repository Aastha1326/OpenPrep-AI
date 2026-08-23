/**
 * @fileoverview Sequelize model for tracking published community flashcard decks.
 */
module.exports = (sequelize, DataTypes) => {
    const CommunityDeck = sequelize.define('CommunityDeck', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        ownerId: {
            type: DataTypes.UUID,
            allowNull: false,
            comment: 'User who created and published the deck',
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        subject: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        difficulty: {
            type: DataTypes.ENUM('Beginner', 'Intermediate', 'Advanced'),
            defaultValue: 'Intermediate',
        },
        upvotes: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        downvotes: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        isPublished: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    }, {
        tableName: 'community_decks',
        timestamps: true,
        indexes: [
            { fields: ['subject'] },
            { fields: ['upvotes'] }
        ]
    });

    return CommunityDeck;
};
