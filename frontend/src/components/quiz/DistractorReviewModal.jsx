import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, RefreshCw, Sparkles, X } from 'lucide-react';
import API from '../../services/api';

export default function DistractorReviewModal({ isOpen, question, onClose, onContinue }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(null);
  const [error, setError] = useState('');

  const correctAnswer = question && Array.isArray(question.options)
    ? question.options[Number(question.correctAnswer) || 0]
    : '';

  const requestDistractors = useCallback(async () => {
    if (!question || !correctAnswer) return;
    setError('');
    setLoading(true);
    try {
      const response = await API.post('/quizzes/generate-distractors', {
        question: question.questionText,
        correctAnswer,
        context: question.topicName || '',
      });
      setResult(response.data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to generate distractors right now.');
    } finally {
      setLoading(false);
    }
  }, [correctAnswer, question]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const requestTimer = setTimeout(() => requestDistractors(), 0);
    return () => clearTimeout(requestTimer);
  }, [isOpen, requestDistractors]);

  const regenerate = async (index) => {
    setRegenerating(index);
    try {
      const response = await API.post('/quizzes/generate-distractors', {
        question: question.questionText,
        correctAnswer,
        context: question.topicName || '',
      });
      const replacement = response.data.data.distractors[index];
      if (replacement) {
        setResult((current) => ({
          ...current,
          distractors: current.distractors.map((item, itemIndex) => itemIndex === index ? replacement : item),
        }));
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to regenerate this distractor.');
    } finally {
      setRegenerating(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-labelledby="distractor-review-title" className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600"><Sparkles className="h-4 w-4" /> Misconception lab</p>
            <h2 id="distractor-review-title" className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">Review answer choices</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">AI-generated wrong answers are tied to common reasoning errors.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close distractor review" className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>
        </div>

        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
          <p className="text-sm font-medium text-slate-900 dark:text-white">{question?.questionText}</p>
          <p className="mt-2 flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="h-4 w-4" /> Correct: {correctAnswer}</p>
        </div>

        {error && <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}</div>}
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /> Generating plausible misconceptions...</div>
        ) : (
          <div className="mt-4 space-y-3">
            {(result?.distractors || []).map((item, index) => (
              <div key={`${item.id}-${item.text}`} className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-slate-900 dark:text-white">{item.text}</p>
                  <button type="button" onClick={() => regenerate(index)} disabled={regenerating !== null} aria-label={`Regenerate distractor ${index + 1}`} className="shrink-0 rounded-md p-1.5 text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 dark:hover:bg-indigo-950/50">
                    {regenerating === index ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300"><span className="font-semibold">Likely misconception:</span> {item.misconception}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Close</button>
          <button type="button" onClick={onContinue} disabled={loading} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">Continue to quiz</button>
        </div>
      </div>
    </div>
  );
}
