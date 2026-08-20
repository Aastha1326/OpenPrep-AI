import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

const ROUTES = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Study Plan', path: '/study-plan' },
  { label: 'Flashcards', path: '/flashcards' },
  { label: 'Settings', path: '/settings' },
  { label: 'Battle Arena', path: '/battle-arena' },
  { label: 'Community Decks', path: '/community-decks' },
  { label: 'Study Group', path: '/study-group' },
  { label: 'Squads', path: '/squads' },
];

export default function GlobalSearchBar() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const wrapperRef = useRef(null);

  const filteredRoutes = ROUTES.filter(route => 
    route.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [wrapperRef]);

  const handleSelect = (path) => {
    navigate(path);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-sm hidden md:block ml-4">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-neutral-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          className="block w-full pl-10 pr-3 py-1.5 border border-neutral-300 dark:border-neutral-700 rounded-md leading-5 bg-neutral-100 dark:bg-neutral-800 placeholder-neutral-500 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:bg-white dark:focus:bg-neutral-900 focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm transition-colors"
          placeholder="Search for pages..."
        />
      </div>
      
      {isOpen && query && (
        <div className="absolute mt-1 w-full bg-white dark:bg-neutral-800 shadow-lg rounded-md border border-neutral-200 dark:border-neutral-700 z-50 overflow-hidden">
          {filteredRoutes.length > 0 ? (
            <ul>
              {filteredRoutes.map((route, i) => (
                <li
                  key={i}
                  className="px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer text-sm text-neutral-700 dark:text-neutral-300"
                  onClick={() => handleSelect(route.path)}
                >
                  {route.label}
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
