import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Sparkles, HelpCircle, ChevronRight, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import API from '../../services/api';

mermaid.initialize({ startOnLoad: true, theme: 'neutral' });

export default function QuizReviewModal({ questionId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [revealedHints, setRevealedHints] = useState(0);
  const [renderError, setRenderError] = useState(false);
  const mermaidRef = useRef(null);

  useEffect(() => {
    API.get(`/quizzes/questions/${questionId}/explanation`)
      .then((res) => {
        setData(res.data.explanation);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [questionId]);

  useEffect(() => {
    if (data?.mermaidDiagram && mermaidRef.current) {
      try {
        mermaid.render(`mermaid-${questionId}`, data.mermaidDiagram)
          .then(({ svg }) => {
            if (mermaidRef.current) mermaidRef.current.innerHTML = svg;
          })
          .catch(() => setRenderError(true));
      } catch (err) {
        setRenderError(true);
      }
    }
  }, [data, questionId]);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center bg-[#FFFBE9] dark:bg-[#16120E] rounded-3xl">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-2" />
        <p className="text-xs font-medium">Generating multimodal AI explanation & diagram...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-[#FFFBE9] dark:bg-[#16120E] rounded-3xl border border-[#CEAB93]/60 dark:border-[#412D15] shadow-2xl font-inter text-[#1F150C] dark:text-[#E1DCC9]">
      <div className="flex justify-between items-center mb-6 border-b border-[#CEAB93]/30 pb-4">
        <h2 className="text-xl font-bold font-playfair flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" /> AI Multimodal Solution Review
        </h2>
        <button onClick={onClose} className="text-neutral-500 hover:text-neutral-800 dark:hover:text-white font-bold">✕</button>
      </div>

      {/* Mermaid.js Diagram View / Fallback */}
      <div className="mb-6 p-4 bg-white dark:bg-[#251D17] rounded-2xl border border-[#CEAB93]/40 dark:border-[#412D15] flex flex-col items-center">
        <span className="text-xs font-bold uppercase tracking-wider text-[#8C6A53] dark:text-[#C4BA9D] mb-3">Conceptual Diagram</span>
        {renderError ? (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Diagram rendering unavailable. Relying on step-by-step text breakdown below.
          </div>
        ) : (
          <div ref={mermaidRef} className="w-full overflow-x-auto flex justify-center py-2" />
        )}
      </div>

      {/* Step-by-Step Breakdown */}
      <div className="mb-6 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#8C6A53] dark:text-[#C4BA9D]">Step-by-Step Breakdown</h3>
        {data?.steps?.map((step, idx) => (
          <div key={idx} className="p-3.5 bg-white dark:bg-[#251D17] rounded-xl border border-[#CEAB93]/30 flex items-start gap-3 text-xs">
            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
            <p className="leading-relaxed">{step}</p>
          </div>
        ))}
      </div>

      {/* Interactive Step-by-Step Hint Disclosure */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#8C6A53] dark:text-[#C4BA9D] flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-amber-500" /> Progressive Hints
        </h3>
        {data?.hints?.map((hint, idx) => (
          <div key={idx} className="p-3 bg-white dark:bg-[#251D17] rounded-xl border border-[#CEAB93]/30 text-xs">
            {idx < revealedHints ? (
              <p className="text-amber-700 dark:text-amber-300 font-medium">💡 Hint {idx + 1}: {hint}</p>
            ) : (
              <button
                onClick={() => setRevealedHints(revealedHints + 1)}
                className="w-full text-left font-bold text-[#8C6A53] dark:text-[#C4BA9D] hover:text-amber-600 flex items-center justify-between cursor-pointer"
              >
                <span>Reveal Hint {idx + 1}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
