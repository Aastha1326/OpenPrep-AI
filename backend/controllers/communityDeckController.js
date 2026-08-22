/**
 * @fileoverview Controller for managing community flashcard deck curation and voting.
 */
// const CommunityDeck = require('../models/CommunityDeck');
// const DeckVote = require('../models/DeckVote');

/**
 * Fetches trending community decks with optional filtering.
 */
const getTrendingDecks = async (req, res) => {
    try {
        const { subject, difficulty } = req.query;

        // Mock response for demonstration
        const mockDecks = [
            {
                id: 'deck-1',
                title: 'Advanced Calculus',
                ownerName: 'MathWhiz',
                subject: 'Mathematics',
                difficulty: 'Advanced',
                upvotes: 142,
                downvotes: 5,
                createdAt: new Date().toISOString(),
            },
            {
                id: 'deck-2',
                title: 'Intro to Psychology',
                ownerName: 'Brainy',
                subject: 'Psychology',
                difficulty: 'Beginner',
                upvotes: 89,
                downvotes: 2,
                createdAt: new Date(Date.now() - 86400000).toISOString(),
            }
        ];

        let filtered = mockDecks;
        if (subject) filtered = filtered.filter(d => d.subject === subject);
        if (difficulty) filtered = filtered.filter(d => d.difficulty === difficulty);

        res.status(200).json({
            success: true,
            data: filtered.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes)),
        });
    } catch (error) {
        console.error('Error fetching community decks:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

/**
 * Handles upvoting or downvoting a community deck.
 */
const voteOnDeck = async (req, res) => {
    try {
        const { deckId } = req.params;
        const { voteType } = req.body; // 'up' or 'down'
        // const userId = req.user.id;

        if (!['up', 'down'].includes(voteType)) {
            return res.status(400).json({ success: false, message: 'Invalid vote type.' });
        }

        // Mock DB logic:
        // 1. Check if user already voted. If yes, update or delete.
        // 2. Update CommunityDeck upvotes/downvotes count accordingly.

        res.status(200).json({
            success: true,
            message: `Successfully ${voteType}voted deck.`,
        });
    } catch (error) {
        console.error('Error voting on deck:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

module.exports = {
    getTrendingDecks,
    voteOnDeck,
};
