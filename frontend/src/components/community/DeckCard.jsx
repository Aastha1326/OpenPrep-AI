import StarRating from './StarRating';
import { Download, BookOpen, User, Tag } from 'lucide-react';

const DeckCard = ({ deck, onPreview, onFork }) => {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl p-5 border border-neutral-200 dark:border-neutral-700 shadow-sm hover:shadow-md transition flex flex-col justify-between h-full">
      <div>
        <div className="flex justify-between items-start gap-2 mb-3">
          <span className="text-xs font-semibold px-2 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            {deck.examName || 'Competitive Exam'}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
            <Download className="w-3.5 h-3.5 text-neutral-400" />
            <span>{deck.cloneCount || 0}</span>
          </div>
        </div>

        <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-1.5 line-clamp-1">
          {deck.name}
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-4 line-clamp-2">
          {deck.description || 'No description provided.'}
        </p>

        {/* Tags */}
        {deck.tags && deck.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {deck.tags.map((tag, i) => (
              <span
                key={i}
                className="text-[10px] px-2 py-0.5 border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 rounded-full flex items-center gap-0.5"
              >
                <Tag className="w-2.5 h-2.5" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-neutral-100 dark:border-neutral-700">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
            <User className="w-3.5 h-3.5 text-neutral-400" />
            <span className="line-clamp-1">{deck.ownerName || 'Peer'}</span>
          </div>
          <div className="flex items-center gap-1">
            <StarRating rating={Math.round(deck.rating || 0)} readOnly />
            <span className="text-xs text-neutral-500">({deck.ratingsCount || 0})</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onPreview(deck)}
            className="flex-1 px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-700 dark:text-neutral-300 text-xs font-semibold rounded-lg transition"
          >
            Preview
          </button>
          <button
            onClick={() => onFork(deck)}
            className="flex-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            Fork Deck
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeckCard;
