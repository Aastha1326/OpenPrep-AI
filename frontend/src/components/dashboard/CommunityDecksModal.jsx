import React, { useState, useEffect } from 'react';
import { X, Search, Filter, DownloadCloud, Star, Tag, Info, AlertCircle, RefreshCw } from 'lucide-react';
import API from '../../services/api';
import VintagePaper from './VintagePaper';

const CommunityDecksModal = ({ isOpen, onClose, onCloneSuccess }) => {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [exam, setExam] = useState('');
  const [rating, setRating] = useState('');
  const [cloningId, setCloningId] = useState(null);

  const fetchDecks = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = [];
      if (search) query.push(`search=${encodeURIComponent(search)}`);
      if (subject) query.push(`subject=${encodeURIComponent(subject)}`);
      if (exam) query.push(`exam=${encodeURIComponent(exam)}`);
      if (rating) query.push(`rating=${encodeURIComponent(rating)}`);

      const queryString = query.length > 0 ? `?${query.join('&')}` : '';
      const res = await API.get(`/flashcards/community${queryString}`);
      if (res.data?.success) {
        setDecks(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load community decks:', err);
      setError('Could not load community decks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDecks();
    }
  }, [isOpen, subject, exam, rating]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDecks();
  };

  const handleClone = async (deckId) => {
    setCloningId(deckId);
    try {
      const res = await API.post(`/flashcards/decks/${deckId}/clone`, {});
      if (res.data?.success) {
        alert('Deck successfully cloned to your personal study library!');
        if (onCloneSuccess) onCloneSuccess();
        // Refresh community decks to increment clone count
        fetchDecks();
      }
    } catch (err) {
      console.error('Cloning deck failed:', err);
      const errMsg = err.response?.data?.error || 'Failed to clone deck. Please try again.';
      alert(errMsg);
    } finally {
      setCloningId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative w-full max-w-5xl h-[85vh] bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div>
            <h2 className="text-2xl font-bold font-playfair text-amber-400">
              Community Flashcard Marketplace
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Discover and clone peer-generated flashcard decks reviewed by AI.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex flex-col gap-3">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search decks by keyword, topic, or tags..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-sm transition-colors shadow"
            >
              Search
            </button>
          </form>

          <div className="flex flex-wrap gap-3 items-center text-xs">
            <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
              <Filter className="w-3.5 h-3.5" /> Filters:
            </div>
            
            {/* Subject filter */}
            <input
              type="text"
              placeholder="Subject Name"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-slate-300 w-36 focus:outline-none focus:border-amber-500"
            />

            {/* Exam filter */}
            <input
              type="text"
              placeholder="Exam Name"
              value={exam}
              onChange={(e) => setExam(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-slate-300 w-36 focus:outline-none focus:border-amber-500"
            />

            {/* Rating Filter */}
            <select
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-slate-300 w-32 focus:outline-none focus:border-amber-500"
            >
              <option value="">Any Rating</option>
              <option value="4.5">4.5+ Stars</option>
              <option value="4.0">4.0+ Stars</option>
              <option value="3.0">3.0+ Stars</option>
            </select>

            {(search || subject || exam || rating) && (
              <button
                onClick={() => {
                  setSearch('');
                  setSubject('');
                  setExam('');
                  setRating('');
                }}
                className="text-amber-500 hover:text-amber-400 font-bold ml-auto"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-900/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
              <p>Scanning community marketplace...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-red-400 gap-2">
              <AlertCircle className="w-8 h-8" />
              <p>{error}</p>
              <button
                onClick={fetchDecks}
                className="mt-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs"
              >
                Retry
              </button>
            </div>
          ) : decks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 text-center">
              <Info className="w-10 h-10 mb-2 text-slate-600" />
              <p className="text-lg font-semibold">No community decks found</p>
              <p className="text-sm max-w-sm mt-1">
                Be the first to publish a high-quality AI-generated deck from your library!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {decks.map((deck) => (
                <div
                  key={deck.id}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-5 hover:border-amber-600/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Name & Rating */}
                    <div className="flex justify-between items-start gap-4">
                      <h4 className="text-lg font-bold text-slate-100 font-inter">
                        {deck.name}
                      </h4>
                      <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded text-amber-400 font-bold text-xs shrink-0">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        {deck.rating?.toFixed(1) || '4.5'}
                      </div>
                    </div>

                    {/* Subheader: Creator & Exam */}
                    <p className="text-slate-400 text-xs mt-1">
                      By <span className="text-slate-300 font-semibold">{deck.ownerName}</span> • For <span className="text-slate-300 font-semibold">{deck.examName}</span>
                    </p>

                    {/* AI-Generated Summary Tags */}
                    {deck.tags && deck.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 my-3">
                        {deck.tags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-semibold"
                          >
                            <Tag className="w-2.5 h-2.5 text-amber-500" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Description */}
                    <p className="text-slate-300 text-xs leading-relaxed my-3 italic">
                      &ldquo;{deck.description || 'No description provided.'}&rdquo;
                    </p>
                  </div>

                  {/* Actions & Metrics */}
                  <div className="flex justify-between items-center border-t border-slate-800/80 pt-4 mt-2">
                    <div className="text-[10px] text-slate-400 flex gap-3">
                      <span>
                        Cards: <strong className="text-slate-200">{deck.cardCount}</strong>
                      </span>
                      <span>
                        Clones: <strong className="text-slate-200">{deck.cloneCount}</strong>
                      </span>
                    </div>

                    <button
                      onClick={() => handleClone(deck.id)}
                      disabled={cloningId === deck.id}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <DownloadCloud className="w-3.5 h-3.5" />
                      {cloningId === deck.id ? 'Cloning...' : 'Clone Deck'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityDecksModal;
