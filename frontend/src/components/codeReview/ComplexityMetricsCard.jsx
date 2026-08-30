import React from 'react';
import { Gauge, Clock, HardDrive, Hash } from 'lucide-react';

const ComplexityMetricsCard = ({ metrics }) => {
  if (!metrics) return null;

  const cards = [
    {
      label: 'Est. Time Complexity',
      value: metrics.estimatedTimeComplexity || 'O(1)',
      icon: Clock,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    },
    {
      label: 'Est. Space Complexity',
      value: metrics.estimatedSpaceComplexity || 'O(1)',
      icon: HardDrive,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    },
    {
      label: 'Cyclomatic Complexity',
      value: metrics.cyclomaticComplexity || 1,
      icon: Gauge,
      color: metrics.cyclomaticComplexity > 10
        ? 'text-red-400 bg-red-500/10 border-red-500/20'
        : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: 'Abstract Token Count',
      value: metrics.tokenCount || 0,
      icon: Hash,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.label}
            className="p-4 rounded-2xl bg-gray-850/60 border border-gray-800 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{c.label}</span>
              <div className={`p-1.5 rounded-lg border ${c.color}`}>
                <Icon size={16} />
              </div>
            </div>
            <div className="text-xl font-extrabold text-white">{c.value}</div>
          </div>
        );
      })}
    </div>
  );
};

export default ComplexityMetricsCard;
