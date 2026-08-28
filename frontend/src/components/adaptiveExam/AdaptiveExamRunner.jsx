import React, { useState, useEffect } from 'react';
import { Clock, ShieldAlert, BookOpen, Flag, CheckCircle2, ArrowRight, Loader } from 'lucide-react';
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
      const res = await api.post('/adaptive-exams/start', { subjectId, totalQuestions: 10 });
      if (res.data && res.data.success) {
        setSession(res.data.data);
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
            <div className="text-2xl font-black text-indigo-400 font-mono">{scoreReport.percentile}th Percentile</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-neutral-950/60 border border-neutral-800 rounded-2xl p-4">
            <div className="text-stone-400 text-xs">Final Ability Estimate (θ)</div>
            <div className="text-xl font-bold font-mono text-stone-100 mt-1">{scoreReport.finalTheta > 0 ? `+${scoreReport.finalTheta}` : scoreReport.finalTheta}</div>
          </div>
          <div className="bg-neutral-950/60 border border-neutral-800 rounded-2xl p-4">
            <div className="text-stone-400 text-xs">Overall Accuracy</div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{scoreReport.accuracyPct}% ({scoreReport.totalCorrect}/{scoreReport.totalAnswered})</div>
          </div>
          <div className="bg-neutral-950/60 border border-neutral-800 rounded-2xl p-4">
            <div className="text-stone-400 text-xs">Estimated Scaled Band</div>
            <div className="text-xl font-bold font-mono text-amber-400 mt-1">{scoreReport.percentile >= 80 ? 'Advanced / Exemplary' : scoreReport.percentile >= 50 ? 'Proficient / Competitive' : 'Developing Mastery'}</div>
          </div>
        </div>

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
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-indigo-600 text-white rounded-xl text-xs font-bold font-mono">
            Question {session?.currentStep} / {session?.totalQuestions}
          </span>
          <span className={`px-3 py-1 border rounded-xl text-xs font-bold ${difficultyBadge.color}`}>
            {difficultyBadge.label} ({currentQ?.difficulty &gt; 0 ? `+${currentQ?.difficulty}` : currentQ?.difficulty})
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() =&gt; setShowFormulaModal(true)}
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

      {error &amp;&amp; (
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
            onClick={() =&gt; setFlagged(!flagged)}
            className={`p-2 rounded-xl transition-all cursor-pointer ${flagged ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-neutral-800 text-stone-400 hover:text-stone-200'}`}
          >
            <Flag className="w-4 h-4" />
          </button>
        </div>

        {/* Options Grid */}
        <div className="space-y-2.5 pt-2">
          {currentQ?.options?.map((opt, idx) =&gt; (
            <button
              key={idx}
              onClick={() =&gt; setSelectedOption(idx)}
              className={`w-full text-left p-4 rounded-2xl border transition-all text-xs font-medium cursor-pointer flex items-center justify-between ${
                selectedOption === idx
                  ? 'bg-indigo-600/15 border-indigo-500 text-stone-100 shadow-md'
                  : 'bg-neutral-950/60 border-neutral-800 text-stone-300 hover:border-neutral-700'
              }`}
            >
              <span>{opt}</span>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedOption === idx ? 'border-indigo-400 bg-indigo-500' : 'border-neutral-700'}`}>
                {selectedOption === idx &amp;&amp; <div className="w-1.5 h-1.5 bg-white rounded-full" />}
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
  );
};

export default AdaptiveExamRunner;
