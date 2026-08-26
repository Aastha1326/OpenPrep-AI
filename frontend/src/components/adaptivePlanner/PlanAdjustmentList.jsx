import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, Clock, Zap, AlertTriangle } from 'lucide-react';

const PlanAdjustmentList = ({ adjustments = [] }) => {
  if (adjustments.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          <Zap className="w-5 h-5 inline mr-2" />
          Adaptive Adjustments
        </h3>
        <div className="flex items-center justify-center h-24 text-gray-500 dark:text-gray-400">
          <p className="text-sm">No adjustments needed — your plan is well balanced</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          <Zap className="w-5 h-5 inline mr-2" />
          Adaptive Adjustments
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {adjustments.length} task{adjustments.length !== 1 ? 's' : ''} adjusted
        </span>
      </div>

      <div className="space-y-2">
        {adjustments.map((adj, i) => {
          const isBoosted = adj.multiplier > 1;
          const isReduced = adj.multiplier < 1;
          const isUrgent = adj.multiplier >= 2;

          return (
            <div
              key={i}
              className={`p-3 rounded-lg border transition-all ${
                isUrgent
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  : isBoosted
                    ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                    : isReduced
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isUrgent ? (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  ) : isBoosted ? (
                    <ArrowUpRight className="w-4 h-4 text-amber-500" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-emerald-500" />
                  )}
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{adj.topicName}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500 dark:text-gray-400">{adj.originalDuration}m</span>
                  <span className="text-gray-400">→</span>
                  <span className={`font-bold ${isBoosted ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {adj.newDuration}m
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    isBoosted ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                  }`}>
                    {adj.multiplier > 1 ? '+' : ''}{Math.round((adj.multiplier - 1) * 100)}%
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 ml-6">{adj.reason}</p>
              <div className="flex items-center gap-3 mt-1 ml-6 text-[10px] text-gray-400 dark:text-gray-500">
                <span>Status: {adj.status}</span>
                <span>Weight: {adj.weightage}%</span>
                <span>In {adj.daysUntilTask}d</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlanAdjustmentList;
