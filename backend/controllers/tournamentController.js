/**
 * @fileoverview Controller for managing tournament creation, joining, and bracket retrieval.
 */
const tournamentService = require('../services/tournamentService');

// Mock in-memory store for tournaments
const tournaments = new Map();

/**
 * Creates a new tournament event.
 */
const createTournament = async (req, res) => {
    try {
        const { name, type, participants } = req.body;

        if (!name || !type || !Array.isArray(participants)) {
            return res.status(400).json({ success: false, message: 'name, type, and participants array are required.' });
        }

        const bracket = tournamentService.generateSingleEliminationBracket(participants);
        const tournamentId = `trn_${Date.now()}`;

        tournaments.set(tournamentId, {
            id: tournamentId,
            name,
            type,
            bracket,
            status: 'registration', // registration, active, completed
            createdAt: new Date().toISOString(),
        });

        res.status(201).json({ success: true, data: { id: tournamentId, name, bracket } });
    } catch (error) {
        console.error('[TournamentController] Create error:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

/**
 * Returns live bracket tree structure and match statuses.
 */
const getBracket = async (req, res) => {
    try {
        const { id } = req.params;
        const tournament = tournaments.get(id);

        if (!tournament) {
            return res.status(404).json({ success: false, message: 'Tournament not found.' });
        }

        res.status(200).json({ success: true, data: tournament });
    } catch (error) {
        console.error('[TournamentController] Get bracket error:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

/**
 * Registers a student or squad for a tournament.
 */
const joinTournament = async (req, res) => {
    try {
        const { id } = req.params;
        const { participant } = req.body;

        const tournament = tournaments.get(id);
        if (!tournament) {
            return res.status(404).json({ success: false, message: 'Tournament not found.' });
        }

        if (tournament.status !== 'registration') {
            return res.status(400).json({ success: false, message: 'Tournament is no longer accepting registrations.' });
        }

        // In production, add to DB and regenerate bracket if full
        res.status(200).json({ success: true, message: 'Successfully joined tournament.' });
    } catch (error) {
        console.error('[TournamentController] Join error:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

module.exports = {
    createTournament,
    getBracket,
    joinTournament,
};
