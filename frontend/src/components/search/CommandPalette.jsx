import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, CheckSquare, CornerDownLeft, FileText, Layers, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'question', label: 'Questions' },
  { value: 'flashcard', label: 'Flashcards' },
  { value: 'note', label: 'Notes' },
  { value: 'formulas', label: 'Formulas' },
];
const icons = { question: BookOpen, flashcard: Layers, note: FileText };

export default function CommandPalette({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const previousFocusRef = useRef(null);
  const debounceTimer = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    previousFocusRef.current = document.activeElement;
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 50);
    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleEscape);
      previousFocusRef.current?.focus?.();
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;
    clearTimeout(debounceTimer.current);
    if (!query.trim()) {
      return undefined;
    }
    debounceTimer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await API.get(`/search?q=${encodeURIComponent(query)}&type=${filter}`);
        setResults(response.data?.data?.results || []);
        setActiveIndex(0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 150);
    return () => clearTimeout(debounceTimer.current);
  }, [filter, isOpen, query]);

  if (!isOpen) return null;
  const closePalette = () => {
    setQuery('');
    setResults([]);
    onClose();
  };
  const handleSelect = (result) => {
    navigate(result.url);
    closePalette();
  };
  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => results.length ? (index + 1) % results.length : 0);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => results.length ? (index - 1 + results.length) % results.length : 0);
    } else if (event.key === 'Enter' && results[activeIndex]) {
      event.preventDefault();
      handleSelect(results[activeIndex]);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/60 p-4 pt-[12vh] backdrop-blur-sm" onClick={(event) => event.target === event.currentTarget && closePalette()}>
      <div className="flex max-h-[70vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <Search className="h-5 w-5 shrink-0 text-neutral-400" />
          <input ref={inputRef} role="combobox" aria-autocomplete="list" aria-expanded={results.length > 0} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={handleKeyDown} placeholder="Search questions, flashcards, notes..." className="flex-1 bg-transparent text-base text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-white" />
          <kbd className="hidden rounded border border-neutral-300 px-1.5 py-0.5 text-[10px] text-neutral-400 sm:block">ESC</kbd>
          <button type="button" aria-label="Close search" onClick={closePalette} className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex gap-2 overflow-x-auto border-b border-neutral-100 px-4 py-2 dark:border-neutral-800">
          {FILTERS.map((option) => <button key={option.value} type="button" onClick={() => setFilter(option.value)} className={`whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold ${filter === option.value ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}>{option.label}</button>)}
        </div>
        <div className="min-h-[180px] overflow-y-auto p-3">
          {loading && <div className="py-12 text-center text-sm text-neutral-400">Searching...</div>}
          {!loading && !query && <div className="py-12 text-center text-sm text-neutral-400">Search your study library</div>}
          {!loading && query && !results.length && <div className="py-12 text-center text-sm text-neutral-400">No matching study material</div>}
          {!loading && results.length > 0 && <div role="listbox" className="space-y-1">
            {results.map((result, index) => {
              const Icon = icons[result.type] || CheckSquare;
              return <button key={`${result.type}-${result.id}`} type="button" role="option" aria-selected={index === activeIndex} onMouseEnter={() => setActiveIndex(index)} onClick={() => handleSelect(result)} className={`flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left ${index === activeIndex ? 'bg-amber-50 dark:bg-amber-950/30' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800'}`}>
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-neutral-900 dark:text-white">{result.title}</span><span className="mt-1 block line-clamp-2 text-xs text-neutral-500 dark:text-neutral-400" dangerouslySetInnerHTML={{ __html: result.snippet }} /></span>
                {index === activeIndex && <CornerDownLeft className="mt-1 h-4 w-4 shrink-0 text-amber-600" />}
              </button>;
            })}
          </div>}
        </div>
        <div className="flex items-center gap-4 border-t border-neutral-100 bg-neutral-50 px-4 py-2 text-[10px] text-neutral-400 dark:border-neutral-800 dark:bg-neutral-950"><span><kbd className="mr-1 rounded border px-1">↑↓</kbd>navigate</span><span><kbd className="mr-1 rounded border px-1">Enter</kbd>open</span><span className="ml-auto">Hybrid search</span></div>
      </div>
    </div>
  );
}
