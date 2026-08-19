import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import NotificationBell from './notifications/NotificationBell';

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard', preload: () => import('../pages/Dashboard') },
  { to: '/study-planner', label: 'Study Planner', preload: () => import('../pages/StudyPlanner') },
  { to: '/flashcards/review', label: 'Flashcards', preload: () => import('../pages/FlashcardReview') },
  { to: '/battle', label: 'Battle Arena', preload: () => import('../pages/BattleArena') },
  { to: '/study-group', label: 'Study Group', preload: () => import('../pages/StudyGroupChat') },
  { to: '/squads', label: 'Study Squads', preload: () => import('../pages/SquadsPage') },
  { to: '/ai-assistant', label: 'AI Mentor Chat', preload: () => import('../pages/AiAssistant') },
  { to: '/community/decks', label: 'Community Library', preload: () => import('../pages/CommunityDecks') },
  { to: '/pyqs', label: 'PYQ Intelligence', preload: () => import('../pages/PyqDashboard') },
  { to: '/pyq-analytics', label: 'PYQ Trend Analyzer', preload: () => import('../pages/PYQAnalytics') },
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
    <div className="md:hidden flex items-center gap-3 fixed top-4 right-4 z-[60]">
      <div className="bg-slate-800 rounded-full border border-slate-700/50">
        <NotificationBell />
      </div>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
        className="p-2 rounded-lg bg-slate-800 text-slate-100"
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
