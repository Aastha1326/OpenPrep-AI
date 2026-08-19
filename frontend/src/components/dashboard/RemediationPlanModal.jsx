import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  X,
  CheckCircle,
  Copy,
  Loader2,
  AlertCircle,
  CalendarDays,
  Clock,
  BookOpen,
  CheckSquare,
} from 'lucide-react';
import API from '../../services/api';

const DAY_COLORS = {
  1: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
  2: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
  3: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
};

const RemediationPlanModal = ({
  isOpen,
  onClose,
  quizAttemptId,
  mistookQuestions,
  subjectId,
  topicId,
  topicName,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [plan, setPlan] = useState(null);
  const [copied, setCopied] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      generatePlan();
    } else {
      setPlan(null);
      setError(null);
      setNoteSaved(false);
    }
  }, [isOpen]);

  const generatePlan = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.post('/quizzes/generate-remediation-plan', {
        quizAttemptId,
        mistookQuestions,
        subjectId,
        topicId,
        saveToNotes: true,
      });

      if (res.data?.data) {
        setPlan(res.data.data);
        if (res.data.data.savedNote) {
          setNoteSaved(true);
        }
      }
    } catch (err) {
      console.error('Failed to generate remediation plan:', err);
      setError(err.response?.data?.error || 'Failed to generate AI remediation plan.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!plan?.summaryMarkdown) return;
    navigator.clipboard.writeText(plan.summaryMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">3-Day AI Remediation Plan</h3>
                <p className="text-xs text-slate-400">
                  Structured micro-modules to fix weak concepts from failed questions
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1 space-y-4 text-slate-200 text-sm leading-relaxed font-sans">
            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
                <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
                <p className="text-slate-300 font-medium text-base">
                  Diagnosing weak concepts & building your 3-day plan...
                </p>
                <p className="text-xs text-slate-500 max-w-sm">
                  Gemini AI is analyzing missed questions and structuring daily remediation
                  micro-modules.
                </p>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-300">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            ) : plan ? (
              <div className="space-y-4">
                {noteSaved && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Remediation plan saved directly to your study notes!</span>
                    </div>
                    <span className="font-semibold text-[11px] underline cursor-pointer">
                      View Notes
                    </span>
                  </div>
                )}

                {Array.isArray(plan.plan) && plan.plan.length > 0 && (
                  <div className="space-y-4">
                    {plan.plan.map((day) => (
                      <div
                        key={day.day}
                        className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden"
                      >
                        <div
                          className={`px-5 py-3 border-b border-slate-800 flex items-center justify-between ${DAY_COLORS[day.day] || 'bg-slate-500/10 border-slate-500/30 text-slate-300'}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-slate-900/60 border border-slate-700 flex items-center justify-center font-bold text-sm">
                              {day.day}
                            </span>
                            <div>
                              <p className="font-semibold text-sm">Day {day.day}</p>
                              <p className="flex items-center gap-1.5 text-[11px] opacity-80">
                                <CalendarDays className="w-3 h-3" /> {day.date}
                              </p>
                            </div>
                          </div>
                          <span className="flex items-center gap-1.5 text-[11px] font-semibold bg-slate-900/60 border border-slate-700 rounded-full px-3 py-1">
                            <Clock className="w-3 h-3" /> {day.estimatedMinutes} min
                          </span>
                        </div>

                        <div className="p-5 space-y-4">
                          <div>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                              Focus Topics
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {day.focusTopics.map((topic, idx) => (
                                <span
                                  key={idx}
                                  className="px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs"
                                >
                                  {topic}
                                </span>
                              ))}
                            </div>
                          </div>

                          {Array.isArray(day.objectives) && day.objectives.length > 0 && (
                            <div>
                              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <BookOpen className="w-3.5 h-3.5" /> Objectives
                              </p>
                              <ul className="space-y-1.5 list-disc list-outside pl-6 text-slate-300">
                                {day.objectives.map((objective, idx) => (
                                  <li key={idx}>{objective}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {Array.isArray(day.tasks) && day.tasks.length > 0 && (
                            <div>
                              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <CheckSquare className="w-3.5 h-3.5" /> Tasks
                              </p>
                              <div className="space-y-2">
                                {day.tasks.map((task, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 rounded-lg px-3.5 py-2.5"
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[10px] font-bold uppercase text-slate-400 shrink-0">
                                        {task.type}
                                      </span>
                                      <span className="text-slate-200 truncate">{task.title}</span>
                                    </div>
                                    <span className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
                                      <Clock className="w-3.5 h-3.5" /> {task.durationMinutes} min
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {plan.summaryMarkdown && (
                  <details className="group">
                    <summary className="cursor-pointer text-xs font-semibold text-indigo-300 hover:text-indigo-200 transition-colors select-none">
                      View full Markdown plan
                    </summary>
                    <div className="mt-3 bg-slate-950 p-6 rounded-xl border border-slate-800 font-mono text-xs whitespace-pre-wrap leading-relaxed overflow-x-auto text-slate-300">
                      {plan.summaryMarkdown}
                    </div>
                  </details>
                )}
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              {plan && (
                <button
                  onClick={handleCopy}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors border border-slate-700"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-400" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-amber-400" /> Copy Markdown
                    </>
                  )}
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all shadow-lg shadow-indigo-600/20"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RemediationPlanModal;
