import React from 'react';
import { AlertCircle, ArrowUpRight, CheckCircle2, Clock } from 'lucide-react';

const RetentionForecastCard = ({ projections = [] }) => {
  const defaultItems = projections.length > 0 ? projections : [
    { subject: 'Algorithms & Complexity', currentRetention: 42, isUrgent: true, stability: 4, daysUntilDecay: 1 },
    { subject: 'Computer Networks', currentRetention: 78, isUrgent: false, stability: 8, daysUntilDecay: 4 },
    { subject: 'Database Architecture', currentRetention: 91, isUrgent: false, stability: 12, daysUntilDecay: 9 },
  ];

  return (
    <div className="bg-gray-900/60 p-6 rounded-3xl border border-gray-800 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Clock className="text-purple-400" size={22} />
          Knowledge Decay Radar
        </h3>
        <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
          Smart Alert
        </span>
      </div>

      <div className="space-y-4">
        {defaultItems.map((item) => (
          <div
            key={item.subject}
            className={`p-4 rounded-2xl border transition-all ${
              item.isUrgent
                ? 'bg-red-500/5 border-red-500/30'
                : 'bg-gray-850/60 border-gray-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {item.isUrgent ? (
                  <AlertCircle size={18} className="text-red-400" />
                ) : (
                  <CheckCircle2 size={18} className="text-emerald-400" />
                )}
                <span className="font-bold text-sm text-white">{item.subject}</span>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                item.isUrgent
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {item.currentRetention}% Recall
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-400 mt-3 pt-2 border-t border-gray-800">
              <span>Memory Stability: {item.stability} days</span>
              <span className="text-white font-medium flex items-center gap-1">
                Revise in {item.daysUntilDecay} day{item.daysUntilDecay > 1 ? 's' : ''}
                <ArrowUpRight size={14} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RetentionForecastCard;
