/**
 * @fileoverview Sequelize model for tracking individual user votes on community decks.
 */
module.exports = (sequelize, DataTypes) => {
    const DeckVote = sequelize.define('DeckVote', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        deckId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        voteType: {
            type: DataTypes.ENUM('up', 'down'),
            allowNull: false,
        },
    }, {
        tableName: 'deck_votes',
        timestamps: true,
        indexes: [
            { fields: ['userId', 'deckId'], unique: true }
        ]
    });

    return DeckVote;
};
