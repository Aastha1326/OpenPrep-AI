import React from 'react';
import { Grid, CheckCircle2, AlertTriangle, Clock, HelpCircle } from 'lucide-react';

const DEFAULT_TOPICS = [
  { name: 'Modern History (1857-1947)', weight: 25, status: 'completed' },
  { name: 'Thermodynamics & Heat Transfer', weight: 20, status: 'in-progress' },
  { name: 'Organic Reaction Mechanisms', weight: 18, status: 'weakness' },
  { name: 'Calculus & Differential Equations', weight: 15, status: 'completed' },
  { name: 'Electrostatics & Circuits', weight: 12, status: 'unvisited' },
  { name: 'Genetics & Molecular Biology', weight: 10, status: 'in-progress' },
];

const STATUS_CONFIGS = {
  completed: { bg: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300', label: 'Mastered', icon: CheckCircle2 },
  'in-progress': { bg: 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300', label: 'In Progress', icon: Clock },
  weakness: { bg: 'bg-rose-500/20 border-rose-500/40 text-rose-300', label: 'Critical Weakness', icon: AlertTriangle },
  unvisited: { bg: 'bg-neutral-800/60 border-neutral-700 text-stone-400', label: 'Unvisited', icon: HelpCircle },
};

const TopicWeightageTreemap = ({ topics = DEFAULT_TOPICS }) => {
  const displayTopics = topics.length > 0 ? topics : DEFAULT_TOPICS;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <h3 className="text-stone-100 font-extrabold text-base font-playfair flex items-center gap-2">
          <Grid className="w-5 h-5 text-indigo-400" />
          Exam Weightage & Topic Mastery Treemap
        </h3>
        <div className="flex items-center gap-3 text-[10px] text-stone-400 font-semibold">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" /> Mastered</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-indigo-500 inline-block" /> In Progress</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" /> Weakness</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
        {displayTopics.map((topic, idx) => {
          const cfg = STATUS_CONFIGS[topic.status] || STATUS_CONFIGS.unvisited;
          const Icon = cfg.icon;

          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl border ${cfg.bg} flex flex-col justify-between hover:scale-102 transition-all shadow-md`}
              style={{ minHeight: `${Math.max(100, topic.weight * 4)}px` }}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-xs leading-snug">{topic.name}</span>
                <Icon className="w-4 h-4 shrink-0 mt-0.5" />
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold bg-neutral-950/60 px-2 py-1 rounded-lg border border-neutral-800">
                  {topic.weight}% Marks Weightage
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider">{cfg.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TopicWeightageTreemap;
