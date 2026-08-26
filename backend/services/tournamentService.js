/**
 * @fileoverview Tournament Bracket Manager for single/double elimination.
 * Handles seeding, matchmaking, and bracket progression.
 */

/**
 * Generates a single-elimination bracket from a list of participants.
 * Pads with 'BYE' if the number of participants is not a power of 2.
 * @param {Array} participants - Array of participant objects { id, name, mmr }
 * @returns {Array} Nested array representing the bracket rounds.
 */
function generateSingleEliminationBracket(participants) {
    // Sort by MMR (Matchmaking Rating) descending for seeding
    const sorted = [...participants].sort((a, b) => b.mmr - a.mmr);

    // Find next power of 2
    let size = 1;
    while (size < sorted.length) size *= 2;

    // Pad with BYEs
    const seeded = [...sorted];
    while (seeded.length < size) {
        seeded.push({ id: 'bye', name: 'BYE', mmr: 0 });
    }

    // Create first round matches
    let currentRound = [];
    for (let i = 0; i < size; i += 2) {
        currentRound.push({
            matchId: `m_1_${i / 2}`,
            player1: seeded[i],
            player2: seeded[i + 1],
            winner: null,
            score1: 0,
            score2: 0,
            status: seeded[i + 1].id === 'bye' ? 'completed' : 'pending' // Auto-advance BYE
        });
    }

    // Auto-advance BYEs in round 1
    currentRound.forEach(match => {
        if (match.status === 'completed') {
            match.winner = match.player1.id === 'bye' ? match.player2 : match.player1;
        }
    });

    const bracket = [currentRound];

    // Generate subsequent rounds
    let roundNum = 2;
    while (currentRound.length > 1) {
        const nextRound = [];
        for (let i = 0; i < currentRound.length; i += 2) {
            nextRound.push({
                matchId: `m_${roundNum}_${i / 2}`,
                player1: currentRound[i].winner || { id: 'TBD', name: 'TBD' },
                player2: currentRound[i + 1].winner || { id: 'TBD', name: 'TBD' },
                winner: null,
                score1: 0,
                score2: 0,
                status: 'pending'
            });
        }
        bracket.push(nextRound);
        currentRound = nextRound;
        roundNum++;
    }

    return bracket;
}

/**
 * Records a match result and advances the winner.
 */
function updateMatchResult(bracket, roundIndex, matchIndex, winnerId, score1, score2) {
    const match = bracket[roundIndex][matchIndex];
    if (!match || match.status === 'completed') return false;

    match.score1 = score1;
    match.score2 = score2;
    match.winner = match.player1.id === winnerId ? match.player1 : match.player2;
    match.status = 'completed';

    // Advance to next round
    if (roundIndex + 1 < bracket.length) {
        const nextMatchIndex = Math.floor(matchIndex / 2);
        const isPlayer1Slot = matchIndex % 2 === 0;

        if (isPlayer1Slot) {
            bracket[roundIndex + 1][nextMatchIndex].player1 = match.winner;
        } else {
            bracket[roundIndex + 1][nextMatchIndex].player2 = match.winner;
        }
    }

    return true;
}

module.exports = {
    generateSingleEliminationBracket,
    updateMatchResult,
};
