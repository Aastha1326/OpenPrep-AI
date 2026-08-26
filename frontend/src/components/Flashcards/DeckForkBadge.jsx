import React from 'react';
import { GitFork } from 'lucide-react';

const DeckForkBadge = ({ parentDeckTitle, authorName }) => {
  if (!parentDeckTitle) return null;

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-full text-xs font-semibold">
      <GitFork size={13} className="text-purple-400" />
      <span>
        Forked from <span className="font-bold text-white">{parentDeckTitle}</span>
        {authorName ? ` by @${authorName}` : ''}
      </span>
    </div>
  );
};

export default DeckForkBadge;
