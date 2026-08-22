import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Layers, FileText, CheckSquare, Target } from 'lucide-react';

const MobileBottomNav = () => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-6 h-6" /> },
    { name: 'Notes', path: '/notes', icon: <FileText className="w-6 h-6" /> },
    { name: 'Cards', path: '/flashcards', icon: <Layers className="w-6 h-6" /> },
    { name: 'Quizzes', path: '/quizzes', icon: <CheckSquare className="w-6 h-6" /> },
    { name: 'PYQs', path: '/pyqs', icon: <Target className="w-6 h-6" /> },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`
            }
          >
            {item.icon}
            <span className="text-[10px]">{item.name}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default MobileBottomNav;
