import React from 'react';
import {
  BookOpen,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronRight,
} from 'lucide-react';

const getSubjectColor = (avgScore) => {
  if (avgScore >= 70) return { ring: 'ring-emerald-400', bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' };
  if (avgScore >= 45) return { ring: 'ring-amber-400', bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' };
  return { ring: 'ring-red-400', bar: 'bg-red-500', text: 'text-red-600 dark:text-red-400' };
};

const SubjectBreakdown = ({ subjects = [], onSelectSubject }) => {
  if (!subjects || subjects.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          <BookOpen className="w-5 h-5 inline mr-2" />
          Subject Breakdown
        </h3>
        <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
          <p className="text-sm">No subjects found. Add subjects to see breakdown.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        <BookOpen className="w-5 h-5 inline mr-2" />
        Subject Breakdown
      </h3>

      <div className="space-y-3">
        {subjects.map((subject) => {
          const color = getSubjectColor(subject.avgScore);

          return (
            <button
              key={subject.subjectId}
              onClick={() => onSelectSubject?.(subject.subjectId)}
              className="w-full text-left rounded-lg border border-gray-100 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {subject.subjectName}
                </h4>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${color.text}`}>
                    {subject.avgScore}%
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${color.bar}`}
                  style={{ width: `${Math.min(100, subject.avgScore)}%` }}
                />
              </div>

              {/* Topic stats */}
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {subject.totalTopics} topic{subject.totalTopics !== 1 ? 's' : ''}
                </span>
                {subject.weakTopics > 0 && (
                  <span className="flex items-center gap-1 text-red-500">
                    <XCircle className="w-3 h-3" />
                    {subject.weakTopics} weak
                  </span>
                )}
                {subject.weakTopics === 0 && subject.totalTopics > 0 && (
                  <span className="flex items-center gap-1 text-emerald-500">
                    <CheckCircle className="w-3 h-3" />
                    All covered
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SubjectBreakdown;
