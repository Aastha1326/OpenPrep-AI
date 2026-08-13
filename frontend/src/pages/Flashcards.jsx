import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFlashcards, deleteFlashcard } from '../store/slices/flashcardSlice';
import API from '../services/api';
import CreateDeckModal from '../components/dashboard/CreateDeckModal';
import { Search, Trash2, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

const Flashcards = () => {
  const dispatch = useDispatch();
  const { flashcards, pagination, loading, error } = useSelector((state) => state.flashcards);

  // Filter & pagination state
  const [search, setSearch] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [sortBy, setSortBy] = useState('nextReviewDate');
  const [order, setOrder] = useState('ASC');
  const [page, setPage] = useState(1);

  // Metadata
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const subRes = await API.get('/academic/subjects');
        setSubjects(subRes.data.data || []);
        const topRes = await API.get('/academic/topics');
        setTopics(topRes.data.data || []);
      } catch (err) {
        console.error('Failed to load metadata', err);
      }
    };
    fetchMetadata();
  }, []);

  useEffect(() => {
    const params = {
      page,
      limit: 12,
      sortBy,
      order,
    };
    if (search.trim()) params.search = search;
    if (subjectId) params.subjectId = subjectId;
    if (topicId) params.topicId = topicId;

    dispatch(fetchFlashcards(params));
  }, [dispatch, page, search, subjectId, topicId, sortBy, order]);

  const handleDelete = (cardId) => {
    if (window.confirm('Are you sure you want to delete this flashcard?')) {
      dispatch(deleteFlashcard(cardId));
    }
  };

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < pagination.totalPages) setPage(page + 1);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
            Flashcard Decks
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Manage, search, sort, and organize your cards.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-md transition"
        >
          <Plus className="w-5 h-5" />
          Create Flashcard
        </button>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-sm border border-neutral-200 dark:border-neutral-700 mb-6 flex flex-wrap gap-4 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search cards..."
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
            value={subjectId}
            onChange={(e) => {
              setSubjectId(e.target.value);
              setTopicId('');
              setPage(1);
            }}
            className="border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
          >
            <option value="">All Subjects</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>

          <select
            value={topicId}
            onChange={(e) => {
              setTopicId(e.target.value);
              setPage(1);
            }}
            className="border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
            disabled={!subjectId}
          >
            <option value="">All Topics</option>
            {topics
              .filter((top) => top.subject === subjectId)
              .map((top) => (
                <option key={top.id} value={top.id}>
                  {top.name}
                </option>
              ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
          >
            <option value="nextReviewDate">Review Date</option>
            <option value="createdAt">Date Created</option>
            <option value="front">Question text</option>
          </select>

          {/* Order */}
          <select
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            className="border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
          >
            <option value="ASC">Ascending</option>
            <option value="DESC">Descending</option>
          </select>
        </div>
      </div>

      {error && <div className="p-4 mb-6 bg-red-100 text-red-700 rounded-lg">{error}</div>}

      {/* Grid of Flashcards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-neutral-100 dark:bg-neutral-800 h-48 rounded-xl"
            />
          ))}
        </div>
      ) : flashcards.length === 0 ? (
        <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
          No flashcards found. Create a new card to get started!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {flashcards.map((card) => (
            <div
              key={card.id}
              className="bg-white dark:bg-neutral-800 rounded-xl p-5 border border-neutral-200 dark:border-neutral-700 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-3">
                  <span className="text-xs font-semibold px-2 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-full">
                    {card.subject?.name || 'Subject'}
                  </span>
                  <button
                    onClick={() => handleDelete(card.id)}
                    className="text-neutral-400 hover:text-red-500 transition"
                    aria-label="Delete flashcard"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                  {card.front}
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-300">{card.back}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-700 flex justify-between items-center text-xs text-neutral-400">
                <span>Reps: {card.repetitions || 0}</span>
                <span>EF: {card.efactor?.toFixed(1) || '2.5'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-between items-center bg-white dark:bg-neutral-800 p-4 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700">
          <button
            onClick={handlePrevPage}
            disabled={page === 1 || loading}
            aria-label="Previous Page"
            className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 dark:hover:bg-neutral-900 transition text-neutral-700 dark:text-neutral-300"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <span className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">
            Page {page} of {pagination.totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={page === pagination.totalPages || loading}
            aria-label="Next Page"
            className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 dark:hover:bg-neutral-900 transition text-neutral-700 dark:text-neutral-300"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {showCreateModal && (
        <CreateDeckModal
          subjectId={subjects[0]?.id || ''}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setPage(1);
            dispatch(fetchFlashcards({ page: 1, limit: 12, sortBy, order }));
          }}
        />
      )}
    </div>
  );
};

export default Flashcards;
