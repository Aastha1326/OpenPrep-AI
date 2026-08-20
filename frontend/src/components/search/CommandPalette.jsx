import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, Layers, HelpCircle, CheckSquare, X, CornerDownLeft } from 'lucide-react';
import API from '../../services/api';

const CommandPalette = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ topics: [], decks: [], quizzes: [], tasks: [] });
  const [loading, setLoading] = useState(false);
  
  // Keyboard navigation active index
  const [activeIndex, setActiveIndex] = useState(0);

  const inputRef = useRef(null);
  const previousFocusRef = useRef(null);
  const containerRef = useRef(null);
  const debounceTimer = useRef(null);

  // Store previously focused element and handle focus trap
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      setActiveIndex(0);
      setQuery('');
      setResults({ topics: [], decks: [], quizzes: [], tasks: [] });

      // Focus the search input with a slight delay to ensure rendering completes
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);

      // Add escape key handler and focus trap
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('keydown', handleKeyDown);
        // Restore focus to previously active element
        if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
          previousFocusRef.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  // Debounce API calls
  useEffect(() => {
    if (!isOpen) return;

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!query.trim()) {
      setResults({ topics: [], decks: [], quizzes: [], tasks: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await API.get(`/search?q=${encodeURIComponent(query)}`);
        if (res.data?.success) {
          setResults(res.data.data);
          setActiveIndex(0);
        }
      } catch (err) {
        console.error('Command palette search failed:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, isOpen]);

  if (!isOpen) return null;

  // Flatten results for keyboard navigation
  const flatResults = [];
  results.topics.forEach(t => flatResults.push({ ...t, type: 'topic', url: `/flashcards?topicId=${t.id}` }));
  results.decks.forEach(d => flatResults.push({ ...d, type: 'deck', url: `/flashcards?deckId=${d.id}` }));
  results.quizzes.forEach(q => flatResults.push({ ...q, type: 'quiz', url: `/quiz/${q.id}` }));
  results.tasks.forEach(t => flatResults.push({ ...t, type: 'task', url: `/study-planner` }));

  const handleSelect = (item) => {
    navigate(item.url);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (flatResults.length > 0 ? (prev + 1) % flatResults.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (flatResults.length > 0 ? (prev - 1 + flatResults.length) % flatResults.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatResults[activeIndex]) {
        handleSelect(flatResults[activeIndex]);
      }
    }
  };

  const hasResults = flatResults.length > 0;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-[#000000]/60 backdrop-blur-sm z-[9999] flex items-start justify-center p-4 pt-[15vh] transition-opacity"
      onClick={(e) => {
        if (e.target === containerRef.current) onClose();
      }}
    >
      <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[60vh]">
        {/* Search Bar Input */}
        <div className="flex items-center border-b border-neutral-100 dark:border-neutral-850 px-4 py-3.5 gap-3.5">
          <Search className="w-5 h-5 text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={hasResults}
            aria-autocomplete="list"
            aria-haspopup="listbox"
            placeholder="Search topics, decks, quizzes, and tasks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-0 outline-none text-neutral-900 dark:text-neutral-150 focus:ring-0 focus:outline-none text-base placeholder-neutral-400 dark:placeholder-neutral-500"
          />
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-full transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {loading && (
            <div className="py-8 text-center text-xs font-semibold text-neutral-400 dark:text-neutral-500 animate-pulse">
              Scanning directories...
            </div>
          )}

          {!loading && !query && (
            <div className="py-12 text-center text-sm text-neutral-400 dark:text-neutral-500">
              Type a keyword to begin your global search.
            </div>
          )}

          {!loading && query && !hasResults && (
            <div className="py-12 text-center text-sm text-neutral-400 dark:text-neutral-500">
              No results found matching "{query}"
            </div>
          )}

          {!loading && hasResults && (
            <div role="listbox" className="space-y-4">
              {/* Topics Group */}
              {results.topics.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider px-3 mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-500" /> Topics
                  </div>
                  <div className="space-y-1">
                    {results.topics.map((t, idx) => {
                      const absoluteIdx = flatResults.findIndex(r => r.id === t.id && r.type === 'topic');
                      const isActive = absoluteIdx === activeIndex;
                      return (
                        <div
                          key={t.id}
                          role="option"
                          aria-selected={isActive}
                          onClick={() => handleSelect(flatResults[absoluteIdx])}
                          onMouseEnter={() => setActiveIndex(absoluteIdx)}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition ${
                            isActive
                              ? 'bg-amber-600/10 dark:bg-amber-600/20 text-[#1F150C] dark:text-[#E1DCC9]'
                              : 'text-neutral-700 dark:text-neutral-400'
                          }`}
                        >
                          <span className="text-sm font-semibold">{t.name}</span>
                          {isActive && <CornerDownLeft className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Decks Group */}
              {results.decks.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider px-3 mb-2 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-500" /> Flashcard Decks
                  </div>
                  <div className="space-y-1">
                    {results.decks.map((d, idx) => {
                      const absoluteIdx = flatResults.findIndex(r => r.id === d.id && r.type === 'deck');
                      const isActive = absoluteIdx === activeIndex;
                      return (
                        <div
                          key={d.id}
                          role="option"
                          aria-selected={isActive}
                          onClick={() => handleSelect(flatResults[absoluteIdx])}
                          onMouseEnter={() => setActiveIndex(absoluteIdx)}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition ${
                            isActive
                              ? 'bg-amber-600/10 dark:bg-amber-600/20 text-[#1F150C] dark:text-[#E1DCC9]'
                              : 'text-neutral-700 dark:text-neutral-400'
                          }`}
                        >
                          <span className="text-sm font-semibold">{d.name}</span>
                          {isActive && <CornerDownLeft className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quizzes Group */}
              {results.quizzes.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider px-3 mb-2 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-green-500" /> Quizzes
                  </div>
                  <div className="space-y-1">
                    {results.quizzes.map((q, idx) => {
                      const absoluteIdx = flatResults.findIndex(r => r.id === q.id && r.type === 'quiz');
                      const isActive = absoluteIdx === activeIndex;
                      return (
                        <div
                          key={q.id}
                          role="option"
                          aria-selected={isActive}
                          onClick={() => handleSelect(flatResults[absoluteIdx])}
                          onMouseEnter={() => setActiveIndex(absoluteIdx)}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition ${
                            isActive
                              ? 'bg-amber-600/10 dark:bg-amber-600/20 text-[#1F150C] dark:text-[#E1DCC9]'
                              : 'text-neutral-700 dark:text-neutral-400'
                          }`}
                        >
                          <span className="text-sm font-semibold">{q.title}</span>
                          {isActive && <CornerDownLeft className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tasks Group */}
              {results.tasks.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider px-3 mb-2 flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-rose-500" /> Study Plan Tasks
                  </div>
                  <div className="space-y-1">
                    {results.tasks.map((t, idx) => {
                      const absoluteIdx = flatResults.findIndex(r => r.id === t.id && r.type === 'task');
                      const isActive = absoluteIdx === activeIndex;
                      return (
                        <div
                          key={t.id}
                          role="option"
                          aria-selected={isActive}
                          onClick={() => handleSelect(flatResults[absoluteIdx])}
                          onMouseEnter={() => setActiveIndex(absoluteIdx)}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition ${
                            isActive
                              ? 'bg-amber-600/10 dark:bg-amber-600/20 text-[#1F150C] dark:text-[#E1DCC9]'
                              : 'text-neutral-700 dark:text-neutral-400'
                          }`}
                        >
                          <span className="text-sm font-semibold">{t.title}</span>
                          {isActive && <CornerDownLeft className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-100 dark:border-neutral-850 px-4 py-2.5 text-[10px] text-neutral-400 dark:text-neutral-550 flex items-center gap-4">
          <span>
            <kbd className="border border-neutral-250 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-1 py-0.5 rounded shadow-sm mr-1">↑↓</kbd>
            to navigate
          </span>
          <span>
            <kbd className="border border-neutral-250 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-1.5 py-0.5 rounded shadow-sm mr-1">Enter</kbd>
            to select
          </span>
          <span>
            <kbd className="border border-neutral-250 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-1.5 py-0.5 rounded shadow-sm mr-1">Esc</kbd>
            to close
          </span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
