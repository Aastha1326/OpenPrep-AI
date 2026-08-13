import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard', preload: () => import('../pages/Dashboard') },
  { to: '/flashcards/review', label: 'Flashcards', preload: () => import('../pages/FlashcardReview') },
  { to: '/battle', label: 'Battle Arena', preload: () => import('../pages/BattleArena') },
  { to: '/study-group', label: 'Study Group', preload: () => import('../pages/StudyGroupChat') },
  { to: '/ai-assistant', label: 'AI Mentor Chat', preload: () => import('../pages/AiAssistant') },
  { to: '/community/decks', label: 'Community Library', preload: () => import('../pages/CommunityDecks') },
  { to: '/settings', label: 'Settings', preload: () => import('../pages/Settings') },
];

const MobileNavDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Close the drawer automatically whenever the route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
        className="fixed top-4 right-4 z-[60] p-2 rounded-lg bg-slate-800 text-slate-100"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            data-testid="mobile-drawer"
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="fixed inset-0 z-50 bg-slate-900/95 flex flex-col p-6"
          >
            <nav className="flex flex-col space-y-4 mt-16">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onMouseEnter={() => link.preload()}
                  className="text-lg font-medium text-slate-100 hover:text-indigo-400"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileNavDrawer;
