import React from 'react';
import { GitPullRequest, Check, X } from 'lucide-react';
import DeckDiffViewer from './DeckDiffViewer';

const SuggestionReviewModal = ({ isOpen, onClose, suggestion, onApprove, onReject }) => {
  if (!isOpen || !suggestion) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={20} />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-2xl border border-purple-500/20">
            <GitPullRequest size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{suggestion.title}</h3>
            <p className="text-xs text-gray-400">Review community card change proposals</p>
          </div>
        </div>

        {suggestion.description && (
          <p className="text-xs text-gray-300 bg-gray-850 p-3 rounded-xl border border-gray-800">
            {suggestion.description}
          </p>
        )}

        <div className="max-h-72 overflow-y-auto pr-1">
          <DeckDiffViewer diffReport={suggestion.diffReport} />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => onReject(suggestion.id)}
            className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-750 text-red-400 font-bold text-xs rounded-xl border border-gray-700 transition-colors"
          >
            Reject Proposal
          </button>
          <button
            onClick={() => onApprove(suggestion.id)}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <Check size={16} /> Accept & Merge Diffs
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuggestionReviewModal;
