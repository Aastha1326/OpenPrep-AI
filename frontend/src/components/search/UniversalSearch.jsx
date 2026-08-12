import React, { useState, useEffect } from 'react';
import { Search, Sparkles, BookOpen, HelpCircle, Layers, FileText, Loader2 } from 'lucide-react';
import API from '../../services/api';

export default function UniversalSearch() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [results, setResults] = useState({ all: [], notes: [], pyqs: [], flashcards: [], syllabi: [] });
  const [loading, setLoading] = useState(false);
  const [execTime, setExecTime] = useState(null);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults({ all: [], notes: [], pyqs: [], flashcards: [], syllabi: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await API.get(`/search?q=${encodeURIComponent(query)}&category=${category}`);
        if (response.data.success) {
          setResults(response.data.data);
          setExecTime(response.data.executionTimeMs);
        }
      } catch (err) {
        console.error('Universal search failed', err);
      } finally {
        setLoading(false);
      }
    }, 300); // Debounce search

    return () => clearTimeout(timer);
  }, [query, category]);

  const highlightKeyword = (text, keyword) => {
    if (!text || !keyword) return text;
    const parts = text.split(new RegExp(`(${keyword})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === keyword.toLowerCase() ? (
        <span key={i} className="bg-amber-500/20 text-amber-600 dark:text-amber-300 font-bold px-0.5 rounded">{part}</span>
      ) : part
    );
  };

  const activeResults = category === 'all' ? results.all : results[category] || [];

  const categoryIcons = {
    notes: <BookOpen className="w-4 h-4 text-blue-500" />,
    pyqs: <HelpCircle className="w-4 h-4 text-purple-500" />,
    flashcards: <Layers className="w-4 h-4 text-green-500" />,
    syllabi: <FileText className="w-4 h-4 text-amber-500" />,
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 font-inter text-[#1F150C] dark:text-[#E1DCC9]">
      {/* Search Input Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes, past questions, flashcards, or syllabi (e.g., 'Newton's Laws')..."
          className="w-full pl-12 pr-4 py-3.5 bg-[#FFFBE9] dark:bg-[#16120E] border border-[#CEAB93]/60 dark:border-[#412D15] rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
        />
        {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-amber-500" />}
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-[#CEAB93]/30 pb-3">
        {['all', 'notes', 'pyqs', 'flashcards', 'syllabi'].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${category === cat ? 'btn-primary-theme shadow' : 'bg-black/5 dark:bg-white/5 text-[#8C6A53] dark:text-[#C4BA9D] hover:bg-black/10'}`}
          >
            {cat} {results[cat]?.length ? `(${results[cat].length})` : ''}
          </button>
        ))}
        {execTime && <span className="ml-auto text-[11px] font-mono text-neutral-400">Response: {execTime}ms</span>}
      </div>

      {/* Results Feed */}
      <div className="space-y-3">
        {activeResults.length === 0 && query.trim().length >= 2 && !loading && (
          <div className="text-center py-16 text-xs text-[#8C6A53] dark:text-[#C4BA9D]">
            No matching entities found for "{query}".
          </div>
        )}

        {activeResults.map((item, idx) => (
          <div key={idx} className="p-4 bg-[#FFFBE9]/50 dark:bg-[#16120E] rounded-2xl border border-[#CEAB93]/40 dark:border-[#412D15] hover:border-amber-500 transition shadow-sm flex items-start gap-3">
            <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5 mt-0.5">
              {categoryIcons[item.type] || <Sparkles className="w-4 h-4 text-amber-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-bold truncate">{highlightKeyword(item.title, query)}</h4>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[#8C6A53] dark:text-[#C4BA9D]">
                  {item.type}
                </span>
              </div>
              <p className="text-xs text-[#8C6A53] dark:text-[#C4BA9D] line-clamp-2">
                {highlightKeyword(item.snippet, query)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
