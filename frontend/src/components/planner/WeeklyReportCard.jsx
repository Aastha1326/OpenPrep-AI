import { useState } from 'react';

export default function WeeklyReportCard({ report, isExpanded, onToggle }) {
  const [showDetails, setShowDetails] = useState(isExpanded || false);

  const completionRate = report.goalCompletionRate || 0;
  const totalHours = Math.round((report.totalStudyMinutes || 0) / 60 * 10) / 10;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center gap-3">
          <div className="text-lg">📊</div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
              Week of {formatDate(report.weekStart)}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {report.goalsCompleted}/{report.goalsSet} goals completed • {totalHours}h studied
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span
              className={`text-lg font-bold ${
                completionRate >= 80
                  ? 'text-emerald-500'
                  : completionRate >= 50
                  ? 'text-amber-500'
                  : 'text-red-500'
              }`}
            >
              {completionRate}%
            </span>
          </div>
          <span className="text-gray-400 text-sm">{showDetails ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="px-5 pb-3">
        <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span>🔥 {report.streakDays || 0} active days</span>
          <span>📝 {report.quizzesTaken || 0} quizzes</span>
          <span>🃏 {report.flashcardsReviewed || 0} cards reviewed</span>
        </div>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="border-t border-gray-100 dark:border-gray-700 px-5 py-4 space-y-4">
          {/* Daily Breakdown Mini Chart */}
          {report.dailyBreakdown && report.dailyBreakdown.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                Daily Activity
              </h4>
              <div className="flex items-end gap-1 h-16">
                {report.dailyBreakdown.map((day, idx) => {
                  const maxVal = Math.max(
                    ...report.dailyBreakdown.map((d) => d.totalValue || 0),
                    1
                  );
                  const height = Math.max(2, (day.totalValue / maxVal) * 100);
                  const hasActivity = day.entriesCount > 0;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className={`w-full rounded-t ${
                          hasActivity ? 'bg-blue-400 dark:bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                        style={{ height: `${height}%` }}
                        title={`${day.date}: ${day.totalValue} units, ${day.studyMinutes}min`}
                      />
                      <span className="text-[9px] text-gray-400">
                        {day.date.slice(-2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Strengths & Improvements */}
          <div className="grid grid-cols-2 gap-3">
            {/* Strengths */}
            <div>
              <h4 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-2">
                💪 Strengths
              </h4>
              {report.strengths && report.strengths.length > 0 ? (
                <ul className="space-y-1">
                  {report.strengths.map((s, idx) => (
                    <li key={idx} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1">
                      <span className="text-emerald-500 mt-0.5">✓</span>
                      <span>{s.title}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-400 italic">No completed goals this week</p>
              )}
            </div>

            {/* Improvements */}
            <div>
              <h4 className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-2">
                📈 To Improve
              </h4>
              {report.improvements && report.improvements.length > 0 ? (
                <ul className="space-y-1">
                  {report.improvements.map((imp, idx) => (
                    <li key={idx} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1">
                      <span className="text-amber-500 mt-0.5">→</span>
                      <span>
                        {imp.title} ({imp.progress}%)
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-400 italic">No pending goals</p>
              )}
            </div>
          </div>

          {/* AI Insight */}
          {report.aiInsight && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">🤖</span>
                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                  {report.aiInsight}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
