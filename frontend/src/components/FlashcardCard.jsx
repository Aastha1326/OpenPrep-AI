import React, { useState } from 'react';
import { Lightbulb, RotateCw } from 'lucide-react';

const FlashcardCard = ({ flashcard, style }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleFlip();
    }
  };

  return (
    <div style={style} className="p-2">
      <div
        role="button"
        tabIndex={0}
        onClick={handleFlip}
        onKeyDown={handleKeyDown}
        aria-label={isFlipped ? 'Show front of card' : 'Show back of card'}
        className="w-full h-full relative cursor-pointer select-none perspective-1000"
        style={{
          touchAction: 'manipulation',
        }}
      >
        <div
          className="w-full h-full transition-transform duration-500 ease-out"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            willChange: 'transform',
          }}
        >
          {/* Front Side */}
          <div
            className="absolute inset-0 bg-white dark:bg-slate-800 shadow-md border border-neutral-300 dark:border-slate-700 rounded-xl p-4 flex flex-col justify-between items-center backface-hidden"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            <div className="w-full flex justify-between items-center text-[10px] font-bold text-yellow-600 uppercase tracking-widest">
              <span className="flex items-center gap-1">
                <Lightbulb className="w-3.5 h-3.5 text-yellow-500" /> Question
              </span>
            </div>
            <div className="text-center font-bold text-sm text-neutral-800 dark:text-neutral-100 overflow-y-auto max-h-[70%]">
              {flashcard?.front || 'Empty Front'}
            </div>
            <div className="text-[10px] text-neutral-400 flex items-center gap-1">
              <RotateCw className="w-3 h-3" /> Flip Card
            </div>
          </div>

          {/* Back Side */}
          <div
            className="absolute inset-0 bg-amber-50 dark:bg-slate-900 shadow-md border border-yellow-200 dark:border-slate-700 rounded-xl p-4 flex flex-col justify-between items-center backface-hidden"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="w-full text-left text-[10px] font-bold text-yellow-700 dark:text-yellow-400 uppercase tracking-widest">
              Answer
            </div>
            <div className="text-center text-xs text-neutral-800 dark:text-neutral-200 overflow-y-auto max-h-[70%] bg-transparent">
              {flashcard?.back || 'Empty Back'}
            </div>
            <div className="text-[10px] text-neutral-400 flex items-center gap-1">
              <RotateCw className="w-3 h-3" /> Flip Card
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashcardCard;
