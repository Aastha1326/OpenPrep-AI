import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, FileText, Calendar, BookOpen, Bot, Swords, Brain } from 'lucide-react';
import VintagePaper from './VintagePaper';

const QuickStartWidget = () => {
  const navigate = useNavigate();

  const actions = [
    {
      label: 'Start Quiz',
      icon: Play,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      hover: 'hover:bg-emerald-500 hover:text-white',
      onClick: () => navigate('/pyqs'),
    },
    {
      label: 'Flashcards',
      icon: BookOpen,
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      hover: 'hover:bg-purple-500 hover:text-white',
      onClick: () => navigate('/flashcards'),
    },
    {
      label: 'Study Planner',
      icon: Calendar,
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      hover: 'hover:bg-blue-500 hover:text-white',
      onClick: () => navigate('/study-planner'),
    },
    {
      label: 'PYQ Intelligence',
      icon: FileText,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      hover: 'hover:bg-amber-500 hover:text-white',
      onClick: () => navigate('/pyqs'),
    },
    {
      label: 'AI Tutor Assistant',
      icon: Bot,
      color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
      hover: 'hover:bg-cyan-500 hover:text-white',
      onClick: () => navigate('/ai-assistant'),
    },
    {
      label: 'Battle Arena',
      icon: Swords,
      color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
      hover: 'hover:bg-red-500 hover:text-white',
      onClick: () => navigate('/battle'),
    },
  ];

  return (
    <VintagePaper className="p-5 border-t-4 border-t-emerald-600">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-playfair font-bold text-lg text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
          <Brain className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          Quick Actions & Launcher
        </h3>
        <span className="text-xs text-neutral-500 italic">One-click study shortcuts</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-2">
        {actions.map((act) => {
          const IconComponent = act.icon;
          return (
            <button
              key={act.label}
              onClick={act.onClick}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all transform hover:-translate-y-0.5 ${act.color} ${act.hover}`}
            >
              <IconComponent className="w-6 h-6 mb-1.5" />
              <span className="text-xs font-semibold font-playfair text-center">
                {act.label}
              </span>
            </button>
          );
        })}
      </div>
    </VintagePaper>
  );
};

export default QuickStartWidget;
