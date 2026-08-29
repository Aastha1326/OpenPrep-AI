import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { deleteGoal, recordProgress, updateGoal } from '../../store/slices/studyGoalSlice';

const priorityColors = {
  low: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-300' },
  medium: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-300' },
  high: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', border: 'border-red-300' },
};

const statusStyles = {
  active: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', dot: 'bg-green-500' },
  completed: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  paused: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', dot: 'bg-yellow-500' },
  expired: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-500 dark:text-gray-400', dot: 'bg-gray-400' },
  missed: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-500 dark:text-red-400', dot: 'bg-red-400' },
};

const metricIcons = {
  study_hours: '⏱️',
  quizzes_completed: '📝',
  flashcards_reviewed: '🃏',
  notes_created: '📒',
  topics_covered: '📚',
  custom: '🎯',
};

export default function StudyGoalCard({ goal, onExpand }) {
  const dispatch = useDispatch();
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressValue, setProgressValue] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const progress = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
  const isCompleted = goal.status === 'completed';
  const isActive = goal.status === 'active';
  const pColor = priorityColors[goal.priority] || priorityColors.medium;
  const sStyle = statusStyles[goal.status] || statusStyles.active;

  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(goal.endDate) - new Date()) / (1000 * 60 * 60 * 24))
  );

  const handleRecordProgress = () => {
    const val = parseFloat(progressValue);
    if (!val || val <= 0) return;
    dispatch(recordProgress({ goalId: goal.id, value: val, source: 'manual' }));
    setProgressValue('');
    setShowProgressModal(false);
  };

  const handleTogglePause = () => {
    dispatch(
      updateGoal({
        goalId: goal.id,
        updates: { status: isActive ? 'paused' : 'active' },
      })
    );
  };

  const handleDelete = () => {
    dispatch(deleteGoal(goal.id));
    setShowDeleteConfirm(false);
  };

  return (
    <div className="relative group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-all duration-200">
      {/* Top row: priority + status + metric icon */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${pColor.bg} ${pColor.text}`}>
            {goal.priority}
          </span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${sStyle.bg} ${sStyle.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sStyle.dot}`} />
            {goal.status}
          </span>
        </div>
        <span className="text-lg" title={goal.metricType}>
          {metricIcons[goal.metricType] || '🎯'}
        </span>
      </div>

      {/* Title + description */}
      <h3
        className="font-semibold text-gray-900 dark:text-gray-100 mb-1 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        onClick={() => onExpand?.(goal.id)}
      >
        {goal.title}
      </h3>
      {goal.description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
          {goal.description}
        </p>
      )}

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>
            {goal.currentValue} / {goal.targetValue} {goal.unit}
          </span>
          <span className="font-semibold">{progress}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isCompleted
                ? 'bg-emerald-500'
                : progress >= 75
                ? 'bg-blue-500'
                : progress >= 50
                ? 'bg-amber-500'
                : 'bg-orange-400'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Metadata row */}
      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
        <div className="flex items-center gap-3">
          {goal.streakDays > 0 && (
            <span className="flex items-center gap-1">
              🔥 {goal.streakDays}d streak
            </span>
          )}
          {isActive && (
            <span className="flex items-center gap-1">
              📅 {daysLeft}d left
            </span>
          )}
          {goal.subjectRef && (
            <span className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">
              {goal.subjectRef.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span>{goal.goalType}</span>
        </div>
      </div>

      {/* Actions */}
      {isActive && (
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={() => setShowProgressModal(true)}
            className="flex-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors"
          >
            + Add Progress
          </button>
          <button
            onClick={handleTogglePause}
            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-lg transition-colors"
          >
            ⏸️ Pause
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-2 py-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs rounded-lg transition-colors"
            title="Delete goal"
          >
            🗑️
          </button>
        </div>
      )}

      {/* Paused actions */}
      {goal.status === 'paused' && (
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={handleTogglePause}
            className="flex-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors"
          >
            ▶️ Resume
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-2 py-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs rounded-lg transition-colors"
          >
            🗑️
          </button>
        </div>
      )}

      {/* Progress Modal */}
      {showProgressModal && (
        <div className="absolute inset-0 bg-white dark:bg-gray-800 rounded-xl border border-blue-300 dark:border-blue-600 p-5 shadow-xl z-10 flex flex-col">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Record Progress
          </h4>
          <label className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Value (unit: {goal.unit})
          </label>
          <input
            type="number"
            step="0.1"
            min="0.1"
            value={progressValue}
            onChange={(e) => setProgressValue(e.target.value)}
            placeholder={`e.g. 0.5`}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex gap-2">
            <button
              onClick={handleRecordProgress}
              className="flex-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => {
                setShowProgressModal(false);
                setProgressValue('');
              }}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-white dark:bg-gray-800 rounded-xl border border-red-300 dark:border-red-600 p-5 shadow-xl z-10 flex flex-col justify-center items-center">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 text-center">
            Delete &quot;{goal.title}&quot;? This cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              className="px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
