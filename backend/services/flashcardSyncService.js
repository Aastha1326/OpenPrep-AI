/**
 * Processes batch synchronized arrays of offline flashcard reviews.
 */
async function reconcileOfflineReviewBatch(req, res) {
  const { reviews } = req.body;
  const userId = req.user.id;

  if (!Array.isArray(reviews) || reviews.length === 0) {
    return res.status(400).json({ message: 'Invalid payload: Review logs list array is required.' });
  }

  try {
    const updatedCardsMap = {};

    // Group logs by cardId to isolate multiple reviews of the same card
    for (const log of reviews) {
      const existing = updatedCardsMap[log.cardId];
      
      // Last-Write-Wins: Preserve the latest log according to client-side timestamps
      if (!existing || new Date(log.clientTimestamp) > new Date(existing.clientTimestamp)) {
        updatedCardsMap[log.cardId] = log;
      }
    }

    // Process updates in an isolated database batch
    // In production, run this within an explicit SQL or MongoDB transaction block
    for (const cardId of Object.keys(updatedCardsMap)) {
      const targetLog = updatedCardsMap[cardId];
      
      // Reconcile and save card SM-2 intervals directly into the database core
      await db.query(
        `UPDATE user_flashcards 
         SET last_interval = $1, repetition_count = $2, ease_factor = $3, last_reviewed_at = $4
         WHERE card_id = $5 AND user_id = $6 AND (last_reviewed_at IS NULL OR last_reviewed_at < $4)`,
        [targetLog.interval, targetLog.repetition, targetLog.efactor, targetLog.clientTimestamp, cardId, userId]
      );
    }

    return res.status(200).json({
      status: 'SYNCHRONIZED',
      message: `Successfully processed and synchronized ${Object.keys(updatedCardsMap).length} individual card states.`
    });

  } catch (error) {
    console.error('Critical failure during offline reconciliation batch handling:', error);
    return res.status(500).json({ message: 'Internal Server Error during data synchronization.' });
  }
}

module.exports = { reconcileOfflineReviewBatch };
