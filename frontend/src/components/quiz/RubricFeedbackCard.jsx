import React from 'react';

/**
 * RubricFeedbackCard Component
 * Displays numerical score breakdown, 4-part rubric progress bars,
 * missing technical keywords highlights, strengths, and line-by-line feedback suggestions.
 */
export default function RubricFeedbackCard({ evaluation }) {
  if (!evaluation) return null;

  const {
    score = 0,
    maxScore = 10,
    rubricScores = {},
    keyStrengths = [],
    missingKeywords = [],
    feedback = '',
    lineByLineSuggestions = [],
    isOffTopic = false,
  } = evaluation;

  const scorePercentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  // Determine badge color theme based on score percentage
  let scoreTheme = {
    bg: 'bg-red-500/10 border-red-500/30 text-red-400',
    bar: 'bg-red-500',
    label: 'Needs Improvement',
  };
  if (scorePercentage >= 80) {
    scoreTheme = {
      bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      bar: 'bg-emerald-500',
      label: 'Excellent',
    };
  } else if (scorePercentage >= 50) {
    scoreTheme = {
      bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      bar: 'bg-amber-500',
      label: 'Good / Partial Credit',
    };
  }

  // Standard 4 rubric dimensions (defaulting max points to 3, 3, 2, 2 if not explicitly passed)
  const rubricDimensions = [
    {
      key: 'conceptualAccuracy',
      title: 'Conceptual Accuracy',
      score: rubricScores.conceptualAccuracy ?? 0,
      max: 3,
    },
    {
      key: 'completeness',
      title: 'Completeness',
      score: rubricScores.completeness ?? 0,
      max: 3,
    },
    {
      key: 'keyTerminology',
      title: 'Key Terminology',
      score: rubricScores.keyTerminology ?? 0,
      max: 2,
    },
    {
      key: 'clarity',
      title: 'Clarity & Structure',
      score: rubricScores.clarity ?? 0,
      max: 2,
    },
  ];

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md transition-all duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <span>✨</span> AI Rubric Evaluation Breakdown
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Graded against ideal model solution using 4-part criterion matrix
          </p>
        </div>

        {/* Numerical Score Pill */}
        <div className={`px-5 py-2.5 rounded-xl border font-semibold flex items-center gap-3 ${scoreTheme.bg}`}>
          <div className="text-2xl font-extrabold tracking-tight">
            {score} <span className="text-sm font-normal text-slate-400">/ {maxScore}</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-xs uppercase tracking-wider font-bold">{scoreTheme.label}</span>
            <span className="text-[10px] opacity-80">{scorePercentage}% Score</span>
          </div>
        </div>
      </div>

      {/* Off-Topic Warning Alert */}
      {isOffTopic && (
        <div className="mt-4 p-4 rounded-xl bg-red-900/30 border border-red-700/50 text-red-200 text-sm flex items-start gap-3">
          <span className="text-lg">⚠️</span>
          <div>
            <strong className="font-semibold">Answer Insufficient or Off-Topic:</strong>
            <p className="text-xs text-red-300 mt-0.5">
              The submitted response did not meet the minimum requirements or topic relevance. Please review the ideal answer.
            </p>
          </div>
        </div>
      )}

      {/* 4-Part Rubric Progress Bars */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {rubricDimensions.map((dim) => {
          const pct = dim.max > 0 ? Math.min(100, Math.round((dim.score / dim.max) * 100)) : 0;
          return (
            <div key={dim.key} className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="font-medium text-slate-300">{dim.title}</span>
                <span className="font-mono text-slate-400">
                  {dim.score} / {dim.max} pts
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Strengths & Missing Keywords Tags */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Key Strengths */}
        <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800">
          <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <span>👍</span> Key Strengths
          </h4>
          {keyStrengths.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {keyStrengths.map((str, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 text-xs rounded-lg bg-emerald-950/60 border border-emerald-800/50 text-emerald-300"
                >
                  {str}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No specific strengths highlighted.</p>
          )}
        </div>

        {/* Missing Keywords */}
        <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800">
          <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <span>🔍</span> Missing Technical Keywords
          </h4>
          {missingKeywords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {missingKeywords.map((kw, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 text-xs rounded-lg bg-amber-950/60 border border-amber-800/50 text-amber-300 font-mono"
                >
                  + {kw}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">All key terms covered!</p>
          )}
        </div>
      </div>

      {/* AI Qualitative Feedback */}
      {feedback && (
        <div className="mt-6 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
          <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span>💡</span> Examiner's Assessment
          </h4>
          <p className="text-sm text-slate-300 leading-relaxed">{feedback}</p>
        </div>
      )}

      {/* Line-by-line Improvement Suggestions */}
      {lineByLineSuggestions.length > 0 && (
        <div className="mt-6 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
          <h4 className="text-xs font-semibold text-sky-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <span>📝</span> Actionable Improvement Suggestions
          </h4>
          <ul className="space-y-2">
            {lineByLineSuggestions.map((sug, idx) => (
              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 leading-normal">
                <span className="text-sky-400 font-bold">•</span>
                <span className="font-mono text-slate-300">{sug}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
