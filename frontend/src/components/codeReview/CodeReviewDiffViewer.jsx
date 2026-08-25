import React from 'react';
import { Code2, CheckCircle, AlertTriangle, Info, Zap } from 'lucide-react';
import ComplexityMetricsCard from './ComplexityMetricsCard';

const CodeReviewDiffViewer = ({ report, originalCode }) => {
  if (!report) return null;

  const { metrics, suggestions, qualityScore } = report;

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 60) return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
    return 'text-red-400 border-red-500/30 bg-red-500/10';
  };

  return (
    <div className="bg-gray-900/60 p-6 rounded-3xl border border-gray-800 backdrop-blur-xl space-y-6">
      {/* Header & Quality Score */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Code2 className="text-blue-400" size={24} />
            AI Code Review & Structural Analysis
          </h3>
          <p className="text-xs text-gray-400">
            AST-level complexity profiling and automated algorithmic feedback
          </p>
        </div>

        <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2 ${getScoreColor(qualityScore)}`}>
          <Zap size={18} />
          <span className="font-extrabold text-sm">Quality Score: {qualityScore}/100</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <ComplexityMetricsCard metrics={metrics} />

      {/* Feedback Suggestions */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider">Review Findings & Recommendations</h4>
        <div className="space-y-2">
          {suggestions.map((item, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border flex items-start gap-3 text-xs leading-relaxed ${
                item.severity === 'WARNING'
                  ? 'bg-yellow-500/5 border-yellow-500/20 text-yellow-200'
                  : item.severity === 'SUCCESS'
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-200'
                  : 'bg-blue-500/5 border-blue-500/20 text-blue-200'
              }`}
            >
              {item.severity === 'WARNING' && <AlertTriangle size={16} className="text-yellow-400 shrink-0 mt-0.5" />}
              {item.severity === 'SUCCESS' && <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />}
              {item.severity === 'INFO' && <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />}
              <div>
                <span className="font-bold mr-1.5 uppercase text-[10px] px-1.5 py-0.5 rounded bg-gray-900/80">
                  {item.type}
                </span>
                {item.message}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CodeReviewDiffViewer;
