import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import GlassCard from '../GlassCard';

const TargetExamOverviewWidget = ({ onOpenBundleModal, onGenerateStudyPlan }) => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await API.get('/progress/composite-overview');
      if (res.data && res.data.success) {
        setOverview(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load target exam overview', err);
      setError('Unable to load exam overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  if (loading) {
    return (
      <GlassCard className="p-6 mb-6 animate-pulse">
        <div className="h-6 bg-amber-500/20 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-amber-500/10 rounded w-full mb-2"></div>
        <div className="h-4 bg-amber-500/10 rounded w-2/3"></div>
      </GlassCard>
    );
  }

  if (!overview) {
    return (
      <GlassCard className="p-6 mb-6 border border-amber-500/30 bg-black/40 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-amber-300 flex items-center gap-2">
              🎯 Multi-Subject Target Exam Bundle
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              Combine multiple subjects (e.g. JEE, NEET, SAT, GRE) into a unified exam goal with custom weightages.
            </p>
          </div>
          <button
            onClick={onOpenBundleModal}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold rounded-lg shadow-lg transition-all transform hover:-translate-y-0.5 whitespace-nowrap"
          >
            + Create Exam Bundle
          </button>
        </div>
      </GlassCard>
    );
  }

  const { examName, targetExamType, isBundle, cumulativeProgress, subjects } = overview;

  return (
    <GlassCard className="p-6 mb-6 border border-amber-500/40 bg-gradient-to-br from-stone-900/90 via-black/80 to-stone-900/90 backdrop-blur-md shadow-2xl relative overflow-hidden">
      {/* Decorative accent glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header section */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-amber-500/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <h3 className="text-2xl font-bold text-amber-200 tracking-tight">{examName}</h3>
            {isBundle && (
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full">
                Composite Bundle ({targetExamType})
              </span>
            )}
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Cumulative weighted progress across all bundled subjects ({subjects?.length || 0} subjects)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenBundleModal}
            className="px-3.5 py-1.5 bg-stone-800/80 hover:bg-stone-700 text-amber-300 border border-amber-500/30 text-xs font-medium rounded-lg transition-all"
          >
            ⚙️ Manage Bundle
          </button>
          <button
            onClick={() => onGenerateStudyPlan && onGenerateStudyPlan(overview.examId)}
            className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black text-xs font-bold rounded-lg shadow-md transition-all"
          >
            📅 Interleaved AI Study Plan
          </button>
        </div>
      </div>

      {/* Cumulative Weighted Progress Bar */}
      <div className="mt-5">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
            Cumulative Syllabus Progress
          </span>
          <span className="text-lg font-bold text-amber-300">{cumulativeProgress}%</span>
        </div>
        <div className="w-full h-3 bg-stone-800 rounded-full overflow-hidden p-0.5 border border-amber-500/20">
          <div
            className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400 rounded-full transition-all duration-700 shadow-lg shadow-amber-500/30"
            style={{ width: `${Math.min(100, Math.max(0, cumulativeProgress))}%` }}
          ></div>
        </div>
      </div>

      {/* Subject Weightages Breakdown Grid */}
      {subjects && subjects.length > 0 && (
        <div className="mt-6">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Bundled Subject Weightages & Progress
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {subjects.map((sub) => (
              <div
                key={sub.id}
                className="p-3 bg-black/40 border border-amber-500/15 rounded-xl hover:border-amber-500/30 transition-all"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-sm text-stone-200 truncate">{sub.name}</span>
                  <span className="text-xs font-bold px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded border border-amber-500/20">
                    {sub.weightage}% weight
                  </span>
                </div>

                <div className="flex justify-between text-xs text-slate-400 mb-2">
                  <span>{sub.topicCount} topics</span>
                  <span className="font-medium text-amber-300">{sub.progressPercentage}%</span>
                </div>

                <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${sub.progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
};

export default TargetExamOverviewWidget;
