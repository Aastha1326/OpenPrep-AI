import React, { useState, useEffect } from 'react';
import { Clock, ShieldAlert, BookOpen, Flag, CheckCircle2, ArrowRight, Loader, Zap } from 'lucide-react';
import api from '../../services/api';
import AbilityTrajectoryGraph from './AbilityTrajectoryGraph';

const AdaptiveExamRunner = ({ subjectId = 'general', onExamFinish }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [flagged, setFlagged] = useState(false);
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [scoreReport, setScoreReport] = useState(null);
  const [error, setError] = useState('');
  const [convergenceMetrics, setConvergenceMetrics] = useState(null);

  // Start CAT Session on mount
  useEffect(() => {
    startExam();
  }, [subjectId]);

  // Timer loop
  useEffect(() => {
    if (!session || session.isCompleted) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [session]);

  const startExam = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/adaptive-exams/start', { subjectId, totalQuestions: 15 });
      if (res.data && res.data.success) {
        setSession(res.data.data);
        setConvergenceMetrics(res.data.data.convergenceMetrics);
      }
    } catch (err) {
      console.error('Error starting adaptive exam:', err);
      setError(err.response?.data?.error || 'Failed to start adaptive exam session.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (selectedOption === null || !session) return;

    setSubmitting(true);
    try {
      const res = await api.post(`/adaptive-exams/${session.sessionId}/submit-answer`, {
        questionId: session.currentQuestion.id,
        selectedOptionIndex: selectedOption,
        timeSpentSeconds: timerSeconds,
      });

      if (res.data && res.data.success) {
        const payload = res.data.data;
        if (payload.isCompleted) {
          setScoreReport(payload.scoreReport);
          if (onExamFinish) onExamFinish(payload.scoreReport);
        } else {
          setSession((prev) => ({
            ...prev,
            currentStep: payload.currentStep,
            currentTheta: payload.newTheta,
            currentQuestion: payload.nextQuestion,
          }));
          if (payload.convergenceMetrics) {
            setConvergenceMetrics(payload.convergenceMetrics);
          }
          setSelectedOption(null);
          setTimerSeconds(0);
          setFlagged(false);
        }
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
      setError(err.response?.data?.error || 'Error submitting answer.');
    } finally {
      setSubmitting(false);
    }
  };

  // Render convergence indicator gauge
  const renderConvergenceGauge = () => {
    if (!convergenceMetrics) return null;
    
    const { standardError, targetSE, converged } = convergenceMetrics;
    const currentSE = standardError || 3.0;
    const maxSE = 3.0;
    const sePercent = Math.max(0, (maxSE - Math.min(currentSE, maxSE)) / maxSE) * 100;

    return (
      <div className="bg-neutral-950/60 border border-neutral-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-stone-300">
            <span>Measurement Precision (Standard Error)</span>
          </div>
          <div className={`px-2 py-1 rounded text-[10px] font-bold ${
            converged 
              ? 'bg-emerald-500/20 text-emerald-300' 
              : 'bg-amber-500/20 text-amber-300'
          }`}>
            {converged ? '✓ Converged' : 'Converging...'}
          </div>
        </div>
        
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-400">Current SE</span>
            <span className="font-mono font-bold text-indigo-300">{currentSE.toFixed(3)}</span>
          </div>
          <div className="w-full bg-neutral-900/50 rounded-full h-2 overflow-hidden border border-neutral-800">
            <div
              className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full transition-all duration-500"
              style={{ width: `${Math.min(sePercent, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>High Uncertainty</span>
            <span>Target: SE &lt; {targetSE}</span>
          </div>
        </div>

        {convergenceMetrics.confidenceInterval && (
          <div className="pt-2 border-t border-neutral-800">
            <div className="text-[10px] text-stone-400 mb-2">95% Confidence Interval</div>
            <div className="flex items-center justify-between text-xs font-mono text-stone-300">
              <span>[{convergenceMetrics.confidenceInterval.lower.toFixed(2)}</span>
              <span>θ = {session?.currentTheta?.toFixed(2) || '0.00'}</span>
              <span>{convergenceMetrics.confidenceInterval.upper.toFixed(2)}]</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render ability gauge with slider
  const renderAbilityGauge = () => {
    if (!session) return null;
    
    const theta = session.currentTheta || 0;
    const gaugePercent = ((theta + 3.0) / 6.0) * 100;
    
    const abilityLevel =
      theta >= 1.5 ? 'Advanced'
      : theta >= 0.5 ? 'Proficient'
      : theta >= -0.5 ? 'Intermediate'
      : theta >= -1.5 ? 'Developing'
      : 'Emerging';

    const abilityColor =
      theta >= 1.5 ? 'text-emerald-400'
      : theta >= 0.5 ? 'text-cyan-400'
      : theta >= -0.5 ? 'text-amber-400'
      : theta >= -1.5 ? 'text-orange-400'
      : 'text-rose-400';

    return (
      <div className="bg-neutral-950/60 border border-neutral-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-stone-300">Proficiency Estimate</div>
          <div className={`text-sm font-bold ${abilityColor}`}>{abilityLevel}</div>
        </div>
        
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-400">Ability (θ)</span>
            <span className={`font-mono font-bold ${abilityColor}`}>
              {theta > 0 ? '+' : ''}{theta.toFixed(2)}
            </span>
          </div>
          
          <div className="relative w-full bg-neutral-900/50 rounded-full h-3 overflow-hidden border border-neutral-800">
            <div className="absolute inset-0 flex items-center">
              <div className="absolute left-1/2 w-1 h-full bg-neutral-700 opacity-50" />
            </div>
            <div
              className="bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 h-full transition-all duration-300"
              style={{ width: `${Math.min(Math.max(gaugePercent, 0), 100)}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2 h-5 bg-indigo-400 rounded shadow-lg transition-all duration-300 border border-indigo-300"
              style={{ left: `${Math.min(Math.max(gaugePercent, 0), 100)}%`, marginLeft: '-4px' }}
            />
          </div>
          
          <div className="flex items-center justify-between text-[10px] text-stone-500">
            <span>−3.0 (Very Easy)</span>
            <span>+3.0 (Very Hard)</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-neutral-900 border border-neutral-800 rounded-3xl text-stone-300">
        <Loader className="w-8 h-8 animate-spin text-indigo-400 mb-3" />
        <span className="text-sm font-semibold">Calibrating IRT Ability Baseline...</span>
      </div>
    );
  }

  if (scoreReport) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div>
            <h2 className="text-stone-100 font-extrabold text-lg font-playfair flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Adaptive Exam Performance Diagnostic Report
            </h2>
            <p className="text-stone-400 text-xs mt-0.5 font-sans">Computer Adaptive Testing (CAT) 3PL IRT Analysis</p>
          </div>
          <div className="bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-2xl text-right">
            <div className="text-[10px] text-indigo-300 uppercase font-bold tracking-wider">Candidate Percentile</div>
            <div className="text-2xl font-black text-indigo-400 font-mono">{scoreReport.percentile}th</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-neutral-950/60 border border-neutral-800 rounded-2xl p-4">
            <div className="text-stone-400 text-xs">Final Ability (θ)</div>
            <div className="text-xl font-bold font-mono text-indigo-400 mt-1">{scoreReport.finalTheta > 0 ? `+${scoreReport.finalTheta}` : scoreReport.finalTheta}</div>
            <div className="text-[10px] text-stone-500 mt-1">EAP: {scoreReport.eapTheta > 0 ? `+${scoreReport.eapTheta}` : scoreReport.eapTheta}</div>
          </div>
          <div className="bg-neutral-950/60 border border-neutral-800 rounded-2xl p-4">
            <div className="text-stone-400 text-xs">Standard Error</div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{scoreReport.standardError?.toFixed(3) || 'N/A'}</div>
            <div className={`text-[10px] mt-1 ${scoreReport.convergenceReport?.converged ? 'text-emerald-300' : 'text-amber-300'}`}>
              {scoreReport.convergenceReport?.converged ? '✓ Converged' : 'In Progress'}
            </div>
          </div>
          <div className="bg-neutral-950/60 border border-neutral-800 rounded-2xl p-4">
            <div className="text-stone-400 text-xs">Accuracy</div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{scoreReport.accuracyPct}%</div>
            <div className="text-[10px] text-stone-500 mt-1">{scoreReport.totalCorrect}/{scoreReport.totalAnswered}</div>
          </div>
          <div className="bg-neutral-950/60 border border-neutral-800 rounded-2xl p-4">
            <div className="text-stone-400 text-xs">Performance Level</div>
            <div className="text-xl font-bold font-mono text-amber-400 mt-1 text-sm">{scoreReport.performanceRating}</div>
          </div>
        </div>

        {scoreReport.confidenceInterval && (
          <div className="bg-neutral-950/60 border border-neutral-800 rounded-2xl p-4">
            <div className="text-xs font-semibold text-stone-300 mb-2">95% Confidence Interval</div>
            <div className="flex items-center justify-center gap-4 font-mono text-sm text-stone-200">
              <span className="text-stone-400">[{scoreReport.confidenceInterval.lower.toFixed(2)}</span>
              <div className="flex-1 h-1 bg-indigo-500/30 relative rounded">
                <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-4 bg-indigo-400" />
              </div>
              <span className="text-stone-400">{scoreReport.confidenceInterval.upper.toFixed(2)}]</span>
            </div>
          </div>
        )}

        <AbilityTrajectoryGraph trajectory={scoreReport.trajectory} />
      </div>
    );
  }

  const currentQ = session?.currentQuestion;
  const difficultyBadge =
    currentQ?.difficulty >= 1.0
      ? { label: 'High Difficulty', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' }
      : currentQ?.difficulty >= -0.5
      ? { label: 'Medium Difficulty', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' }
      : { label: 'Low Difficulty', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };

  return (
    <div className="space-y-4">
      {/* Real-time Ability & Convergence Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderAbilityGauge()}
        {renderConvergenceGauge()}
      </div>

      {/* Main Question Container */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-indigo-600 text-white rounded-xl text-xs font-bold font-mono">
              Question {session?.currentStep} / {session?.totalQuestions}
            </span>
            <span className={`px-3 py-1 border rounded-xl text-xs font-bold ${difficultyBadge.color}`}>
              {difficultyBadge.label} ({currentQ?.difficulty > 0 ? `+${currentQ?.difficulty}` : currentQ?.difficulty})
            </span>
            {convergenceMetrics?.converged && (
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <Zap className="w-3 h-3" />
                Converged
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowFormulaModal(true)}
              className="flex items-center gap-1.5 text-xs text-stone-300 bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-indigo-400" />
              Formula Sheet
            </button>
            <div className="flex items-center gap-1.5 bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-800 text-xs font-mono font-bold text-stone-200">
              <Clock className="w-4 h-4 text-amber-400" />
              {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Question Body */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-stone-100 font-semibold text-base leading-relaxed">{currentQ?.question}</h3>
            <button
              onClick={() => setFlagged(!flagged)}
              className={`p-2 rounded-xl transition-all cursor-pointer flex-shrink-0 ${flagged ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-neutral-800 text-stone-400 hover:text-stone-200'}`}
            >
              <Flag className="w-4 h-4" />
            </button>
          </div>

          {/* Options Grid */}
          <div className="space-y-2.5 pt-2">
            {currentQ?.options?.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedOption(idx)}
                className={`w-full text-left p-4 rounded-2xl border transition-all text-xs font-medium cursor-pointer flex items-center justify-between ${
                  selectedOption === idx
                    ? 'bg-indigo-600/15 border-indigo-500 text-stone-100 shadow-md'
                    : 'bg-neutral-950/60 border-neutral-800 text-stone-300 hover:border-neutral-700'
                }`}
              >
                <span>{opt}</span>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedOption === idx ? 'border-indigo-400 bg-indigo-500' : 'border-neutral-700'}`}>
                  {selectedOption === idx && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer Controls */}
        <div className="flex justify-end pt-2 border-t border-neutral-800">
          <button
            onClick={handleSubmitAnswer}
            disabled={selectedOption === null || submitting}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 text-white text-xs font-bold rounded-2xl transition-all shadow-lg flex items-center gap-2 cursor-pointer"
          >
            {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            {submitting ? 'Adapting Difficulty...' : 'Submit & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdaptiveExamRunner;
