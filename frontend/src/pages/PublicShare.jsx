import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Sparkles, ArrowLeft, ArrowRight, RotateCw, Copy, Check, LogIn, DownloadCloud, AlertTriangle } from 'lucide-react';
import API from '../services/api';

const PublicShare = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Carousel and card flip states
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchSharedDeck = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await API.get(`/share/${token}`);
        if (res.data?.success) {
          setDeck(res.data.data.deck);
          setCards(res.data.data.cards || []);
        }
      } catch (err) {
        console.error('Error fetching public deck:', err);
        setError(err.response?.data?.error || 'Failed to load public deck. It may have been deleted by the owner.');
      } finally {
        setLoading(false);
      }
    };

    fetchSharedDeck();
  }, [token]);

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % cards.length);
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }, 150);
  };

  const handleClone = async () => {
    if (!isAuthenticated) {
      // Save current path to redirect after login
      localStorage.setItem('redirectPath', `/share/${token}`);
      navigate('/login');
      return;
    }

    setCloning(true);
    try {
      const res = await API.post(`/share/${token}/clone`);
      if (res.data?.success) {
        alert('Deck successfully cloned to your personal library!');
        navigate('/flashcards');
      }
    } catch (err) {
      console.error('Cloning deck failed:', err);
      alert(err.response?.data?.error || 'Failed to clone deck. Please try again.');
    } finally {
      setCloning(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFBE9] dark:bg-[#000000] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#1F150C] dark:text-[#E1DCC9] font-medium">Fetching public study deck...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FFFBE9] dark:bg-[#000000] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 text-center shadow-xl">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-950/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#1F150C] dark:text-[#E1DCC9] mb-3">Deck Unavailable</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-black font-semibold rounded-xl transition"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <div className="min-h-screen bg-[#FFFBE9] dark:bg-[#080808] text-[#1F150C] dark:text-[#E1DCC9] font-inter py-12 px-4 transition-colors">
      <div className="max-w-3xl mx-auto">
        
        {/* Deck Header */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 md:p-8 shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 rounded-full text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Shared Flashcard Deck
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-playfair">{deck.name}</h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
              Created by <span className="font-semibold text-neutral-700 dark:text-neutral-300">{deck.ownerName}</span> • Cloned {deck.cloneCount || 0} times
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-4 py-2.5 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl font-semibold text-sm transition cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>

            <button
              onClick={handleClone}
              disabled={cloning}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md transition cursor-pointer"
            >
              {isAuthenticated ? <DownloadCloud className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              {cloning ? 'Cloning...' : isAuthenticated ? 'Clone to Library' : 'Login to Clone'}
            </button>
          </div>
        </div>

        {cards.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl">
            <p className="text-neutral-500 dark:text-neutral-400">This deck does not contain any cards yet.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            
            {/* Card Counter */}
            <div className="mb-4 text-sm font-semibold text-neutral-500 dark:text-neutral-400">
              Card {currentIndex + 1} of {cards.length}
            </div>

            {/* Flippable Preview Card */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="w-full h-80 cursor-pointer perspective mb-8 relative select-none"
            >
              <div
                className={`w-full h-full duration-500 transform-style preserve-3d relative ${
                  isFlipped ? 'rotate-y-180' : ''
                }`}
              >
                {/* Front Side */}
                <div className="absolute inset-0 w-full h-full backface-hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 flex flex-col justify-between shadow-sm">
                  <div className="text-xs font-bold text-neutral-400 dark:text-neutral-500 tracking-wider uppercase">Question</div>
                  <div className="flex-1 flex items-center justify-center text-center">
                    <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100 max-h-48 overflow-y-auto px-4">
                      {currentCard.front}
                    </p>
                  </div>
                  <div className="text-center text-xs text-neutral-400 font-semibold flex items-center justify-center gap-1.5">
                    <RotateCw className="w-3.5 h-3.5" /> Click card to flip
                  </div>
                </div>

                {/* Back Side */}
                <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 flex flex-col justify-between shadow-sm">
                  <div className="text-xs font-bold text-neutral-400 dark:text-neutral-500 tracking-wider uppercase">Answer</div>
                  <div className="flex-1 flex items-center justify-center text-center">
                    <p className="text-lg font-medium text-neutral-800 dark:text-neutral-200 max-h-48 overflow-y-auto px-4">
                      {currentCard.back}
                    </p>
                  </div>
                  {currentCard.hint && (
                    <div className="text-xs text-amber-700 dark:text-amber-400/80 bg-amber-50 dark:bg-amber-950/20 py-1.5 px-3 rounded-lg text-center font-medium max-w-xs mx-auto truncate">
                      Hint: {currentCard.hint}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Carousel Controls */}
            <div className="flex items-center gap-6">
              <button
                onClick={handlePrev}
                className="w-12 h-12 flex items-center justify-center border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-850 rounded-full transition shadow-sm cursor-pointer"
                aria-label="Previous card"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <button
                onClick={handleNext}
                className="w-12 h-12 flex items-center justify-center border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-850 rounded-full transition shadow-sm cursor-pointer"
                aria-label="Next card"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
            
          </div>
        )}

      </div>
    </div>
  );
};

export default PublicShare;
