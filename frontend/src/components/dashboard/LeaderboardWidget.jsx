import { useState, useEffect, useCallback } from 'react';
import { Trophy, Users, Clock, Target, BookOpen, AlertCircle, RefreshCw } from 'lucide-react';
import API from '../../services/api';
import VintagePaper from './VintagePaper';

const TOP_N = 10;

const formatShortDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

const rankBadgeClass = (rank) => {
  if (rank === 1) return 'bg-yellow-500 text-black';
  if (rank === 2) return 'bg-neutral-300 text-neutral-800';
  if (rank === 3) return 'bg-amber-700 text-amber-50';
  return 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300';
};

const LeaderboardWidget = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await API.get('/leaderboard');
      if (res.data && res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load leaderboard', err);
      setError('Unable to load the weekly leaderboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  if (loading) {
    return (
      <VintagePaper className="border-t-4 border-t-yellow-600">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-neutral-300/60 dark:bg-neutral-600/60 rounded w-1/2 mb-4"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-9 bg-neutral-300/50 dark:bg-neutral-700/50 rounded"></div>
          ))}
        </div>
      </VintagePaper>
    );
  }

  if (error) {
    return (
      <VintagePaper className="border-t-4 border-t-red-700">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle className="w-10 h-10 text-red-700 mb-3" />
          <p className="text-neutral-700 dark:text-neutral-200 font-playfair font-bold">{error}</p>
          <button
            onClick={fetchLeaderboard}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-yellow-400 border border-yellow-700/50 rounded text-sm font-semibold transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </VintagePaper>
    );
  }

  const { weekStart, weekEnd, entries = [], currentUser, totalParticipants = 0 } = data || {};
  const currentUserId = currentUser?.userId;

  return (
    <VintagePaper className="border-t-4 border-t-yellow-600">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
        <div className="flex items-center gap-3">
          <Trophy className="w-7 h-7 text-yellow-600" />
          <h2 className="text-2xl font-bold font-playfair text-neutral-800 dark:text-neutral-100">
            Weekly Leaderboard
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {weekStart && weekEnd && (
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-full px-3 py-1">
              {formatShortDate(weekStart)} – {formatShortDate(weekEnd)}
            </span>
          )}
          <span className="text-xs font-bold text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-600/40 rounded-full px-3 py-1">
            Top {Math.min(entries.length, TOP_N) || TOP_N}
          </span>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Users className="w-12 h-12 text-neutral-400 dark:text-neutral-600 mb-3" />
          <p className="text-neutral-600 dark:text-neutral-300 font-playfair font-bold text-lg">
            No study activity this week yet
          </p>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1 max-w-xs">
            Log focus hours, finish quizzes and review flashcards to climb the leaderboard!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => {
            const isYou = entry.userId === currentUserId;
            return (
              <div
                key={entry.userId}
                className={`flex items-center gap-3 px-3 py-2 rounded-sm border ${
                  isYou
                    ? 'bg-yellow-100/70 dark:bg-yellow-900/30 border-yellow-600/50'
                    : 'bg-neutral-100/50 dark:bg-neutral-800/50 border-transparent'
                }`}
              >
                <span
                  className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-sm font-bold ${rankBadgeClass(
                    entry.rank
                  )}`}
                >
                  {entry.rank}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="font-playfair font-bold text-neutral-800 dark:text-neutral-100 truncate">
                    {entry.name}
                    {isYou && (
                      <span className="ml-2 text-[10px] uppercase tracking-wider text-yellow-700 dark:text-yellow-300">
                        (you)
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-3 mt-0.5">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {entry.weeklyHours.toFixed(1)}h
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Target className="w-3 h-3" /> {entry.quizzesCompleted} quizzes
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> {entry.flashcardsReviewed} cards
                    </span>
                  </p>
                </div>

                <span className="shrink-0 font-bold text-lg text-neutral-800 dark:text-white font-playfair">
                  {entry.score}
                </span>
              </div>
            );
          })}

          {currentUser && currentUser.rank > entries.length && (
            <p className="pt-2 text-sm text-neutral-600 dark:text-neutral-300 italic border-t border-neutral-300 dark:border-neutral-600">
              You are at <span className="font-bold not-italic">#{currentUser.rank}</span> this week
              (score {currentUser.score}).
            </p>
          )}
        </div>
      )}

      {totalParticipants > 0 && entries.length > 0 && (
        <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-400 italic border-t border-neutral-300 dark:border-neutral-600 pt-3">
          {totalParticipants} student{totalParticipants !== 1 ? 's' : ''} participated this week.
        </p>
      )}
    </VintagePaper>
  );
};

export default LeaderboardWidget;
