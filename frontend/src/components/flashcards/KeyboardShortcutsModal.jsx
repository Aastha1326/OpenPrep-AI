import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X, Sparkles } from 'lucide-react';

/**
 * KeyboardShortcutsModal Component
 * Interactive modal listing all flashcard review keyboard navigation shortcuts.
 */
export default function KeyboardShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space / Enter', label: 'Flip flashcard front or back' },
    { key: '0 / 1 / 2 / 3 / 4 / 5', label: 'Rate flashcard quality (0: Blackout to 5: Easy)' },
    { key: '→ or N', label: 'Skip to next card' },
    { key: '← or P', label: 'Go back to previous card' },
    { key: 'Escape', label: 'Close modal or exit review session' },
    { key: '? (Shift + /)', label: 'Open / Close this keyboard shortcuts guide' },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        />

        {/* Modal Box */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-neutral-200 dark:border-slate-700 p-6 z-10 space-y-5 overflow-hidden"
        >
          {/* Top Header */}
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Keyboard className="w-5 h-5 text-indigo-500" />
              <h3 className="text-lg font-bold font-inter text-neutral-800 dark:text-neutral-100">
                Keyboard Shortcuts Guide
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Shortcuts Table */}
          <div className="space-y-2.5">
            {shortcuts.map((sc, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-slate-900/60 border border-neutral-200/60 dark:border-slate-700/60 text-xs"
              >
                <span className="text-neutral-600 dark:text-neutral-300 font-medium">{sc.label}</span>
                <kbd className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-white dark:bg-slate-800 border border-neutral-300 dark:border-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm">
                  {sc.key}
                </kbd>
              </div>
            ))}
          </div>

          {/* Bottom Info Footer */}
          <div className="pt-2 border-t border-neutral-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-neutral-400">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Power-user shortcuts disabled when typing in inputs.
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              Got it
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
