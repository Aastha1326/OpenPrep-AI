import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import FlashcardWidget from './FlashcardWidget';

const FlashcardViewer = ({ deckId, deckName, cards = [], onReview }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 1; // Assuming we view one flashcard at a time

  // BUG FIX: Reset pagination when deck changes
  useEffect(() => {
    setCurrentPage(1);
  }, [deckId]);

  if (!cards || cards.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-stone-200 dark:border-slate-700 text-center">
        <Layers className="w-8 h-8 text-stone-300 mx-auto mb-2" />
        <p className="text-stone-500">No cards in this deck.</p>
      </div>
    );
  }

  const totalPages = Math.ceil(cards.length / cardsPerPage);
  const currentCard = cards[currentPage - 1];

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(p => p + 1);
  };

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(p => p - 1);
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-stone-200 dark:border-slate-700 shadow-sm flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-4">
        <h3 className="font-playfair text-xl font-bold flex items-center gap-2">
          <Layers className="w-5 h-5 text-amber-700" />
          {deckName || 'Deck Viewer'}
        </h3>
        <span className="text-sm font-medium text-stone-500 bg-stone-100 dark:bg-slate-700 px-3 py-1 rounded-full">
          {currentPage} / {totalPages}
        </span>
      </div>

      <div className="w-full max-w-lg mb-6">
        <FlashcardWidget 
          flashcard={currentCard} 
          totalDue={cards.length}
          onReview={(quality) => {
            if (onReview) onReview(currentCard.id, quality);
            handleNext();
          }} 
        />
      </div>

      <div className="flex gap-4">
        <button
          onClick={handlePrev}
          disabled={currentPage === 1}
          className="p-2 rounded-full border border-stone-200 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft className="w-5 h-5 text-stone-600 dark:text-stone-300" />
        </button>
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="p-2 rounded-full border border-stone-200 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <ChevronRight className="w-5 h-5 text-stone-600 dark:text-stone-300" />
        </button>
      </div>
    </div>
  );
};

export default FlashcardViewer;
