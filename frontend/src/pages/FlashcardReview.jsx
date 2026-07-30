import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ArrowLeft, RotateCw, CheckCircle2, Volume2, VolumeX } from 'lucide-react';
import API from '../services/api';

const FlashcardReview = () => {
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Session Stats
  const [sessionStats, setSessionStats] = useState({
    reviewed: 0,
    mastered: 0, // quality >= 4
    hard: 0, // quality < 3
  });

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState(1);

  useEffect(() => {
    fetchDueCards();
  }, []);

  // Cancel speech synthesis on unmount or card change
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, [currentIndex, isFlipped]);

  const fetchDueCards = async () => {
    try {
      setLoading(true);
      const res = await API.get('/flashcards?dueOnly=true&limit=100'); // Fetch a batch of due cards
      setCards(res.data.data || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch due flashcards.');
      setLoading(false);
    }
  };

  const currentCard = cards[currentIndex];
  const isSessionComplete = !loading && cards.length > 0 && currentIndex >= cards.length;
  const noCardsDue = !loading && cards.length === 0;

  const handleReview = async (quality) => {
    if (!currentCard) return;

    try {
      // Update session stats
      setSessionStats(prev => ({
        ...prev,
        reviewed: prev.reviewed + 1,
        mastered: prev.mastered + (quality >= 4 ? 1 : 0),
        hard: prev.hard + (quality < 3 ? 1 : 0),
      }));

      // Fire async request to update backend
      await API.put(`/flashcards/${currentCard.id}/review`, { quality });
      
      // Move to next card
      setIsFlipped(false);
      setCurrentIndex(prev => prev + 1);
    } catch (err) {
      console.error("Failed to update flashcard", err);
      // Even if it fails, maybe we still want to move on, but ideally we should show a toast.
      // For simplicity, we just log it and move to next.
      setIsFlipped(false);
      setCurrentIndex(prev => prev + 1);
    }
  };

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
      const textToRead = isFlipped ? currentCard?.back : currentCard?.front;
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
      const textToRead = isFlipped ? currentCard?.back : currentCard?.front;
      speakText(textToRead, nextRate);
    }
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Space or Enter to flip
      if (!isFlipped && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        setIsFlipped(true);
      }
      // If flipped, 0-5 keys for rating
      if (isFlipped) {
        if (['0', '1', '2', '3', '4', '5'].includes(e.key)) {
          e.preventDefault();
          handleReview(parseInt(e.key, 10));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, currentIndex]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mb-4"></div>
        <p className="text-neutral-500 dark:text-neutral-400">Loading your review queue...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700">
          Back to Dashboard
        </button>
      </div>
    );
  }

  // --- Session Summary Screen ---
  if (isSessionComplete || noCardsDue) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 flex flex-col items-center">
        <button 
          onClick={() => navigate('/dashboard')} 
          className="absolute top-6 left-6 flex items-center text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          Dashboard
        </button>

        <div className="w-full max-w-lg mt-12 bg-white dark:bg-slate-800 rounded-xl shadow-xl p-8 flex flex-col items-center border border-neutral-200 dark:border-slate-700">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-3xl font-bold font-inter text-neutral-800 dark:text-neutral-100 mb-2 text-center">
            {noCardsDue ? "You're All Caught Up!" : "Session Complete"}
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-center mb-8">
            {noCardsDue 
              ? "There are no flashcards due for review right now. Great job staying on top of your studies!" 
              : "Excellent work! You've completed your spaced repetition review queue for now."}
          </p>

          {!noCardsDue && (
            <div className="w-full grid grid-cols-3 gap-4 mb-8">
              <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{sessionStats.reviewed}</div>
                <div className="text-xs text-neutral-500 uppercase tracking-wider mt-1">Reviewed</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center border border-green-100 dark:border-green-800/30">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{sessionStats.mastered}</div>
                <div className="text-xs text-green-600/70 dark:text-green-400/70 uppercase tracking-wider mt-1">Mastered</div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg text-center border border-orange-100 dark:border-orange-800/30">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{sessionStats.hard}</div>
                <div className="text-xs text-orange-600/70 dark:text-orange-400/70 uppercase tracking-wider mt-1">Hard</div>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-neutral-200 dark:bg-slate-700 text-neutral-800 dark:text-neutral-200 font-semibold rounded-lg hover:bg-neutral-300 dark:hover:bg-slate-600 transition-colors"
            >
              Go to Dashboard
            </button>
            {noCardsDue && (
              <button 
                onClick={() => navigate('/pyqs')} // Or subject selection to generate more
                className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors flex items-center"
              >
                <Brain className="w-5 h-5 mr-2" />
                Generate More
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- Active Review Queue Screen ---
  const progressPercent = Math.round((currentIndex / cards.length) * 100);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-6 px-4 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-3xl flex justify-between items-center mb-8">
        <button 
          onClick={() => navigate('/dashboard')} 
          className="flex items-center text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          Exit Session
        </button>
        <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300 font-medium">
          <Brain className="w-5 h-5 text-primary-500" />
          <span>SM-2 Review Queue</span>
        </div>
        <div className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
          {currentIndex + 1} <span className="text-neutral-300 dark:text-neutral-600">/</span> {cards.length}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-3xl h-1.5 bg-neutral-200 dark:bg-slate-800 rounded-full mb-12 overflow-hidden">
        <motion.div 
          className="h-full bg-primary-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Flashcard Area */}
      <div className="w-full max-w-3xl flex-1 flex flex-col items-center justify-start perspective-1000 mb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCard.id}
            className="w-full max-w-2xl h-80 relative preserve-3d cursor-pointer group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, rotateY: isFlipped ? 180 : 0 }}
            exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
            transition={{ duration: 0.6, type: 'spring', stiffness: 200, damping: 20 }}
            style={{ transformStyle: 'preserve-3d' }}
            onClick={() => !isFlipped && setIsFlipped(true)}
          >
            {/* Front */}
            <div
              className={`absolute inset-0 bg-white dark:bg-slate-800 shadow-xl border border-neutral-200 dark:border-slate-700 rounded-2xl p-8 flex flex-col justify-center items-center backface-hidden ${isFlipped ? 'pointer-events-none' : ''}`}
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="absolute top-4 left-6 flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Question
              </div>
              
              <div className="absolute top-4 right-4 flex items-center gap-1 z-10">
                <button
                  type="button"
                  onClick={handleRateToggle}
                  className="px-2 py-1 text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-slate-700 hover:bg-neutral-200 dark:hover:bg-slate-600 rounded transition-colors"
                >
                  {speechRate}x
                </button>
                <button
                  type="button"
                  onClick={handleSpeak}
                  className={`p-2 rounded-full transition-colors ${
                    isSpeaking && !isFlipped
                      ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/30 animate-pulse'
                      : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {isSpeaking && !isFlipped ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>

              <h3 className="text-2xl md:text-3xl font-bold font-inter text-neutral-800 dark:text-neutral-100 text-center leading-snug">
                {currentCard.front}
              </h3>
              
              <div className="absolute bottom-6 flex items-center text-sm font-medium text-neutral-400 opacity-70 group-hover:opacity-100 transition-opacity">
                <RotateCw className="w-4 h-4 mr-2" />
                Click or press Space to reveal answer
              </div>
            </div>

            {/* Back */}
            <div
              className={`absolute inset-0 bg-primary-50 dark:bg-primary-900/10 shadow-xl border border-primary-200 dark:border-primary-800/50 rounded-2xl p-8 flex flex-col items-center overflow-y-auto backface-hidden ${!isFlipped ? 'pointer-events-none' : ''}`}
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <div className="w-full flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest">
                  <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                  Answer
                </div>
                <div className="flex items-center gap-1 z-10">
                  <button
                    type="button"
                    onClick={handleRateToggle}
                    className="px-2 py-1 text-[11px] font-semibold text-primary-700 dark:text-primary-300 bg-primary-100/50 dark:bg-primary-800/30 hover:bg-primary-200/50 dark:hover:bg-primary-700/50 rounded transition-colors"
                  >
                    {speechRate}x
                  </button>
                  <button
                    type="button"
                    onClick={handleSpeak}
                    className={`p-2 rounded-full transition-colors ${
                      isSpeaking && isFlipped
                        ? 'text-primary-700 bg-primary-200/50 dark:bg-primary-800/50 dark:text-primary-200 animate-pulse'
                        : 'text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200 hover:bg-primary-100/50 dark:hover:bg-primary-800/30'
                    }`}
                  >
                    {isSpeaking && isFlipped ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex-1 w-full flex items-center justify-center">
                <p className="text-xl md:text-2xl text-neutral-800 dark:text-neutral-200 font-inter leading-relaxed text-center">
                  {currentCard.back}
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Grading Controls (Only visible when flipped) */}
        <div className={`mt-12 w-full max-w-2xl transition-all duration-500 ${isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
          <div className="text-center text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-4">
            How well did you know this?
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {[
              { val: 0, label: 'Blackout', color: 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800/50' },
              { val: 1, label: 'Wrong',    color: 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800/50' },
              { val: 2, label: 'Hard',     color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/50' },
              { val: 3, label: 'Medium',   color: 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800/50' },
              { val: 4, label: 'Good',     color: 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800/50' },
              { val: 5, label: 'Easy',     color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50' },
            ].map(btn => (
              <button
                key={btn.val}
                onClick={() => handleReview(btn.val)}
                className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95 ${btn.color}`}
              >
                <span className="font-bold text-lg mb-1">{btn.val}</span>
                <span className="text-[10px] uppercase tracking-wider font-semibold opacity-80">{btn.label}</span>
              </button>
            ))}
          </div>
          <div className="text-center mt-4 text-xs text-neutral-400">
            Pro tip: You can also use numbers 0-5 on your keyboard.
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashcardReview;
