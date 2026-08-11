import React, { useState, useEffect } from 'react';
import { FileText, Check, Edit3, Trash2, Sparkles, Loader2 } from 'lucide-react';
import API from '../../services/api';

export default function PYQDraftReview() {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get('/pyqs/drafts')
      .then((res) => {
        setDrafts(res.data.drafts || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load draft review queue.');
        setLoading(false);
      });
  }, []);

  const handleApprove = async (id) => {
    try {
      await API.post(`/pyqs/drafts/${id}/approve`);
      setDrafts(drafts.filter((d) => d.id !== id));
    } catch (err) {
      setError('Failed to publish draft question.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/pyqs/drafts/${id}`);
      setDrafts(drafts.filter((d) => d.id !== id));
    } catch (err) {
      setError('Failed to delete draft question.');
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-2" />
        <p className="text-xs font-medium">Loading draft approval queue...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 font-inter text-[#1F150C] dark:text-[#E1DCC9]">
      <div className="mb-6 flex justify-between items-center bg-[#FFFBE9] dark:bg-[#16120E] p-6 rounded-3xl border border-[#CEAB93]/60 dark:border-[#412D15] shadow-sm">
        <div>
          <h1 className="text-2xl font-bold font-playfair flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500" /> PYQ Draft Review Queue
          </h1>
          <p className="text-xs text-[#8C6A53] dark:text-[#C4BA9D] mt-1">
            Review, edit, and publish automatically parsed PYQ questions extracted from uploaded PDFs.
          </p>
        </div>
        <span className="px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs border border-amber-500/30">
          {drafts.length} Pending Review
        </span>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-600 dark:text-red-300 font-medium">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {drafts.length === 0 && (
          <div className="text-center py-16 text-xs text-[#8C6A53] dark:text-[#C4BA9D]">
            No pending PYQ drafts in the queue. Upload a new PDF paper to begin parsing!
          </div>
        )}

        {drafts.map((draft) => (
          <div key={draft.id} className="p-5 bg-white dark:bg-[#16120E] rounded-2xl border border-[#CEAB93]/40 dark:border-[#412D15] shadow-sm space-y-3">
            <div className="flex justify-between items-center text-xs text-[#8C6A53] dark:text-[#C4BA9D] border-b border-[#CEAB93]/20 pb-2">
              <span className="font-bold">Q{draft.questionNumber} — {draft.paperTitle}</span>
              <div className="flex gap-2">
                <span className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono">{draft.topic}</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 font-mono">{draft.year}</span>
              </div>
            </div>

            <p className="text-sm font-semibold">{draft.questionText}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {draft.options?.map((opt, idx) => (
                <div key={idx} className={`p-2.5 rounded-xl border text-xs ${opt === draft.correctAnswer ? 'bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-300 font-bold' : 'bg-black/5 dark:bg-white/5 border-[#CEAB93]/30'}`}>
                  {String.fromCharCode(65 + idx)}. {opt}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => handleDelete(draft.id)}
                className="px-4 py-2 rounded-xl bg-red-500/10 text-red-600 hover:bg-red-500/20 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Discard
              </button>
              <button
                onClick={() => handleApprove(draft.id)}
                className="px-4 py-2 rounded-xl btn-primary-theme font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Check className="w-4 h-4" /> Approve & Publish
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
