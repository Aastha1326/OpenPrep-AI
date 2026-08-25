const crypto = require('crypto');

class DeckVersionService {
  /**
   * Generates deterministic hash snapshot of a flashcard deck
   */
  generateDeckHash(cards = []) {
    const serialized = cards
      .map((c) => `${c.id || ''}:${c.front || ''}:${c.back || ''}`)
      .sort()
      .join('|');
    return crypto.createHash('sha256').update(serialized).digest('hex').substring(0, 16);
  }

  /**
   * Computes granular 3-way card diffs: ADDED, MODIFIED, DELETED
   */
  computeCardDiffs(baseCards = [], proposedCards = []) {
    const baseMap = new Map(baseCards.map((c) => [c.id || c.front, c]));
    const proposedMap = new Map(proposedCards.map((c) => [c.id || c.front, c]));

    const added = [];
    const modified = [];
    const deleted = [];
    const unchanged = [];

    // Find modified and unchanged
    proposedCards.forEach((pCard) => {
      const key = pCard.id || pCard.front;
      if (!baseMap.has(key)) {
        added.push(pCard);
      } else {
        const bCard = baseMap.get(key);
        if (bCard.front !== pCard.front || bCard.back !== pCard.back) {
          modified.push({
            before: bCard,
            after: pCard,
          });
        } else {
          unchanged.push(pCard);
        }
      }
    });

    // Find deleted
    baseCards.forEach((bCard) => {
      const key = bCard.id || bCard.front;
      if (!proposedMap.has(key)) {
        deleted.push(bCard);
      }
    });

    return {
      summary: {
        addedCount: added.length,
        modifiedCount: modified.length,
        deletedCount: deleted.length,
        unchangedCount: unchanged.length,
      },
      diffs: {
        added,
        modified,
        deleted,
        unchanged,
      },
    };
  }

  /**
   * Merges approved diffs into parent deck
   */
  applyDiffs(baseCards = [], diffReport = {}) {
    const { added = [], modified = [], deleted = [] } = diffReport.diffs || {};
    const deletedIds = new Set(deleted.map((d) => d.id || d.front));
    const modifiedMap = new Map(modified.map((m) => [m.before?.id || m.before?.front, m.after]));

    // Filter out deleted and replace modified
    const merged = baseCards
      .filter((card) => !deletedIds.has(card.id || card.front))
      .map((card) => {
        const key = card.id || card.front;
        if (modifiedMap.has(key)) {
          return modifiedMap.get(key);
        }
        return card;
      });

    // Append added cards
    return [...merged, ...added];
  }
}

module.exports = new DeckVersionService();
