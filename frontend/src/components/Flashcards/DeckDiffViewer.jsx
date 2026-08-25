import React from 'react';
import { GitPullRequest, PlusCircle, MinusCircle, RefreshCw } from 'lucide-react';

const DeckDiffViewer = ({ diffReport }) => {
  if (!diffReport?.diffs) return null;

  const { added = [], modified = [], deleted = [] } = diffReport.diffs;
  const { summary } = diffReport;

  return (
    <div className="space-y-4">
      {/* Summary Badges */}
      <div className="flex gap-2 text-xs font-bold">
        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          +{summary.addedCount} Added
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
          ~{summary.modifiedCount} Modified
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
          -{summary.deletedCount} Deleted
        </span>
      </div>

      {/* Added Cards */}
      {added.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
            <PlusCircle size={14} /> Added Flashcards
          </div>
          {added.map((card, idx) => (
            <div key={idx} className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-1 text-xs">
              <div className="font-bold text-white">Q: {card.front}</div>
              <div className="text-gray-300">A: {card.back}</div>
            </div>
          ))}
        </div>
      )}

      {/* Modified Cards */}
      {modified.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-bold text-yellow-400 flex items-center gap-1.5">
            <RefreshCw size={14} /> Modified Flashcards
          </div>
          {modified.map((item, idx) => (
            <div key={idx} className="p-3 bg-yellow-950/20 border border-yellow-500/30 rounded-xl space-y-2 text-xs">
              <div className="text-red-300 line-through">
                Before: {item.before.front} ➔ {item.before.back}
              </div>
              <div className="text-emerald-300 font-semibold">
                After: {item.after.front} ➔ {item.after.back}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Deleted Cards */}
      {deleted.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-bold text-red-400 flex items-center gap-1.5">
            <MinusCircle size={14} /> Deleted Flashcards
          </div>
          {deleted.map((card, idx) => (
            <div key={idx} className="p-3 bg-red-950/20 border border-red-500/30 rounded-xl text-xs line-through text-red-300">
              Q: {card.front} — A: {card.back}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeckDiffViewer;
