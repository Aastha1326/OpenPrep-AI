import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, X, Loader2, AlertTriangle, ChevronRight } from 'lucide-react';
import { generateRemediationQuiz } from '../../services/api';

/**
 * RemediationQuizModal
 *
 * Shown at the end of a flashcard review session when ≥30% of cards were rated
 * hard/failed (quality < 3). Lets the student generate a targeted MCQ diagnostic
 * quiz from exactly those weak-card concepts.
 *
 * Props:
 *   deckId        {string}   Subject UUID (the flashcard deck)
 *   failedCards   {Array}    Cards with quality < 3: [{id, front, back}]
 *   totalReviewed {number}
 *   onDismiss     {Function} Called when the banner or modal is closed
 */
export default function RemediationQuizModal({ deckId, failedCards = [], totalReviewed = 0, onDismiss }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const failedPercent = totalReviewed > 0
    ? Math.round((failedCards.length / totalReviewed) * 100)
    : 0;

  const handleGenerate = useCallback(async () => {
    if (failedCards.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const res = await generateRemediationQuiz({
        deckId,
        failedCardIds: failedCards.map((c) => c.id),
        count: Math.min(10, Math.max(5, failedCards.length)),
      });
      const quizId = res.data?.data?.id;
      if (quizId) {
        navigate(`/quiz/${quizId}`);
      }
    } catch (err) {
      const msg = err?.response?.data?.error || 'Failed to generate quiz. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [deckId, failedCards, navigate]);

  const handleDismiss = useCallback(() => {
    setOpen(false);
    if (onDismiss) onDismiss();
  }, [onDismiss]);

  // Edge case: fewer than 2 cards failed — don't render anything
  if (!failedCards || failedCards.length < 2) return null;

  return (
    <>
      {/* Banner — always visible when condition is met */}
      <div
        role="region"
        aria-label="Remediation quiz available"
        className="w-full max-w-lg mt-6 rounded-xl border border-orange-200 dark:border-orange-800/40 bg-orange-50 dark:bg-orange-950/20 px-5 py-4 flex items-start gap-4 shadow-sm"
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center mt-0.5">
          <Zap className="w-5 h-5 text-orange-600 dark:text-orange-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-orange-900 dark:text-orange-200">
            Remediation Quiz Ready
          </p>
          <p className="text-xs text-orange-700 dark:text-orange-400 mt-1 leading-relaxed">
            {failedCards.length} card{failedCards.length !== 1 ? 's' : ''} ({failedPercent}%) rated Hard or Forgotten.
            Generate a targeted diagnostic quiz to reinforce these exact concepts.
          </p>
          <button
            id="remediation-quiz-generate-btn"
            onClick={() => setOpen(true)}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-orange-700 dark:text-orange-300 hover:text-orange-900 dark:hover:text-orange-100 transition-colors"
          >
            Generate Diagnostic Quiz
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <button
          id="remediation-banner-dismiss-btn"
          onClick={handleDismiss}
          aria-label="Dismiss remediation quiz prompt"
          className="flex-shrink-0 text-orange-400 hover:text-orange-700 dark:hover:text-orange-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Modal */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="remediation-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 border border-neutral-200 dark:border-slate-700">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h2
                    id="remediation-modal-title"
                    className="text-base font-bold text-neutral-900 dark:text-neutral-100"
                  >
                    Diagnostic Remediation Quiz
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    AI-generated from your forgotten concepts
                  </p>
                </div>
              </div>
              <button
                id="remediation-modal-close-btn"
                onClick={() => setOpen(false)}
                aria-label="Close modal"
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Weak card preview */}
            <div className="mb-5 rounded-lg border border-neutral-200 dark:border-slate-700 overflow-hidden">
              <div className="bg-neutral-50 dark:bg-slate-700/40 px-4 py-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Targeting {failedCards.length} weak concept{failedCards.length !== 1 ? 's' : ''}
              </div>
              <ul className="divide-y divide-neutral-100 dark:divide-slate-700/50 max-h-40 overflow-y-auto">
                {failedCards.slice(0, 6).map((card) => (
                  <li
                    key={card.id}
                    className="px-4 py-2 text-xs text-neutral-700 dark:text-neutral-300 flex items-center gap-2"
                  >
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <span className="truncate">{card.front}</span>
                  </li>
                ))}
                {failedCards.length > 6 && (
                  <li className="px-4 py-2 text-xs text-neutral-400 dark:text-neutral-500">
                    + {failedCards.length - 6} more…
                  </li>
                )}
              </ul>
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 px-3 py-2"
              >
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                id="remediation-modal-cancel-btn"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg bg-neutral-100 dark:bg-slate-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                id="remediation-modal-confirm-btn"
                onClick={handleGenerate}
                disabled={loading}
                className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Start Quiz
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
