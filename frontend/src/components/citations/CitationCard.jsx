import React from 'react';
import { Copy, Check, Plus, ExternalLink, Bookmark } from 'lucide-react';

const CitationCard = ({ citation, styleKey = 'apa', onCopy, isCopied, onInsert }) => {
  const formattedText = citation.styles?.[styleKey] || citation.title;
  const inTextTag = citation.styles?.inTextAPA || `(${citation.authors?.[0]?.split(',')?.[0] || 'Author'}, ${citation.year || 'n.d.'})`;

  return (
    <div className="p-4 rounded-2xl bg-gray-850/60 border border-gray-800 hover:border-gray-700 transition-all space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-gray-400 bg-gray-800 px-2 py-0.5 rounded-md">
          {citation.year || 'n.d.'} • {citation.journal || citation.publisher || 'Journal Article'}
        </span>
        <div className="flex items-center gap-2">
          {citation.url && (
            <a
              href={citation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-emerald-400 transition-colors p-1"
              title="Open DOI Link"
            >
              <ExternalLink size={14} />
            </a>
          )}
          <button
            onClick={() => onCopy(formattedText, citation.id)}
            className="flex items-center gap-1 px-2.5 py-1 bg-gray-800 hover:bg-gray-750 text-gray-300 rounded-lg text-xs font-semibold border border-gray-700 transition-all"
            title="Copy Formatted Citation"
          >
            {isCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            {isCopied ? 'Copied' : 'Copy'}
          </button>
          {onInsert && (
            <button
              onClick={() => onInsert(inTextTag, formattedText)}
              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg text-xs font-semibold border border-emerald-500/30 transition-all"
              title="Insert into Note"
            >
              <Plus size={13} /> Insert
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-200 font-mono bg-gray-900/90 p-2.5 rounded-xl leading-relaxed select-all">
        {formattedText}
      </p>
    </div>
  );
};

export default CitationCard;
