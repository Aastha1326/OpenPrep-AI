import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const ROUTES = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Flashcards Review', path: '/flashcards/review' },
  { name: 'Battle Arena', path: '/battle' },
  { name: 'Study Group', path: '/study-group' },
  { name: 'AI Assistant', path: '/ai-assistant' },
  { name: 'PYQs', path: '/pyqs' },
  { name: 'Settings', path: '/settings' },
];

export default function CommandPalette() {
  const dialogRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        dialogRef.current?.showModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleClose = () => {
    dialogRef.current?.close();
  };

  const navigateTo = (path) => {
    navigate(path);
    handleClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className="backdrop:bg-black/50 p-4 rounded-xl shadow-2xl glass-card w-full max-w-lg m-auto fixed top-1/4 open:flex flex-col gap-4"
      onClick={(e) => {
        if (e.target === dialogRef.current) handleClose();
      }}
    >
      <div className="flex justify-between items-center border-b border-light-border dark:border-dark-border pb-2 w-full">
        <h2 className="text-lg font-semibold">Command Palette</h2>
        <button onClick={handleClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-white">✕</button>
      </div>
      <div className="flex flex-col gap-2 max-h-60 overflow-y-auto w-full">
        {ROUTES.map((route) => (
          <button
            key={route.path}
            onClick={() => navigateTo(route.path)}
            className="text-left p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors"
          >
            {route.name}
          </button>
        ))}
      </div>
      <div className="text-xs text-gray-500 text-center mt-2 w-full">
        ponytail: native dialog, static routes list, no heavy fuzzy finder dependency
      </div>
    </dialog>
  );
}
