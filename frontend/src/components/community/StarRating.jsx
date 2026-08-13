import { Star } from 'lucide-react';

const StarRating = ({ rating, onChange, maxStars = 5, readOnly = false }) => {
  const starsArray = [...Array(maxStars)].map((_, i) => i + 1);

  return (
    <div
      className="flex items-center gap-1"
      role="slider"
      aria-label="Star Rating"
      aria-valuenow={rating}
      aria-valuemin="1"
      aria-valuemax={maxStars}
      tabIndex={readOnly ? -1 : 0}
      onKeyDown={(e) => {
        if (readOnly || !onChange) return;
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
          onChange(Math.min(maxStars, rating + 1));
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
          onChange(Math.max(1, rating - 1));
        }
      }}
    >
      {starsArray.map((starValue) => {
        const isFilled = starValue <= rating;
        return (
          <button
            key={starValue}
            type="button"
            disabled={readOnly}
            onClick={() => onChange && onChange(starValue)}
            className={`transition-colors focus:outline-none ${
              readOnly ? 'cursor-default' : 'hover:scale-110 cursor-pointer'
            }`}
            aria-label={`${starValue} Stars`}
          >
            <Star
              className={`w-5 h-5 ${
                isFilled
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-neutral-300 dark:text-neutral-600'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
