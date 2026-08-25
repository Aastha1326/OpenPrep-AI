const { Op, fn, col } = require('sequelize');
const { SharedNote, FlashcardDeck, Flashcard, DeckRating, DeckCollaborator, Note, User, Subject } = require('../models');

/**
 * Community Resource Hub — unified service for discovering, rating,
 * bookmarking, and sharing study resources across the community.
 */

/**
 * Discover all public community resources with filtering and sorting.
 */
exports.discoverResources = async (userId, filters = {}) => {
  const { type, subject, search, sort = 'recent', page = 1, limit = 20 } = filters;
  const offset = (page - 1) * limit;

  const results = [];

  // Fetch public notes
  if (!type || type === 'notes') {
    const notes = await Note.findAll({
      where: { isPublic: true, ...(subject ? { subject } : {}) },
      include: [
        { model: User, as: 'userRef', attributes: ['id', 'name', 'avatar'] },
        { model: Subject, as: 'subjectRef', attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: type === 'notes' ? limit : Math.ceil(limit / 3),
    });

    for (const note of notes) {
      if (search && !note.title?.toLowerCase().includes(search.toLowerCase())) continue;
      results.push({
        id: note.id,
        type: 'note',
        title: note.title,
        description: note.content?.substring(0, 200) || '',
        author: note.userRef ? { id: note.userRef.id, name: note.userRef.name, avatar: note.userRef.avatar } : null,
        subject: note.subjectRef ? { id: note.subjectRef.id, name: note.subjectRef.name } : null,
        createdAt: note.createdAt,
        isBookmarked: false,
      });
    }
  }

  // Fetch public flashcard decks
  if (!type || type === 'decks') {
    const decks = await FlashcardDeck.findAll({
      where: { isPublic: true, ...(subject ? { subject } : {}) },
      include: [
        { model: User, as: 'userRef', attributes: ['id', 'name', 'avatar'] },
        { model: Subject, as: 'subjectRef', attributes: ['id', 'name'] },
        { model: Flashcard, as: 'flashcards', attributes: ['id'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: type === 'decks' ? limit : Math.ceil(limit / 3),
    });

    for (const deck of decks) {
      if (search && !deck.title?.toLowerCase().includes(search.toLowerCase())) continue;

      // Get rating stats
      const ratingStats = await DeckRating.findOne({
        where: { deckId: deck.id },
        attributes: [
          [fn('AVG', col('stars')), 'avgRating'],
          [fn('COUNT', col('id')), 'ratingCount'],
        ],
        raw: true,
      });

      results.push({
        id: deck.id,
        type: 'deck',
        title: deck.title,
        description: deck.description || '',
        author: deck.userRef ? { id: deck.userRef.id, name: deck.userRef.name, avatar: deck.userRef.avatar } : null,
        subject: deck.subjectRef ? { id: deck.subjectRef.id, name: deck.subjectRef.name } : null,
        cardCount: deck.flashcards?.length || 0,
        avgRating: ratingStats?.avgRating ? Math.round(parseFloat(ratingStats.avgRating) * 10) / 10 : 0,
        ratingCount: parseInt(ratingStats?.ratingCount || 0),
        createdAt: deck.createdAt,
        isBookmarked: false,
      });
    }
  }

  // Sort results
  if (sort === 'popular') {
    results.sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0));
  } else if (sort === 'rating') {
    results.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
  } else {
    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  const total = results.length;
  const paginated = results.slice(offset, offset + limit);

  return {
    resources: paginated,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

/**
 * Get trending resources — most accessed/bookmarked in the last 7 days.
 */
exports.getTrendingResources = async (userId, limit = 10) => {
  const recentDecks = await FlashcardDeck.findAll({
    where: { isPublic: true },
    include: [
      { model: User, as: 'userRef', attributes: ['id', 'name', 'avatar'] },
      { model: Flashcard, as: 'flashcards', attributes: ['id'] },
    ],
    order: [['createdAt', 'DESC']],
    limit,
  });

  const trending = [];
  for (const deck of recentDecks) {
    const ratingStats = await DeckRating.findOne({
      where: { deckId: deck.id },
      attributes: [[fn('AVG', col('stars')), 'avgRating'], [fn('COUNT', col('id')), 'ratingCount']],
      raw: true,
    });

    trending.push({
      id: deck.id,
      type: 'deck',
      title: deck.title,
      author: deck.userRef ? { id: deck.userRef.id, name: deck.userRef.name } : null,
      cardCount: deck.flashcards?.length || 0,
      avgRating: ratingStats?.avgRating ? Math.round(parseFloat(ratingStats.avgRating) * 10) / 10 : 0,
      ratingCount: parseInt(ratingStats?.ratingCount || 0),
    });
  }

  return trending.sort((a, b) => b.ratingCount - a.ratingCount).slice(0, limit);
};

/**
 * Rate a resource (deck or note).
 */
exports.rateResource = async (userId, resourceId, resourceType, stars, comment = null) => {
  if (resourceType === 'deck') {
    const existing = await DeckRating.findOne({ where: { deckId: resourceId, userId } });
    if (existing) {
      existing.stars = stars;
      if (comment) existing.comment = comment;
      await existing.save();
      return existing;
    }
    return DeckRating.create({ deckId: resourceId, userId, stars, comment });
  }
  // Notes don't have a rating model yet — create a simple one or return error
  throw new Error('Rating is only supported for flashcard decks currently');
};

/**
 * Get ratings for a resource.
 */
exports.getResourceRatings = async (resourceId, resourceType) => {
  if (resourceType === 'deck') {
    const ratings = await DeckRating.findAll({
      where: { deckId: resourceId },
      include: [{ model: User, as: 'userRef', attributes: ['id', 'name', 'avatar'] }],
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    const stats = await DeckRating.findOne({
      where: { deckId: resourceId },
      attributes: [
        [fn('AVG', col('stars')), 'avgRating'],
        [fn('COUNT', col('id')), 'totalRatings'],
      ],
      raw: true,
    });

    // Distribution
    const distribution = await DeckRating.findAll({
      where: { deckId: resourceId },
      attributes: ['stars', [fn('COUNT', col('id')), 'count']],
      group: ['stars'],
      raw: true,
    });

    return {
      ratings,
      stats: {
        avgRating: stats?.avgRating ? Math.round(parseFloat(stats.avgRating) * 10) / 10 : 0,
        totalRatings: parseInt(stats?.totalRatings || 0),
        distribution: distribution.reduce((acc, d) => { acc[d.stars] = d.count; return acc; }, {}),
      },
    };
  }
  return { ratings: [], stats: { avgRating: 0, totalRatings: 0, distribution: {} } };
};

/**
 * Get resource detail with full metadata.
 */
exports.getResourceDetail = async (resourceId, resourceType) => {
  if (resourceType === 'deck') {
    const deck = await FlashcardDeck.findOne({
      where: { id: resourceId, isPublic: true },
      include: [
        { model: User, as: 'userRef', attributes: ['id', 'name', 'avatar'] },
        { model: Subject, as: 'subjectRef', attributes: ['id', 'name'] },
        { model: Flashcard, as: 'flashcards' },
      ],
    });
    if (!deck) return null;

    const ratings = await exports.getResourceRatings(resourceId, 'deck');
    const collaboratorCount = await DeckCollaborator.count({ where: { deckId: resourceId } });

    return {
      id: deck.id,
      type: 'deck',
      title: deck.title,
      description: deck.description,
      author: deck.userRef,
      subject: deck.subjectRef,
      cardCount: deck.flashcards?.length || 0,
      cards: deck.flashcards?.map((c) => ({ id: c.id, front: c.front, back: c.back })) || [],
      ratings: ratings.stats,
      recentRatings: ratings.ratings.slice(0, 5),
      collaboratorCount,
      createdAt: deck.createdAt,
    };
  }

  if (resourceType === 'note') {
    const note = await Note.findOne({
      where: { id: resourceId, isPublic: true },
      include: [
        { model: User, as: 'userRef', attributes: ['id', 'name', 'avatar'] },
        { model: Subject, as: 'subjectRef', attributes: ['id', 'name'] },
      ],
    });
    if (!note) return null;
    return {
      id: note.id,
      type: 'note',
      title: note.title,
      content: note.content,
      author: note.userRef,
      subject: note.subjectRef,
      createdAt: note.createdAt,
    };
  }

  return null;
};

/**
 * Get community stats — aggregate numbers for the hub.
 */
exports.getCommunityStats = async () => {
  const [noteCount, deckCount, ratingCount, userCount] = await Promise.all([
    Note.count({ where: { isPublic: true } }),
    FlashcardDeck.count({ where: { isPublic: true } }),
    DeckRating.count(),
    User.count(),
  ]);

  return {
    publicNotes: noteCount,
    publicDecks: deckCount,
    totalRatings: ratingCount,
    totalUsers: userCount,
  };
};
