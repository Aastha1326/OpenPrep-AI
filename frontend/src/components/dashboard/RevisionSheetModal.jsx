import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, BookOpen, CheckCircle, Copy, FileText, Loader2, AlertCircle } from 'lucide-react';
import API from '../../services/api';

const RevisionSheetModal = ({ isOpen, onClose, quizAttemptId, mistookQuestions, subjectId, topicId, topicName }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [copied, setCopied] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      generateSheet();
    } else {
      setSheet(null);
      setError(null);
      setNoteSaved(false);
    }
  }, [isOpen]);

  const generateSheet = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.post('/quizzes/generate-revision-sheet', {
        quizAttemptId,
        mistookQuestions,
        subjectId,
        topicId,
        saveToNotes: true,
      });

      if (res.data?.data) {
        setSheet(res.data.data);
        if (res.data.data.savedNote) {
          setNoteSaved(true);
        }
      }
    } catch (err) {
      console.error('Failed to generate revision sheet:', err);
      setError(err.response?.data?.error || 'Failed to generate AI concept revision sheet.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!sheet?.summaryMarkdown) return;
    navigator.clipboard.writeText(sheet.summaryMarkdown);
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
          className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">
                  AI Concept Revision Sheet
                </h3>
                <p className="text-xs text-slate-400">
                  Targeted analysis for weak concepts from quiz history
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
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                <p className="text-slate-300 font-medium text-base">Analyzing weak concepts & generating summary...</p>
                <p className="text-xs text-slate-500 max-w-sm">
                  Gemini AI is digesting missed question payloads and building key formula cheatsheets.
                </p>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-300">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            ) : sheet ? (
              <div className="space-y-4">
                {noteSaved && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Revision sheet saved directly to your study notes!</span>
                    </div>
                    <span className="font-semibold text-[11px] underline cursor-pointer">View Notes</span>
                  </div>
                )}

                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 font-mono text-xs whitespace-pre-wrap leading-relaxed overflow-x-auto text-slate-300">
                  {sheet.summaryMarkdown}
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              {sheet && (
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
                      <Copy className="w-4 h-4 text-indigo-400" /> Copy Markdown
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

export default RevisionSheetModal;
