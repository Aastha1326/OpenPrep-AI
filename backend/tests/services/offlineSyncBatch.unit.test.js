const { batchSyncOfflineReviews } = require('../../controllers/flashcardController');
const Flashcard = require('../../models/Flashcard');
const { calculateSM2 } = require('../../utils/sm2');

describe('Offline-First PWA Background Sync Batch Review Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    vi.restoreAllMocks();
    req = {
      user: { id: 'user-123' },
      body: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
  });

  it('returns 400 if reviews array is missing or empty', async () => {
    req.body = { reviews: [] };

    await batchSyncOfflineReviews(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: 'Provide a non-empty array of offline reviews to sync',
    }));
  });

  it('syncs batch of offline reviews with client-provided timestamps', async () => {
    const mockCard = {
      id: 'card-1',
      user: 'user-123',
      interval: 1,
      repetitions: 1,
      efactor: 2.5,
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(Flashcard, 'findOne').mockResolvedValue(mockCard);

    const clientTimestamp = '2026-08-21T10:00:00.000Z';
    req.body = {
      reviews: [
        { cardId: 'card-1', score: 4, reviewedAt: clientTimestamp },
      ],
    };

    await batchSyncOfflineReviews(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        synced: 1,
        skipped: 0,
      }),
    }));
    expect(mockCard.save).toHaveBeenCalled();
  });

  it('accepts alternative payload key formats (flashcardId & quality)', async () => {
    const mockCard = {
      id: 'card-2',
      user: 'user-123',
      interval: 2,
      repetitions: 2,
      efactor: 2.5,
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(Flashcard, 'findOne').mockResolvedValue(mockCard);

    req.body = {
      batch: [
        { flashcardId: 'card-2', quality: 5, timestamp: '2026-08-21T11:00:00.000Z' },
      ],
    };

    await batchSyncOfflineReviews(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        synced: 1,
      }),
    }));
  });
});
