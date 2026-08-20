import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, Sparkles } from 'lucide-react';
import useFocusTrap from '../../hooks/useFocusTrap';

export default function GenerateQuizModal({ isOpen, onClose, onGenerate }) {
  const containerRef = useFocusTrap(isOpen, onClose);
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    if (onGenerate) {
      onGenerate({ topic, numQuestions });
    }
    setLoading(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          ref={containerRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="generate-quiz-modal-title"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-500" />
              <h3 id="generate-quiz-modal-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Generate AI Quiz
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="quiz-topic-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Topic or Syllabus Unit
              </label>
              <input
                id="quiz-topic-input"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Organic Chemistry, Quantum Physics"
                required
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="quiz-count-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Number of Questions
              </label>
              <select
                id="quiz-count-input"
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={5}>5 Questions</option>
                <option value={10}>10 Questions</option>
                <option value={15}>15 Questions</option>
                <option value={20}>20 Questions</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !topic.trim()}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors"
              >
                <Sparkles className="w-4 h-4" /> Generate Quiz
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
