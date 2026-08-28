import React from 'react';
import { FileText, Layers, Star, User, Calendar, ExternalLink, Bookmark } from 'lucide-react';

const typeConfig = {
  note: { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', label: 'Note' },
  deck: { icon: Layers, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', label: 'Deck' },
};

const StarRating = ({ rating, count }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star key={s} className={`w-3 h-3 ${s <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-600'}`} />
    ))}
    {count > 0 && <span className="text-[10px] text-gray-500 dark:text-gray-400 ml-0.5">({count})</span>}
  </div>
);

const ResourceCard = ({ resource, onClick }) => {
  const config = typeConfig[resource.type] || typeConfig.note;
  const Icon = config.icon;

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 transition-all hover:shadow-lg hover:scale-[1.01] cursor-pointer group"
      onClick={onClick}
    >
      {/* Type badge + bookmark */}
      <div className="flex items-center justify-between mb-3">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${config.bg} ${config.color}`}>
          <Icon className="w-3 h-3" />
          {config.label}
        </span>
        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-amber-500">
          <Bookmark className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">{resource.title}</h4>
      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{resource.description}</p>

      {/* Meta */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
          {resource.author && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {resource.author.name}
            </span>
          )}
          {resource.subject && (
            <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-[10px]">{resource.subject.name}</span>
          )}
        </div>
        {resource.type === 'deck' && resource.cardCount > 0 && (
          <span className="text-[10px] text-gray-400">{resource.cardCount} cards</span>
        )}
      </div>

      {/* Rating */}
      {resource.type === 'deck' && resource.avgRating > 0 && (
        <div className="mt-2">
          <StarRating rating={resource.avgRating} count={resource.ratingCount} />
        </div>
      )}
    </div>
  );
};

export { StarRating };
export default ResourceCard;
