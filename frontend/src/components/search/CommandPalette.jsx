import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  CalendarCheck,
  CheckSquare,
  CornerDownLeft,
  FileText,
  Layers,
  Search,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'question', label: 'Questions' },
  { value: 'flashcard', label: 'Flashcards' },
  { value: 'note', label: 'Notes' },
  { value: 'formulas', label: 'Formulas' },
];

/**
 * The seven result groups /api/search returns, in the order they are shown.
 *
 * `results` is the hybrid-search array, which only ever holds questions,
 * flashcards and notes - hybridSearchService.loadIndex reads exactly those
 * three tables. The other four come from the SQL half of the controller and
 * were dropped entirely when the palette was rewritten to read only
 * `data.results`, so searching for a deck, a topic, a quiz or a study-plan
 * task returned "No results" while the payload contained them.
 */
const GROUPS = [
  { key: 'results', label: 'Library', icon: BookOpen },
  { key: 'topics', label: 'Topics', icon: BookOpen },
  { key: 'decks', label: 'Decks', icon: Layers },
  { key: 'quizzes', label: 'Quizzes', icon: CheckSquare },
  { key: 'tasks', label: 'Study plan', icon: CalendarCheck },
];

const TYPE_ICONS = { question: BookOpen, flashcard: Layers, note: FileText };

const EMPTY_RESULTS = { results: [], topics: [], decks: [], quizzes: [], tasks: [] };

/** Where selecting an item should navigate to. */
function urlFor(groupKey, item) {
  if (groupKey === 'results') return item.url;
  if (groupKey === 'topics') return `/flashcards?topicId=${item.id}`;
  if (groupKey === 'decks') return `/flashcards?deckId=${item.id}`;
  if (groupKey === 'quizzes') return `/quiz/${item.id}`;
  return '/study-planner';
}

/** The label shown for an item, whichever group it came from. */
function labelFor(item) {
  return item.title || item.name || '';
}

/**
 * Flatten the grouped payload into the list keyboard navigation walks.
 *
 * Rendering is grouped but selection is linear, so arrow keys move through
 * everything on screen rather than resetting at each heading.
 */
function flatten(data, filter) {
  const flat = [];

  for (const group of GROUPS) {
    // The SQL groups are not typed, so a type filter can only apply to the
    // hybrid results. Narrowing to a type hides them rather than showing
    // matches the filter does not describe.
    if (filter !== 'all' && group.key !== 'results') continue;

    for (const item of data[group.key] || []) {
      // The flat position is assigned here rather than counted during render:
      // selection is linear across groups, and render must stay pure.
      flat.push({
        group,
        item,
        index: flat.length,
        url: urlFor(group.key, item),
        label: labelFor(item),
      });
    }
  }

  return flat;
}

export default function CommandPalette({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [fetched, setFetched] = useState({ key: '', data: EMPTY_RESULTS, error: '' });
  const [active, setActive] = useState({ key: '', index: 0 });
  const inputRef = useRef(null);
  const previousFocusRef = useRef(null);
  const debounceTimer = useRef(null);

  const trimmedQuery = query.trim();
  // One key identifies the request the UI is currently asking for. Everything
  // below is derived from whether what we hold matches it, rather than kept in
  // sync by effects that setState - which is what let the old build render one
  // query's results under another query's input.
  const requestKey = `${filter}:${trimmedQuery}`;
  const isCurrent = fetched.key === requestKey;

  // An empty box shows nothing, whatever was last fetched. The old build
  // returned early without touching state, so clearing the input left the
  // previous hits listed and Enter still navigated to one of them.
  const data = trimmedQuery && isCurrent ? fetched.data : EMPTY_RESULTS;
  const error = isCurrent ? fetched.error : '';
  // Pending from the keystroke, not from the end of the debounce.
  const loading = Boolean(trimmedQuery) && !isCurrent;

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
    if (!isOpen || !trimmedQuery) return undefined;

    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      try {
        const response = await API.get(
          `/search?q=${encodeURIComponent(trimmedQuery)}&type=${filter}`
        );
        const payload = response.data?.data || {};
        setFetched({
          key: requestKey,
          error: '',
          data: {
            results: payload.results || [],
            topics: payload.topics || [],
            decks: payload.decks || [],
            quizzes: payload.quizzes || [],
            tasks: payload.tasks || [],
          },
        });
      } catch (err) {
        // A failed request is not a genuine no-match, and saying so matters
        // while /api/search can still fail on a cold index.
        setFetched({
          key: requestKey,
          data: EMPTY_RESULTS,
          error: err.response?.data?.error || 'Search is unavailable right now.',
        });
      }
    }, 150);

    return () => clearTimeout(debounceTimer.current);
  }, [filter, isOpen, requestKey, trimmedQuery]);

  const flatResults = useMemo(() => flatten(data, filter), [data, filter]);

  // The cursor belongs to one request. A new query starts at the top rather
  // than pointing into the list it replaced.
  const activeIndex =
    active.key === requestKey && active.index < flatResults.length ? active.index : 0;

  if (!isOpen) return null;

  const closePalette = () => {
    setQuery('');
    setFetched({ key: '', data: EMPTY_RESULTS, error: '' });
    onClose();
  };

  const handleSelect = (entry) => {
    navigate(entry.url);
    closePalette();
  };

  // Switching the filter changes requestKey, so the previous filter's hits
  // stop being rendered immediately instead of lingering for the whole
  // debounce plus round trip with activeIndex pointing into them.
  const changeFilter = (value) => setFilter(value);

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive({
        key: requestKey,
        index: flatResults.length ? (activeIndex + 1) % flatResults.length : 0,
      });
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive({
        key: requestKey,
        index: flatResults.length ? (activeIndex - 1 + flatResults.length) % flatResults.length : 0,
      });
    } else if (event.key === 'Enter' && flatResults[activeIndex]) {
      event.preventDefault();
      handleSelect(flatResults[activeIndex]);
    }
  };

  const hasQuery = Boolean(query.trim());
  const hasResults = flatResults.length > 0;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/60 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={(event) => event.target === event.currentTarget && closePalette()}
    >
      <div className="flex max-h-[70vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <Search className="h-5 w-5 shrink-0 text-neutral-400" />
          <input
            ref={inputRef}
            role="combobox"
            aria-label="Search"
            aria-autocomplete="list"
            aria-expanded={hasResults}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search questions, flashcards, notes, decks, quizzes and tasks..."
            className="flex-1 bg-transparent text-base text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-white"
          />
          <kbd className="hidden rounded border border-neutral-300 px-1.5 py-0.5 text-[10px] text-neutral-400 sm:block">
            ESC
          </kbd>
          <button
            type="button"
            aria-label="Close search"
            onClick={closePalette}
            className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-1.5 border-b border-neutral-200 px-4 py-2 dark:border-neutral-800">
          {FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={filter === option.value}
              onClick={() => changeFilter(option.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                filter === option.value
                  ? 'bg-indigo-600 text-white'
                  : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {error && (
            <p role="alert" className="py-8 text-center text-sm text-red-600 dark:text-red-300">
              {error}
            </p>
          )}

          {!error && loading && (
            <p role="status" className="animate-pulse py-8 text-center text-xs font-semibold text-neutral-400">
              Searching...
            </p>
          )}

          {!error && !loading && !hasQuery && (
            <p className="py-12 text-center text-sm text-neutral-400">
              Type a keyword to begin your global search.
            </p>
          )}

          {!error && !loading && hasQuery && !hasResults && (
            <p className="py-12 text-center text-sm text-neutral-400">
              No results found matching &quot;{query}&quot;
            </p>
          )}

          {!error && !loading && hasResults && (
            <div role="listbox" aria-label="Search results" className="space-y-4">
              {GROUPS.map((group) => {
                const items = flatResults.filter((entry) => entry.group.key === group.key);
                if (!items.length) return null;
                const GroupIcon = group.icon;

                return (
                  <div key={group.key}>
                    <div className="mb-2 flex items-center gap-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      <GroupIcon className="h-3.5 w-3.5 text-indigo-500" /> {group.label}
                    </div>
                    <div className="space-y-1">
                      {items.map((entry) => {
                        const { index } = entry;
                        const ItemIcon =
                          group.key === 'results'
                            ? TYPE_ICONS[entry.item.type] || FileText
                            : group.icon;

                        return (
                          <button
                            key={`${group.key}-${entry.item.id}`}
                            type="button"
                            role="option"
                            aria-selected={index === activeIndex}
                            onClick={() => handleSelect(entry)}
                            onMouseEnter={() => setActive({ key: requestKey, index })}
                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                              index === activeIndex
                                ? 'bg-indigo-50 text-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-100'
                                : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800'
                            }`}
                          >
                            <ItemIcon className="h-4 w-4 shrink-0 text-neutral-400" />
                            <span className="min-w-0 flex-1 truncate">{entry.label}</span>
                            {entry.item.subject && (
                              <span className="shrink-0 text-xs text-neutral-400">
                                {entry.item.subject}
                              </span>
                            )}
                            {index === activeIndex && (
                              <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
