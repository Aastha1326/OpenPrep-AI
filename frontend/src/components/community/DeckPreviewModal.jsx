import { useState, useEffect } from 'react';
import StarRating from './StarRating';
import { X, Send, BookOpen } from 'lucide-react';
import API from '../../services/api';

const DeckPreviewModal = ({ deck, onClose, onFork, currentUserId }) => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingError, setRatingError] = useState(null);
  const [ratingSuccess, setRatingSuccess] = useState(false);

  const fetchReviews = async () => {
    try {
      const res = await API.get(`/community/decks/${deck.id}/reviews`);
      setReviews(res.data.data || []);
    } catch (err) {
      console.error('Failed to load reviews', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    const fetchSampleCards = async () => {
      try {
        // Fetch flashcards for the selected community deck
        const res = await API.get('/flashcards', {
          params: { subjectId: deck.id, limit: 5 },
        });
        setCards(res.data.data || res.data.flashcards || []);
      } catch (err) {
        console.error('Failed to load sample cards', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSampleCards();
    fetchReviews();
  }, [deck.id]);

  const handleRate = async (e) => {
    e.preventDefault();
    setSubmittingRating(true);
    setRatingError(null);
    setRatingSuccess(false);

    try {
      await API.post(`/community/decks/${deck.id}/rate`, { stars, comment });
      setRatingSuccess(true);
      setComment('');
      fetchReviews();
    } catch (err) {
      setRatingError(err.response?.data?.error || 'Failed to submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  const isAuthor = deck.user === currentUserId;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-neutral-200 dark:border-neutral-700">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              {deck.name}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              by {deck.ownerName || 'Peer'} • {deck.cardCount || cards.length} Cards
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full transition text-neutral-500 dark:text-neutral-400"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Description */}
          <div>
            <h4 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
              Description
            </h4>
            <p className="text-neutral-700 dark:text-neutral-300 text-sm">
              {deck.description || 'No description provided.'}
            </p>
          </div>

          {/* Sample Cards */}
          <div>
            <h4 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
              Sample Cards Preview
            </h4>
            {loading ? (
              <div className="space-y-2">
                <div className="h-10 bg-neutral-100 dark:bg-neutral-700 animate-pulse rounded-lg" />
                <div className="h-10 bg-neutral-100 dark:bg-neutral-700 animate-pulse rounded-lg" />
              </div>
            ) : cards.length === 0 ? (
              <div className="text-sm text-neutral-500">No cards in this deck.</div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {cards.map((card, i) => (
                  <div
                    key={card.id || i}
                    className="p-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-neutral-50 dark:bg-neutral-900 flex justify-between gap-4 text-sm"
                  >
                    <div className="font-semibold text-neutral-900 dark:text-neutral-100 flex-1">
                      {card.front}
                    </div>
                    <div className="text-neutral-600 dark:text-neutral-400 flex-1 text-right">
                      {card.back}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reviews List */}
          <div className="border-t border-neutral-200 dark:border-neutral-700 pt-5">
            <h4 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
              Community Reviews ({reviews.length})
            </h4>
            {loadingReviews ? (
              <div className="h-10 bg-neutral-100 dark:bg-neutral-700 animate-pulse rounded-lg" />
            ) : reviews.length === 0 ? (
              <p className="text-sm text-neutral-500 italic">No reviews yet. Be the first to rate!</p>
            ) : (
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-neutral-100 dark:border-neutral-700/50"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                        {rev.userRef?.name || 'Peer Student'}
                      </span>
                      <StarRating rating={rev.stars} readOnly />
                    </div>
                    {rev.comment && (
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {rev.comment}
                      </p>
                    )}
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500 block mt-1">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rate Section */}
          <div className="border-t border-neutral-200 dark:border-neutral-700 pt-5">
            <h4 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
              Submit Review & Rating
            </h4>
            {isAuthor ? (
              <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-lg">
                Authors cannot rate their own community decks.
              </p>
            ) : (
              <form onSubmit={handleRate} className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">Your Rating:</span>
                  <StarRating rating={stars} onChange={setStars} />
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Leave a review comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-xl bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={submittingRating}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition flex items-center gap-1.5 shadow-sm"
                  >
                    {submittingRating ? 'Saving...' : 'Rate'}
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                {ratingSuccess && (
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                    Thank you! Your rating has been successfully saved.
                  </p>
                )}
                {ratingError && (
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">{ratingError}</p>
                )}
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl text-sm font-semibold transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onFork(deck)}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition flex items-center gap-1.5 shadow-md"
          >
            <BookOpen className="w-4 h-4" />
            Fork to My Library
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeckPreviewModal;
