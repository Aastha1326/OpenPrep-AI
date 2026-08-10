import { Check, AlertCircle, RefreshCw, AlertTriangle, ClockPlus } from 'lucide-react';

const Shimmer = ({ className = '' }) => (
  <div className={`animate-pulse bg-neutral-300/60 rounded ${className}`} />
);

const WeakBadge = () => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-red-100 text-red-700 border border-red-200 mt-1">
    <AlertTriangle className="w-3 h-3" />
    Weak Topic
  </span>
);

const BonusBadge = () => (
  <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold rounded bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/40 mt-0.5 ml-2">
    Bonus
  </span>
);

const BumpTimeButton = ({ onClick, disabled = false }) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onClick?.();
    }}
    disabled={disabled}
    className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-sm bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    title="Add 30 minutes of recommended study time"
  >
    <ClockPlus className="w-3 h-3" />
    +30 min
  </button>
);

const PinnedTasks = ({
  tasks = [],
  progress = 0,
  completedBonus = 0,
  loading = false,
  error = null,
  onRetry,
  onToggle,
  onBumpTime
}) => {
  if (loading) {
    return (
      <div className="relative bg-[#fdfaf3] dark:bg-slate-800 shadow-[4px_6px_15px_rgba(0,0,0,0.15)] rounded-sm p-6 max-w-sm mx-auto transform rotate-1 hover:rotate-0 transition-transform">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-600 rounded-full shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.5),2px_4px_4px_rgba(0,0,0,0.3)] z-10">
          <div className="absolute top-1 left-1 w-1 h-1 bg-white/50 rounded-full" />
          <div className="absolute top-4 left-1 w-0.5 h-3 bg-black/20 origin-top rotate-45 pointer-events-none" />
        </div>
        <h3 className="font-playfair font-bold text-2xl text-red-800/80 dark:text-red-400 text-center mb-4 border-b border-red-800/20 dark:border-red-400/20 pb-2">To-Do List</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Shimmer className="w-5 h-5 shrink-0" />
              <Shimmer className="h-4 flex-1" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative bg-[#fdfaf3] dark:bg-slate-800 shadow-[4px_6px_15px_rgba(0,0,0,0.15)] rounded-sm p-6 max-w-sm mx-auto transform rotate-1 hover:rotate-0 transition-transform">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-600 rounded-full" />
        <h3 className="font-playfair font-bold text-2xl text-red-800/80 dark:text-red-400 text-center mb-4 border-b border-red-800/20 dark:border-red-400/20 pb-2">To-Do List</h3>
        <div className="flex flex-col items-center text-neutral-500 py-4">
          <AlertCircle className="w-8 h-8 mb-2" />
          <p className="text-sm text-center mb-3">Could not load tasks</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1 text-red-800 hover:text-red-900 font-semibold text-xs uppercase tracking-wider"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="relative bg-[#fdfaf3] dark:bg-slate-800 shadow-[4px_6px_15px_rgba(0,0,0,0.15)] rounded-sm p-6 max-w-sm mx-auto transform rotate-1 hover:rotate-0 transition-transform">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-600 rounded-full shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.5),2px_4px_4px_rgba(0,0,0,0.3)] z-10">
          <div className="absolute top-1 left-1 w-1 h-1 bg-white/50 rounded-full" />
          <div className="absolute top-4 left-1 w-0.5 h-3 bg-black/20 origin-top rotate-45 pointer-events-none" />
        </div>
        <h3 className="font-playfair font-bold text-2xl text-red-800/80 dark:text-red-400 text-center mb-4 border-b border-red-800/20 dark:border-red-400/20 pb-2">To-Do List</h3>
        <p className="text-center text-neutral-500 italic py-6 text-sm">
          No tasks for today — generate a study plan to get started!
        </p>
      </div>
    );
  }

  const weakCount = tasks.filter((t) => t.topic?.status === 'Weak').length;

  return (
    <div className="relative bg-[#fdfaf3] dark:bg-slate-800 shadow-[4px_6px_15px_rgba(0,0,0,0.15)] rounded-sm p-6 w-full max-w-sm mx-auto transform rotate-1 hover:rotate-0 transition-transform">
      {/* Torn Top Edge Effect */}
      <div className="absolute top-0 left-0 right-0 h-3 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAiIHByZXNlcnZlQXNwZWN0UmF0aW89Im5vbmUiPjxwYXRoIGQ9Ik0wIDEwTDIwIDBMNDAgMTBMNjAgMEw4MCAxMEwxMDAgMFYxMEgwWiIgZmlsbD0iI2ZkZmFmMyIvPjwvc3ZnPg==')] dark:bg-none -translate-y-full" />

      {/* Red Pushpin */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-600 rounded-full shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.5),2px_4px_4px_rgba(0,0,0,0.3)] z-10">
        <div className="absolute top-1 left-1 w-1 h-1 bg-white/50 rounded-full" />
        {/* Pin shadow on paper */}
        <div className="absolute top-4 left-1 w-0.5 h-3 bg-black/20 origin-top rotate-45 pointer-events-none" />
      </div>

      <div className="flex flex-col items-center mb-4 border-b border-red-800/20 dark:border-red-400/20 pb-2">
        <h3 className="font-playfair font-bold text-2xl text-red-800/80 dark:text-red-400 text-center">To-Do List</h3>
        {weakCount > 0 && (
          <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/30">
            <AlertTriangle className="w-3 h-3" />
            {weakCount} weak task{weakCount === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {/* Daily Progress Bar */}
      <div className="w-full mb-4 px-1">
        <div className="flex justify-between items-center text-[10px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
          <span className="flex items-center gap-1.5 flex-wrap">
            Daily Progress
            {completedBonus > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/40 shadow-sm">
                ★ {completedBonus} Bonus Done
              </span>
            )}
          </span>
          <span className="font-mono text-neutral-900 dark:text-neutral-100">{progress}%</span>
        </div>
        <div className="w-full h-3 bg-neutral-200 dark:bg-slate-700 rounded-full overflow-hidden border border-neutral-300 dark:border-slate-600 relative p-0.5">
          <div
            data-testid="daily-progress-fill"
            className="h-full bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-600 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => {
          const isWeak = task.topic?.status === 'Weak';
          return (
            <div
              key={task.id}
              className={`flex items-start cursor-pointer group rounded p-1.5 -mx-1.5 transition-colors ${
                isWeak
                  ? 'bg-red-50/70 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20'
                  : 'hover:bg-red-900/5 dark:hover:bg-red-50/5'
              }`}
              onClick={() => onToggle?.(task.id)}
            >
              <div className={`mt-1 w-5 h-5 border-2 rounded-sm flex items-center justify-center shrink-0 transition-colors ${
                task.completed
                  ? 'border-green-600 bg-green-50 dark:bg-green-900/30'
                  : isWeak
                    ? 'border-red-400 bg-white dark:bg-slate-700 dark:border-red-500/60 group-hover:border-red-500 dark:group-hover:border-red-400'
                    : 'border-neutral-400 bg-white dark:bg-slate-700 dark:border-slate-500 group-hover:border-neutral-600 dark:group-hover:border-slate-400'
              }`}>
                {task.completed && <Check className="w-3 h-3 text-green-600 dark:text-green-400 font-bold" />}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-y-1">
                  <span className={`font-inter text-neutral-800 dark:text-neutral-200 ${
                    task.completed ? 'line-through text-neutral-400 dark:text-neutral-500' : ''
                  }`}>
                    {task.text}
                  </span>
                  {task.isBonus && <BonusBadge />}
                </div>
                <div className="flex flex-wrap items-center gap-x-3">
                  {task.duration && (
                    <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">
                      <ClockPlus className="w-3 h-3" />
                      {task.duration} min
                    </span>
                  )}
                  {isWeak && <WeakBadge />}
                </div>
                {isWeak && onBumpTime && (
                  <BumpTimeButton onClick={() => onBumpTime(task.id, 30)} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PinnedTasks;
