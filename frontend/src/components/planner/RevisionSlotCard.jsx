import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { completeSlot, skipSlot } from '../../store/slices/revisionSchedulerSlice';

const priorityConfig = {
  critical: { color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300', border: 'border-red-300', label: 'CRITICAL' },
  high: { color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300', border: 'border-orange-300', label: 'HIGH' },
  medium: { color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300', border: 'border-amber-300', label: 'MED' },
  low: { color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300', border: 'border-blue-300', label: 'LOW' },
};

const activityConfig = {
  review_flashcards: { icon: '🃏', label: 'Flashcard Review' },
  practice_quiz: { icon: '📝', label: 'Practice Quiz' },
  read_notes: { icon: '📖', label: 'Read Notes' },
  solve_pyq: { icon: '📄', label: 'PYQ Practice' },
  deep_dive: { icon: '🔬', label: 'Deep Dive' },
  light_review: { icon: '💡', label: 'Light Review' },
  mixed: { icon: '🎯', label: 'Mixed Review' },
};

const statusConfig = {
  pending: { color: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300', icon: '⏳' },
  in_progress: { color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300', icon: '▶️' },
  completed: { color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300', icon: '✅' },
  skipped: { color: 'bg-gray-100 dark:bg-gray-700 text-gray-400', icon: '⏭️' },
  rescheduled: { color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300', icon: '🔄' },
};

export default function RevisionSlotCard({ slot, compact = false }) {
  const dispatch = useDispatch();
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');

  const priority = priorityConfig[slot.priority] || priorityConfig.medium;
  const activity = activityConfig[slot.activityType] || activityConfig.mixed;
  const status = statusConfig[slot.status] || statusConfig.pending;
  const isPending = slot.status === 'pending' || slot.status === 'in_progress';
  const isCompleted = slot.status === 'completed';

  const handleComplete = () => {
    dispatch(completeSlot({ slotId: slot.id, notes: notes || undefined }));
    setShowNotes(false);
    setNotes('');
  };

  const handleSkip = () => {
    dispatch(skipSlot(slot.id));
  };

  const subjectName = slot.metadata?.subjectName || slot.subjectRef?.name || 'Subject';
  const readinessGap = slot.metadata?.readinessGap;

  if (compact) {
    return (
      <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${
        isCompleted ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10' :
        'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
      }`}>
        <span className="text-sm">{status.icon}</span>
        <span className="text-sm">{activity.icon}</span>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium truncate ${isCompleted ? 'text-emerald-600 dark:text-emerald-400 line-through' : 'text-gray-900 dark:text-gray-100'}`}>
            {slot.title}
          </p>
        </div>
        <span className="text-[10px] text-gray-400">{slot.durationMinutes}m</span>
      </div>
    );
  }

  return (
    <div className={`relative bg-white dark:bg-gray-800 rounded-xl border p-4 transition-all duration-200 ${
      isCompleted ? 'border-emerald-200 dark:border-emerald-800 opacity-75' :
      'border-gray-200 dark:border-gray-700 hover:shadow-md'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${priority.color}`}>
            {priority.label}
          </span>
          <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${status.color}`}>
            {status.icon} {slot.status.replace('_', ' ')}
          </span>
        </div>
        <span className="text-xs text-gray-400">
          {slot.scheduledDate} {slot.startTime && `• ${slot.startTime}`}
        </span>
      </div>

      {/* Title and activity */}
      <div className="flex items-start gap-2 mb-2">
        <span className="text-lg mt-0.5">{activity.icon}</span>
        <div>
          <h4 className={`text-sm font-semibold ${isCompleted ? 'text-emerald-600 dark:text-emerald-400 line-through' : 'text-gray-900 dark:text-gray-100'}`}>
            {slot.title}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {subjectName} • {slot.durationMinutes} min • Rev #{slot.revisionNumber}
          </p>
        </div>
      </div>

      {/* Readiness indicator */}
      {readinessGap !== undefined && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] text-gray-400">Readiness gap:</span>
          <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                readinessGap > 50 ? 'bg-red-400' : readinessGap > 30 ? 'bg-amber-400' : 'bg-green-400'
              }`}
              style={{ width: `${readinessGap}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-400 w-8 text-right">{readinessGap}%</span>
        </div>
      )}

      {/* Description */}
      {slot.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
          {slot.description}
        </p>
      )}

      {/* Weak topics badge */}
      {slot.metadata?.weakTopics?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {slot.metadata.weakTopics.slice(0, 3).map((topicId, idx) => (
            <span key={idx} className="px-1.5 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] rounded">
              ⚠️ Weak Topic
            </span>
          ))}
        </div>
      )}

      {/* Completion notes display */}
      {isCompleted && slot.notes && (
        <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-lg p-2 mb-3">
          <p className="text-xs text-emerald-700 dark:text-emerald-300 italic">
            📝 {slot.notes}
          </p>
        </div>
      )}

      {/* Actions */}
      {isPending && (
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={() => setShowNotes(true)}
            className="flex-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg transition-colors"
          >
            ✅ Complete
          </button>
          <button
            onClick={handleSkip}
            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-lg transition-colors"
          >
            ⏭️ Skip
          </button>
        </div>
      )}

      {/* Notes Input Modal */}
      {showNotes && (
        <div className="absolute inset-0 bg-white dark:bg-gray-800 rounded-xl border border-emerald-300 dark:border-emerald-600 p-4 shadow-xl z-10 flex flex-col">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            ✅ Complete: {slot.title}
          </h4>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional: add notes about what you reviewed..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 mb-2 focus:ring-2 focus:ring-emerald-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleComplete}
              className="flex-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg transition-colors"
            >
              Save & Complete
            </button>
            <button
              onClick={() => { setShowNotes(false); setNotes(''); }}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
