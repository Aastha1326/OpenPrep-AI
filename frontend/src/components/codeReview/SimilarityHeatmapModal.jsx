import React from 'react';
import { ShieldAlert, CheckCircle, X, AlertCircle } from 'lucide-react';

const SimilarityHeatmapModal = ({ isOpen, onClose, similarityData }) => {
  if (!isOpen || !similarityData) return null;

  const { highestSimilarity, matches = [], tokenCount } = similarityData;

  const isFlagged = highestSimilarity >= 75;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={20} />
        </button>

        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl border ${
            isFlagged
              ? 'bg-red-500/10 text-red-400 border-red-500/20'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          }`}>
            {isFlagged ? <ShieldAlert size={24} /> : <CheckCircle size={24} />}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Code Originality Report</h3>
            <p className="text-xs text-gray-400">Winnowing k-gram fingerprinting & AST similarity</p>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border text-center ${
          isFlagged ? 'bg-red-500/5 border-red-500/20' : 'bg-emerald-500/5 border-emerald-500/20'
        }`}>
          <div className={`text-4xl font-black ${isFlagged ? 'text-red-400' : 'text-emerald-400'}`}>
            {highestSimilarity}%
          </div>
          <p className="text-xs font-semibold text-gray-300 mt-1">
            {isFlagged ? 'High structural similarity detected with existing submissions' : 'Code passes originality verification'}
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cohort Comparison Matches</h4>
          {matches.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-4">No overlapping fingerprints found.</p>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-2">
              {matches.map((m, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-gray-850/80 border border-gray-800 flex items-center justify-between text-xs"
                >
                  <span className="text-gray-300 font-mono">Submission #{m.submissionId?.substring(0, 8)}...</span>
                  <span className={`font-bold px-2 py-0.5 rounded-full ${
                    m.similarityPercentage >= 75 ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {m.similarityPercentage}% Similarity
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimilarityHeatmapModal;
