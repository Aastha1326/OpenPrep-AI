/**
 * MVP Mock for Matchmaking & Elo (Issue #1297)
 */

exports.joinMatchmaking = async (req, res) => {
  try {
    // In production, we'd add req.user.id to a Redis queue and wait for an opponent.
    // MVP: Instantly match them against a bot/mock player
    setTimeout(() => {
      res.status(200).json({
        matchFound: true,
        roomId: `battle-${Date.now()}`,
        opponent: {
          id: 'bot_1',
          name: 'ScholarBot 3000',
          elo: 1450,
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Scholar'
        }
      });
    }, 1500); // Simulate queue delay
  } catch (err) {
    res.status(500).json({ message: 'Matchmaking failed' });
  }
};

exports.calculateElo = async (req, res) => {
  try {
    const { won, myCurrentElo, opponentElo } = req.body;
    
    // Standard basic Elo calculation MVP
    const kFactor = 32;
    const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - myCurrentElo) / 400));
    const actualScore = won ? 1 : 0;
    
    const newElo = Math.round(myCurrentElo + kFactor * (actualScore - expectedScore));

    res.status(200).json({
      newElo,
      diff: newElo - myCurrentElo
    });
  } catch (err) {
    res.status(500).json({ message: 'Elo calculation failed' });
  }
};
