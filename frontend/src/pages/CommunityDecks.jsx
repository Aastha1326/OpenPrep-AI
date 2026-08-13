import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import DeckCard from '../components/community/DeckCard';
import DeckPreviewModal from '../components/community/DeckPreviewModal';
import API from '../services/api';
import { Search, Compass, ChevronLeft, ChevronRight } from 'lucide-react';

const CommunityDecks = () => {
  const { user } = useSelector((state) => state.auth);

  // Decks Catalog State
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination & Filtering state
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('popular');
  const [ratingFilter, setRatingFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [forkSuccess, setForkSuccess] = useState(false);

  const fetchDecks = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 12,
        sort,
      };
      if (search.trim()) params.search = search;
      if (ratingFilter) params.rating = ratingFilter;

      const res = await API.get('/community/decks', { params });
      setDecks(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch community decks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecks();
  }, [page, search, sort, ratingFilter]);

  const handleFork = async (deck) => {
    try {
      setForkSuccess(false);
      const res = await API.post(`/community/decks/${deck.id}/fork`);
      if (res.data.success) {
        setForkSuccess(true);
        setTimeout(() => setForkSuccess(false), 3000);
        // Refresh catalog downloads count
        fetchDecks();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to fork community deck');
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Compass className="w-8 h-8 text-indigo-600" />
            Community Library
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Browse, preview, and fork community-curated flashcard decks to power up your exam prep.
          </p>
        </div>
      </div>

      {forkSuccess && (
        <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg text-sm font-semibold animate-fade-in-down">
          Deck cloned successfully! You can find it in your personal decks list now.
        </div>
      )}

      {/* Catalog Search & Filter Bar */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-sm border border-neutral-200 dark:border-neutral-700 mb-6 flex flex-wrap gap-4 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search decks by title, exam, tags..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10 pr-4 py-2 w-full border border-neutral-300 dark:border-neutral-600 rounded-lg bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
          >
            <option value="popular">Most Popular</option>
            <option value="rating">Highest Rated</option>
            <option value="newest">Newest</option>
          </select>

          <select
            value={ratingFilter}
            onChange={(e) => {
              setRatingFilter(e.target.value);
              setPage(1);
            }}
            className="border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
          >
            <option value="">All Ratings</option>
            <option value="4">4+ Stars</option>
            <option value="3">3+ Stars</option>
          </select>
        </div>
      </div>

      {error && <div className="p-4 mb-6 bg-red-100 text-red-700 rounded-lg">{error}</div>}

      {/* Grid Catalog */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-neutral-100 dark:bg-neutral-800 h-48 rounded-xl" />
          ))}
        </div>
      ) : decks.length === 0 ? (
        <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
          No community decks found matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {decks.map((deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              onPreview={setSelectedDeck}
              onFork={handleFork}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-white dark:bg-neutral-800 p-4 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            aria-label="Previous Page"
            className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 dark:hover:bg-neutral-900 transition text-neutral-700 dark:text-neutral-300"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <span className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
            aria-label="Next Page"
            className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 dark:hover:bg-neutral-900 transition text-neutral-700 dark:text-neutral-300"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {selectedDeck && (
        <DeckPreviewModal
          deck={selectedDeck}
          onClose={() => setSelectedDeck(null)}
          onFork={handleFork}
          currentUserId={user?.id}
        />
      )}
    </div>
  );
};

export default CommunityDecks;
