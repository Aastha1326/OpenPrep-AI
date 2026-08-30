import React from 'react';
import { Target, CheckCircle2, Award } from 'lucide-react';
import { motion } from 'framer-motion';

const QuestTracker = ({ quests = [] }) => {
  const defaultQuests = quests.length > 0 ? quests : [
    { id: '1', title: 'Review 15 Spaced Cards', current: 12, target: 15, xpReward: 50 },
    { id: '2', title: 'Complete 1 Practice Quiz', current: 1, target: 1, xpReward: 75, completed: true },
    { id: '3', title: 'Log 30 Mins Focus Study', current: 20, target: 30, xpReward: 60 },
  ];

  return (
    <div className="bg-gray-900/60 p-6 rounded-3xl border border-gray-800 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Target className="text-blue-400" size={22} />
          Daily Study Quests
        </h3>
        <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
          Resets in 6h
        </span>
      </div>

      <div className="space-y-4">
        {defaultQuests.map((quest) => {
          const isDone = quest.completed || quest.current >= quest.target;
          const pct = Math.min(100, Math.round((quest.current / quest.target) * 100));

          return (
            <div key={quest.id} className="p-4 rounded-2xl bg-gray-850/70 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm text-white flex items-center gap-2">
                  {isDone ? <CheckCircle2 size={18} className="text-emerald-400" /> : <div className="w-2 h-2 rounded-full bg-blue-400" />}
                  {quest.title}
                </span>
                <span className="text-xs font-bold text-yellow-400">+{quest.xpReward} XP</span>
              </div>

              <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  className={`h-full ${isDone ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuestTracker;
