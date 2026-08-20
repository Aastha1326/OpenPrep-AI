import React from 'react';

const MetricCard = ({ title, value, icon: Icon, description, colorClass = 'text-amber-500' }) => {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
      <div className="space-y-1">
        <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
          {title}
        </span>
        <h3 className="text-3xl font-extrabold font-playfair tracking-tight text-neutral-900 dark:text-neutral-100">
          {value}
        </h3>
        {description && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {description}
          </p>
        )}
      </div>
      <div className={`p-4 bg-neutral-50 dark:bg-neutral-950 rounded-2xl border border-neutral-100 dark:border-neutral-850 shrink-0 ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
};

export default MetricCard;
