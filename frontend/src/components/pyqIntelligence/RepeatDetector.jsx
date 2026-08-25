import React from 'react';
import { Repeat, Copy, Calendar, AlertTriangle } from 'lucide-react';

const RepeatDetector = ({ repeats }) => {
  if (!repeats || !repeats.repeatedGroups || repeats.repeatedGroups.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          <Repeat className="w-5 h-5 inline mr-2" />
          Question Repeat Detection
        </h3>
        <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <Copy className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No repeated questions detected</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          <Repeat className="w-5 h-5 inline mr-2" />
          Question Repeat Detection
        </h3>
        <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 font-medium">
          {repeats.repeatedGroups.length} repeated patterns found
        </span>
      </div>

      {/* Summary */}
      {repeats.summary?.mostRepeated && (
        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Most Repeated Question</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                "{repeats.summary.mostRepeated.question}" — appeared {repeats.summary.mostRepeated.appearances}x in years {repeats.summary.mostRepeated.years.join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {repeats.repeatedGroups.map((group, index) => (
          <div
            key={index}
            className="p-4 rounded-lg border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{group.chapterName}</span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{group.topicName}</span>
                </div>
                <p className="text-sm text-gray-900 dark:text-white line-clamp-2">{group.questionText}</p>
              </div>
              <span className={`flex-shrink-0 ml-3 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                group.appearances >= 3
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
              }`}>
                {group.appearances}x repeated
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-2">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Years: {group.years.join(', ')}
              </span>
              <span>{group.marks} marks</span>
              <span>Confidence: {group.confidence}%</span>
            </div>

            {/* Year badges */}
            <div className="flex flex-wrap gap-1 mt-2">
              {group.years.map((year) => (
                <span key={year} className="px-1.5 py-0.5 text-[10px] rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-mono">
                  {year}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RepeatDetector;
