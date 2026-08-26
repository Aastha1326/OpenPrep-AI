/**
 * Adaptive Spaced Repetition (SM-2) Flashcard Study Dashboard Component
 */

import React, { useState } from 'react';
import {
  AdaptiveSpacedRepetitionEngine,
  QUALITY_RATINGS,
  FlashcardState,
} from '../utils/AdaptiveSpacedRepetitionEngine';

export default function SpacedRepetitionFlashcardDashboard() {
  const engine = new AdaptiveSpacedRepetitionEngine();

  const [deck, setDeck] = useState<FlashcardState[]>([
    {
      cardId: 'C1',
      deckId: 'USMLE-MICRO',
      prompt: 'What Gram-negative diplococcus causes purulent urethritis and is treated with Ceftriaxone + Azithromycin?',
      answer: 'Neisseria gonorrhoeae.',
      repetitionNumber: 3,
      intervalDays: 16,
      easeFactor: 2.6,
      nextReviewDueDate: new Date().toISOString(),
      totalReviewsCount: 3,
      lapseCount: 0,
    },
    {
      cardId: 'C2',
      deckId: 'USMLE-MICRO',
      prompt: 'Which encapsulated fungus displays narrow-based budding on India Ink stain and causes meningitis in HIV patients?',
      answer: 'Cryptococcus neoformans.',
      repetitionNumber: 1,
      intervalDays: 1,
      easeFactor: 2.4,
      nextReviewDueDate: new Date().toISOString(),
      totalReviewsCount: 1,
      lapseCount: 1,
    },
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const metrics = engine.calculateDeckMasteryMetrics(deck);
  const currentCard = deck[currentIndex];

  const handleRating = (rating: number) => {
    if (!currentCard) return;
    const updated = engine.processFlashcardReview(currentCard, rating);

    const newDeck = [...deck];
    newDeck[currentIndex] = updated;
    setDeck(newDeck);
    setShowAnswer(false);
    setCurrentIndex((currentIndex + 1) % deck.length);
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, sans-serif', backgroundColor: '#F8FAFC' }}>
      <header style={{ marginBottom: '24px', borderBottom: '2px solid #E2E8F0', paddingBottom: '16px' }}>
        <h1 style={{ color: '#4F46E5', margin: 0 }}>🎴 Adaptive Spaced Repetition (SM-2) Flashcard Hub</h1>
        <p style={{ color: '#64748B', marginTop: '6px' }}>
          Memory retention decay modeling, optimal review scheduling, and SuperMemo SM-2 ease factor optimization.
        </p>
      </header>

      {/* Deck Telemetry Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#FFF', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #4F46E5' }}>
          <span style={{ color: '#64748B', fontSize: '0.85rem' }}>Estimated Retention</span>
          <h2 style={{ color: '#4F46E5', margin: '4px 0 0 0' }}>{metrics.estimatedRetentionRatePercent}%</h2>
          <small style={{ color: '#64748B' }}>Mastery Rate</small>
        </div>

        <div style={{ background: '#FFF', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #10B981' }}>
          <span style={{ color: '#64748B', fontSize: '0.85rem' }}>Mastered Cards</span>
          <h2 style={{ color: '#10B981', margin: '4px 0 0 0' }}>{metrics.masteredCardsCount} / {metrics.totalCards} Cards</h2>
          <small style={{ color: '#64748B' }}>Interval ≥ 21 Days</small>
        </div>

        <div style={{ background: '#FFF', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #F59E0B' }}>
          <span style={{ color: '#64748B', fontSize: '0.85rem' }}>Average Ease Factor</span>
          <h2 style={{ color: '#F59E0B', margin: '4px 0 0 0' }}>{metrics.averageEaseFactor}</h2>
          <small style={{ color: '#64748B' }}>Baseline 2.5</small>
        </div>

        <div style={{ background: '#FFF', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #6366F1' }}>
          <span style={{ color: '#64748B', fontSize: '0.85rem' }}>Learning Queue</span>
          <h2 style={{ color: '#6366F1', margin: '4px 0 0 0' }}>{metrics.learningCardsCount} Cards</h2>
          <small style={{ color: '#64748B' }}>In Active Review</small>
        </div>
      </div>

      {/* Interactive Flashcard Container */}
      {currentCard && (
        <div style={{ background: '#FFF', padding: '32px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', textAlign: 'center', maxWidth: '650px', margin: '0 auto' }}>
          <span style={{ background: '#EEF2FF', color: '#4F46E5', padding: '4px 12px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 600 }}>
            Card {currentIndex + 1} of {deck.length} | Interval: {currentCard.intervalDays}d | EF: {currentCard.easeFactor}
          </span>

          <h3 style={{ margin: '24px 0 16px 0', color: '#1E293B', fontSize: '1.25rem' }}>{currentCard.prompt}</h3>

          {showAnswer ? (
            <div style={{ marginTop: '20px', padding: '16px', background: '#F1F5F9', borderRadius: '8px', color: '#0F172A', fontWeight: 600 }}>
              {currentCard.answer}
            </div>
          ) : (
            <button
              onClick={() => setShowAnswer(true)}
              style={{ marginTop: '20px', padding: '10px 24px', background: '#4F46E5', color: '#FFF', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
            >
              Show Answer
            </button>
          )}

          {showAnswer && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
              <button onClick={() => handleRating(QUALITY_RATINGS.BLACKOUT)} style={{ padding: '8px 14px', background: '#EF4444', color: '#FFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Again (0)
              </button>
              <button onClick={() => handleRating(QUALITY_RATINGS.HARD)} style={{ padding: '8px 14px', background: '#F59E0B', color: '#FFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Hard (2)
              </button>
              <button onClick={() => handleRating(QUALITY_RATINGS.GOOD)} style={{ padding: '8px 14px', background: '#3B82F6', color: '#FFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Good (3)
              </button>
              <button onClick={() => handleRating(QUALITY_RATINGS.PERFECT)} style={{ padding: '8px 14px', background: '#10B981', color: '#FFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Easy (5)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
