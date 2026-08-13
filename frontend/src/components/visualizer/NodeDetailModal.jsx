import React from 'react';
import { X, BookOpen, Key, Award, Sparkles } from 'lucide-react';

/**
 * NodeDetailModal Component
 * Interactive modal displayed when a concept node is clicked in the mind map visualizer.
 * Displays key formulas, definitions, technical terms, and quick quiz trigger.
 */
export default function NodeDetailModal({ node, isOpen, onClose, onLaunchQuiz }) {
  if (!isOpen || !node) return null;

  const {
    label = 'Concept Node',
    category = 'topic',
    description = '',
    formulas = [],
    definitions = [],
    keyTerms = [],
    difficulty = 'Medium',
  } = node.data || node;

  const difficultyTheme = {
    Easy: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    Medium: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    Hard: 'bg-red-500/10 border-red-500/30 text-red-400',
  }[difficulty] || 'bg-slate-500/10 border-slate-500/30 text-slate-400';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Glow accent header */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        {/* Top Header */}
        <div className="flex items-start justify-between gap-4 pt-2">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {category}
              </span>
              <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${difficultyTheme}`}>
                {difficulty}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-100">{label}</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        {description && (
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> Overview & Description
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">{description}</p>
          </div>
        )}

        {/* Key Formulas */}
        {formulas && formulas.length > 0 && (
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>∑</span> Key Formulas & Equations
            </h3>
            <div className="space-y-1.5">
              {formulas.map((form, idx) => (
                <div key={idx} className="p-2 rounded-lg bg-slate-900 border border-amber-500/20 font-mono text-xs text-amber-300">
                  {form}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Definitions */}
        {definitions && definitions.length > 0 && (
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <h3 className="text-xs font-semibold text-sky-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-sky-400" /> Core Definitions
            </h3>
            <ul className="space-y-1.5">
              {definitions.map((def, idx) => (
                <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                  <span className="text-sky-400 font-bold">•</span>
                  <span>{def}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Technical Key Terms */}
        {keyTerms && keyTerms.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-purple-400" /> Technical Keywords
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {keyTerms.map((term, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 text-xs rounded-lg bg-purple-950/60 border border-purple-800/50 text-purple-300 font-mono"
                >
                  {term}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Close
          </button>
          {onLaunchQuiz && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onLaunchQuiz(label);
              }}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" /> Practice Quick Quiz on "{label}"
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
