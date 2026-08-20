import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle2, Clock, Target, Sliders, Loader2, BookOpen } from 'lucide-react';
import ReadinessVelocityChart from './ReadinessVelocityChart';
import API from '../../services/api';

/**
 * ExamReadinessPredictor Component
 * Interactive readiness predictor featuring:
 * - Current readiness vs Target goal vs Projected readiness trajectory
 * - Dynamic Daily Study Hours slider (1 - 8 hrs/day) recalculating score projections
 * - Target Score at Risk alert badge
 * - Top 3 high-weightage topic recommendations to close score gap
 * - Insufficient attempt data fallback state (< 3 attempts)
 */
export default function ExamReadinessPredictor() {
  const [dailyHours, setDailyHours] = useState(3);
  const [targetScore, setTargetScore] = useState(85);
  const [projection, setProjection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProjection();
  }, [dailyHours, targetScore]);

  const fetchProjection = async () => {
    try {
      setLoading(true);
      const res = await API.get('/dashboard/readiness-projection', {
        params: {
          dailyHours,
          targetScore,
        },
      });
      setProjection(res.data?.data || res.data);
      setError('');
    } catch (err) {
      console.warn('Failed to fetch readiness projection:', err);
      setError('Could not calculate readiness trajectory. Using cached estimates.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !projection) {
    return (
      <div className="p-8 bg-[#FFFBE9] dark:bg-[#16120E] rounded-3xl border border-[#CEAB93]/60 dark:border-[#412D15] flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-2" />
        <p className="text-xs font-semibold text-slate-400">Modeling exam readiness trajectory & historical score velocity...</p>
      </div>
    );
  }

  // Insufficient Attempt Data Edge Case (< 3 attempts)
  if (projection?.insufficientData) {
    return (
      <div className="p-6 bg-[#FFFBE9] dark:bg-[#16120E] rounded-3xl border border-[#CEAB93]/60 dark:border-[#412D15] text-[#1F150C] dark:text-[#E1DCC9] space-y-4">
        <div className="flex items-center gap-2 border-b border-[#CEAB93]/30 pb-3">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-bold font-playfair">AI Exam Readiness Predictor</h3>
        </div>

        <div className="p-6 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-center space-y-3">
          <Clock className="w-8 h-8 text-amber-500 mx-auto" />
          <h4 className="text-sm font-bold text-amber-700 dark:text-amber-300">
            {projection.message || 'Insufficient attempt data to model projection.'}
          </h4>
          <p className="text-xs text-[#8C6A53] dark:text-[#C4BA9D]">
            Completed {projection.currentAttemptCount || 0} of {projection.minimumAttemptsRequired || 3} required quiz attempts. Complete more quizzes to unlock your historical score velocity & projected exam score trajectory.
          </p>
        </div>
      </div>
    );
  }

  const isAtRisk = projection?.status === 'AT_RISK';

  return (
    <div className="p-6 bg-[#FFFBE9] dark:bg-[#16120E] rounded-3xl border border-[#CEAB93]/60 dark:border-[#412D15] shadow-sm text-[#1F150C] dark:text-[#E1DCC9] space-y-6 font-inter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#CEAB93]/30 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-bold font-playfair">AI Diagnostic Exam Readiness Predictor</h2>
          </div>
          <p className="text-xs text-[#8C6A53] dark:text-[#C4BA9D] mt-0.5">
            Predictive score model with historical velocity trajectory & interactive daily study hours simulator.
          </p>
        </div>

        {/* Risk Status Badge */}
        {projection && (
          <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
              isAtRisk
                ? 'bg-red-500/10 border-red-500/40 text-red-500 dark:text-red-400 animate-pulse'
                : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {isAtRisk ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{projection.statusLabel || (isAtRisk ? 'Target Score at Risk' : 'On Track')}</span>
          </div>
        )}
      </div>

      {/* Metrics Row Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-[#251D17] rounded-2xl border border-[#CEAB93]/40 dark:border-[#412D15]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6A53] dark:text-[#C4BA9D]">Current Readiness</span>
          <div className="text-3xl font-extrabold font-playfair text-indigo-600 dark:text-indigo-400 mt-1">
            {projection?.currentReadiness || 0}%
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">Weighted recent accuracy</span>
        </div>

        <div className="p-4 bg-white dark:bg-[#251D17] rounded-2xl border border-[#CEAB93]/40 dark:border-[#412D15]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6A53] dark:text-[#C4BA9D]">Target Goal</span>
          <div className="text-3xl font-extrabold font-playfair text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
            <Target className="w-5 h-5 text-amber-500 inline" /> {targetScore}%
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">Desired exam score</span>
        </div>

        <div className="p-4 bg-white dark:bg-[#251D17] rounded-2xl border border-[#CEAB93]/40 dark:border-[#412D15]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6A53] dark:text-[#C4BA9D]">Projected Exam Score</span>
          <div className={`text-3xl font-extrabold font-playfair mt-1 ${isAtRisk ? 'text-red-500' : 'text-emerald-500'}`}>
            {projection?.projectedScore || 0}%
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">
            {projection?.daysRemaining || 30} days remaining ({projection?.dailyHours || 2}h/day)
          </span>
        </div>
      </div>

      {/* Simulator Controls */}
      <div className="p-4 bg-white dark:bg-[#251D17] rounded-2xl border border-[#CEAB93]/40 dark:border-[#412D15] space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <Sliders className="w-4 h-4" /> Study Intensity Simulator ({dailyHours} hrs/day)
          </label>
          <span className="text-xs font-bold font-mono text-indigo-500">
            {dailyHours > 2 ? `+${((dailyHours - 2) * 2.5).toFixed(1)}% score bump` : dailyHours < 2 ? `-${((2 - dailyHours) * 2.5).toFixed(1)}% score impact` : 'Baseline (2h/day)'}
          </span>
        </div>

        <div className="space-y-2">
          <input
            type="range"
            min="1"
            max="8"
            step="0.5"
            value={dailyHours}
            onChange={(e) => setDailyHours(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>1 hr/day (Casual)</span>
            <span>4 hrs/day (Intense)</span>
            <span>8 hrs/day (Sprint)</span>
          </div>
        </div>
      </div>

      {/* Recharts Line Chart */}
      {projection?.trajectoryPoints && (
        <ReadinessVelocityChart trajectoryPoints={projection.trajectoryPoints} targetScore={targetScore} />
      )}

      {/* Top 3 Recommended Topics */}
      {projection?.recommendedTopics && projection.recommendedTopics.length > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" /> Recommended High-Weightage Topics to Close Gap
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {projection.recommendedTopics.map((top, idx) => (
              <div key={idx} className="p-3 bg-white dark:bg-[#251D17] rounded-xl border border-[#CEAB93]/30 text-xs space-y-1">
                <div className="font-bold text-slate-200 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                  <span className="truncate">{top.name}</span>
                </div>
                <div className="text-[10px] font-mono text-emerald-500 font-semibold">{top.scoreBumpPotential}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
