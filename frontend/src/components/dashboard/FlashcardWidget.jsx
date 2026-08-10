import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, AlertCircle, RefreshCw, BookOpen, Volume2, VolumeX } from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import ExportDeckDropdown from '../flashcards/ExportDeckDropdown';

const Shimmer = ({ className = '' }) => (
  <div className={`animate-pulse bg-neutral-300/60 rounded ${className}`} />
);

const FlashcardWidget = ({ flashcard = null, loading = false, error = null, totalDue = 0, onRetry, onReview }) => {
  const navigate = useNavigate();
  const [isFlipped, setIsFlipped] = useState(false);
  const [prevFlashcard, setPrevFlashcard] = useState(flashcard);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState(1);

  if (flashcard !== prevFlashcard) {
    setPrevFlashcard(flashcard);
    setIsFlipped(false);
  }

  // Cancel speech synthesis whenever card flips or active flashcard changes
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, [flashcard, isFlipped]);

  const speakText = (text, rate) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleSpeak = (e) => {
    e.stopPropagation();
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const textToRead = isFlipped ? flashcard?.back : flashcard?.front;
      speakText(textToRead, speechRate);
    }
  };

  const handleRateToggle = (e) => {
    e.stopPropagation();
    const rates = [0.75, 1, 1.25];
    const nextIndex = (rates.indexOf(speechRate) + 1) % rates.length;
    const nextRate = rates[nextIndex];
    setSpeechRate(nextRate);

    if (isSpeaking) {
      const textToRead = isFlipped ? flashcard?.back : flashcard?.front;
      speakText(textToRead, nextRate);
    }
  };

  if (loading) {
    return (
      <div className="relative w-full h-48 cursor-pointer perspective-1000">
        <div className="w-full h-full bg-white dark:bg-slate-800 shadow-md border border-neutral-300 dark:border-slate-700 rounded-sm p-6 flex flex-col justify-center items-center">
          <div className="absolute top-2 left-2 flex items-center gap-1">
            <Shimmer className="w-3 h-3" />
            <Shimmer className="h-3 w-16" />
          </div>
          <Shimmer className="h-5 w-3/4 mb-2" />
          <Shimmer className="h-5 w-1/2" />
          <Shimmer className="h-3 w-20 absolute bottom-2" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative w-full h-48 cursor-pointer perspective-1000">
        <div className="w-full h-full bg-white dark:bg-slate-800 shadow-md border border-neutral-300 dark:border-slate-700 rounded-sm p-6 flex flex-col justify-center items-center">
          <AlertCircle className="w-8 h-8 text-neutral-400 mb-2" />
          <p className="text-sm text-neutral-500 text-center mb-3">Could not load cards</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1 text-yellow-700 hover:text-yellow-800 font-semibold text-xs uppercase tracking-wider"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!flashcard) {
    return (
      <div className="relative w-full h-48 cursor-pointer perspective-1000">
        <div className="w-full h-full bg-white dark:bg-slate-800 shadow-md border border-neutral-300 dark:border-slate-700 rounded-sm p-6 flex flex-col justify-center items-center">
          <BookOpen className="w-10 h-10 text-neutral-300 mb-2" />
          <p className="text-sm text-neutral-500 italic text-center">
            {totalDue === 0 ? 'All caught up! No cards due.' : 'No due flashcards'}
          </p>
        </div>
      </div>
    );
  }

  const handleRatingClick = (e, quality) => {
    e.stopPropagation();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    if (onReview) {
      onReview(quality);
    }
  };

  const lastFlipTimeRef = useState(() => ({ current: 0 }))[0];

  const handleCardFlip = (e) => {
    const now = Date.now();
    if (now - lastFlipTimeRef.current < 250) {
      if (e && e.preventDefault) e.preventDefault();
      return;
    }
    lastFlipTimeRef.current = now;
    setIsFlipped((prev) => !prev);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardFlip(e);
    }
  };

  return (
    <div
      className="relative w-full h-56 cursor-pointer perspective-1000 select-none touch-action-manipulation"
      role="button"
      tabIndex={0}
      aria-label={isFlipped ? 'Flip to front' : 'Flip to back'}
      onClick={handleCardFlip}
      onKeyDown={handleKeyDown}
      style={{
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <motion.div
        className="w-full h-full relative preserve-3d"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 200, damping: 20 }}
        style={{
          transformStyle: 'preserve-3d',
          WebkitTransformStyle: 'preserve-3d',
          willChange: 'transform',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {/* Front of Card */}
        <div
          className="absolute inset-0 bg-white dark:bg-slate-800 shadow-md border border-neutral-300 dark:border-slate-700 rounded-sm p-6 flex flex-col justify-center items-center backface-hidden"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            WebkitTapHighlightColor: 'transparent',
            transformStyle: 'preserve-3d',
            WebkitTransformStyle: 'preserve-3d',
            isolation: 'isolate',
          }}
        >
          <div className="absolute top-2 left-2 flex items-center text-xs font-bold text-yellow-600 uppercase tracking-widest">
            <Lightbulb className="w-3 h-3 mr-1" />
            Due Cards
            {totalDue > 1 && (
              <span className="ml-1 text-neutral-400 normal-case font-normal tracking-normal">
                ({totalDue} due)
              </span>
            )}
          </div>
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); navigate('/flashcards/review'); }}
            className="absolute bottom-4 left-4 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/50 hover:bg-yellow-200 dark:hover:bg-yellow-800 text-yellow-800 dark:text-yellow-200 text-xs font-bold rounded shadow z-10"
          >
            Full Review &rarr;
          </button>
          
          <div className="absolute bottom-4 right-4 z-10" onClick={(e) => e.stopPropagation()}>
            <ExportDeckDropdown />
          </div>

          {/* Audio Reader Controls */}
          <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
            <button
              type="button"
              onClick={handleRateToggle}
              className="px-1.5 py-0.5 text-[10px] font-semibold text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-slate-700 hover:bg-neutral-200 dark:hover:bg-slate-600 rounded transition-colors"
              title="Toggle speech rate"
              aria-label={`Speech rate: ${speechRate}x`}
            >
              {speechRate}x
            </button>
            <button
              type="button"
              onClick={handleSpeak}
              className={`p-1.5 rounded-full transition-colors ${
                isSpeaking
                  ? 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/50 animate-pulse'
                  : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-slate-700'
              }`}
              title={isSpeaking ? 'Stop reading' : 'Read question aloud'}
              aria-label={isSpeaking ? 'Stop reading' : 'Read question aloud'}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          <h3 className="text-xl font-bold font-inter text-neutral-800 dark:text-neutral-100 text-center leading-snug">
            {flashcard.front}
          </h3>
          <p className="absolute bottom-2 text-xs text-neutral-400 italic">Click to flip</p>
        </div>

        {/* Back of Card */}
        <div
          className="absolute inset-0 bg-yellow-50 dark:bg-yellow-900/30 shadow-md border border-yellow-200 dark:border-yellow-700/50 rounded-sm p-5 flex flex-col justify-between items-center text-center overflow-y-auto backface-hidden"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            WebkitTapHighlightColor: 'transparent',
            transformStyle: 'preserve-3d',
            WebkitTransformStyle: 'preserve-3d',
            transform: 'rotateY(180deg)',
            WebkitTransform: 'rotateY(180deg)',
            isolation: 'isolate',
          }}
        >
          <div className="w-full flex justify-between items-center text-xs text-yellow-700 dark:text-yellow-400">
            <span className="font-semibold uppercase tracking-wider">Answer</span>

            <div className="flex items-center gap-1.5 z-10">
              <button
                type="button"
                onClick={handleRateToggle}
                className="px-1.5 py-0.5 text-[10px] font-semibold text-yellow-800 dark:text-yellow-200 bg-yellow-200/60 dark:bg-yellow-800/60 hover:bg-yellow-300/60 dark:hover:bg-yellow-700/60 rounded transition-colors"
                title="Toggle speech rate"
                aria-label={`Speech rate: ${speechRate}x`}
              >
                {speechRate}x
              </button>
              <button
                type="button"
                onClick={handleSpeak}
                className={`p-1.5 rounded-full transition-colors ${
                  isSpeaking
                    ? 'text-yellow-800 bg-yellow-200 dark:bg-yellow-800 dark:text-yellow-100 animate-pulse'
                    : 'text-yellow-700 hover:text-yellow-900 dark:text-yellow-300 dark:hover:text-yellow-100 hover:bg-yellow-200/50 dark:hover:bg-yellow-800/40'
                }`}
                title={isSpeaking ? 'Stop reading' : 'Read answer aloud'}
                aria-label={isSpeaking ? 'Stop reading' : 'Read answer aloud'}
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <span className="text-neutral-400 italic ml-1">Click to flip back</span>
            </div>
          </div>
          <p className="text-sm text-neutral-800 dark:text-neutral-200 font-inter leading-relaxed my-2">
            {flashcard.back}
          </p>
          <div className="w-full grid grid-cols-4 gap-1 mt-1">
            <button
              onClick={(e) => handleRatingClick(e, 0)}
              className="py-1 px-2 text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-950/60 dark:text-red-300 rounded transition-colors"
              title="Again (Reset interval)"
            >
              Again
            </button>
            <button
              onClick={(e) => handleRatingClick(e, 3)}
              className="py-1 px-2 text-xs font-semibold text-orange-700 bg-orange-100 hover:bg-orange-200 dark:bg-orange-950/60 dark:text-orange-300 rounded transition-colors"
              title="Hard"
            >
              Hard
            </button>
            <button
              onClick={(e) => handleRatingClick(e, 4)}
              className="py-1 px-2 text-xs font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-950/60 dark:text-blue-300 rounded transition-colors"
              title="Good"
            >
              Good
            </button>
            <button
              onClick={(e) => handleRatingClick(e, 5)}
              className="py-1 px-2 text-xs font-semibold text-green-700 bg-green-100 hover:bg-green-200 dark:bg-green-950/60 dark:text-green-300 rounded transition-colors"
              title="Easy"
            >
              Easy
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FlashcardWidget;

