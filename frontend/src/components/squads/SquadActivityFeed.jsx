import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Flame, Trophy, Award, Zap, Filter, Download, X, RefreshCw, Loader2 } from 'lucide-react';
import { socket, connectSocket } from '../../services/socket';
import API from '../../services/api';

const EMOJIS = ['🔥', '👏', '🎯'];

const ACTIVITY_ICONS = {
  quiz_completed: Zap,
  streak_hit: Flame,
  badge_unlocked: Award,
};

const ACTIVITY_TYPES = [
  { value: 'quiz_completed', label: 'Quiz Completed' },
  { value: 'streak_hit', label: 'Streak Hit' },
  { value: 'badge_unlocked', label: 'Badge Unlocked' },
];

export default function SquadActivityFeed({ squadId }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reconnecting, setReconnecting] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState({
    activityType: '',
    userId: '',
    dateFrom: '',
    dateTo: '',
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams();
    params.append('limit', '50');
    params.append('offset', String(page * 50));
    if (filters.activityType) params.append('activityType', filters.activityType);
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    return params.toString();
  }, [page, filters]);

  const fetchFeed = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setPage(0);
        setActivities([]);
        setHasMore(true);
      }
      setLoading(true);
      setError('');
      const query = buildQueryParams();
      const res = await API.get(`/squads/${squadId}/activity?${query}`);
      const newActivities = res.data || [];
      setActivities((prev) => (reset ? newActivities : [...prev, ...newActivities]));
      setHasMore(newActivities.length === 50);
      if (!reset) setPage((p) => p + 1);
    } catch (err) {
      setError('Could not load the activity feed.');
    } finally {
      setLoading(false);
    }
  }, [squadId, buildQueryParams]);

  useEffect(() => {
    fetchFeed(true);
  }, [fetchFeed, filters]);

  useEffect(() => {
    connectSocket();
    socket.emit('join_squad_room', { squadId });

    const handleNewActivity = (data) => {
      if (data.squadId !== squadId) return;
      setActivities((prev) => [
        {
          id: data.activity.id,
          activityType: data.activity.activityType,
          message: data.activity.message,
          reactionCounts: data.activity.reactionCounts || {},
          myReactions: [],
          createdAt: data.activity.createdAt,
          user: { id: data.activity.userId, name: data.activity.userName },
        },
        ...prev,
      ]);
    };

    const handleReaction = (data) => {
      if (data.squadId !== squadId) return;
      setActivities((prev) =>
        prev.map((a) =>
          a.id === data.activityId ? { ...a, reactionCounts: data.reactionCounts } : a
        )
      );
    };

    socket.on('squad:activity_new', handleNewActivity);
    socket.on('squad:activity_reaction', handleReaction);

    socket.io.on('reconnect_attempt', () => setReconnecting(true));
    socket.io.on('reconnect', () => {
      setReconnecting(false);
      fetchFeed(true);
    });
    socket.io.on('reconnect_error', () => setReconnecting(false));

    return () => {
      socket.emit('leave_squad_room', { squadId });
      socket.off('squad:activity_new', handleNewActivity);
      socket.off('squad:activity_reaction', handleReaction);
      socket.io.off('reconnect_attempt');
      socket.io.off('reconnect');
      socket.io.off('reconnect_error');
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [squadId, fetchFeed]);

  useEffect(() => {
    if (!hasMore || loading) return;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchFeed(false);
        }
      },
      { threshold: 0.1 }
    );
    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [hasMore, loading, fetchFeed]);

  const handleReact = async (activityId, emoji) => {
    setActivities((prev) =>
      prev.map((a) => {
        if (a.id !== activityId) return a;
        const alreadyReacted = a.myReactions.includes(emoji);
        const nextCount = (a.reactionCounts[emoji] || 0) + (alreadyReacted ? -1 : 1);
        return {
          ...a,
          reactionCounts: { ...a.reactionCounts, [emoji]: Math.max(0, nextCount) },
          myReactions: alreadyReacted
            ? a.myReactions.filter((e) => e !== emoji)
            : [...a.myReactions, emoji],
        };
      })
    );

    try {
      await API.post(`/squads/${squadId}/activity/${activityId}/react`, { emoji });
    } catch (err) {
      fetchFeed(true);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ activityType: '', userId: '', dateFrom: '', dateTo: '' });
  };

  const hasActiveFilters = Object.values(filters).some((v) => v);

  const exportCSV = () => {
    const headers = ['Date', 'User', 'Activity Type', 'Message', 'Reactions'];
    const rows = activities.map((a) => [
      new Date(a.createdAt).toLocaleString(),
      a.user?.name || 'Unknown',
      a.activityType,
      a.message,
      Object.entries(a.reactionCounts || {}).map(([emoji, count]) => `${emoji}${count}`).join(' '),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `squad-activity-${squadId}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getActivityTypeLabel = (type) => {
    const found = ACTIVITY_TYPES.find((t) => t.value === type);
    return found ? found.label : type;
  };

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-md border border-slate-700">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h3 className="text-lg font-bold">Activity Feed</h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setFilterOpen(!filterOpen)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors flex items-center gap-1.5 ${
              filterOpen || hasActiveFilters
                ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-500'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>

          <button
            type="button"
            onClick={exportCSV}
            disabled={activities.length === 0}
            className="px-3 py-1.5 text-sm rounded-lg border transition-colors flex items-center gap-1.5 bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>

          <button
            type="button"
            onClick={() => fetchFeed(true)}
            disabled={loading}
            className="px-3 py-1.5 text-sm rounded-lg border transition-colors flex items-center gap-1.5 bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {filterOpen && (
        <div className="mb-4 p-4 bg-slate-700 rounded-lg border border-slate-600 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-slate-200">Filters</h4>
            <button
              type="button"
              onClick={() => setFilterOpen(false)}
              className="text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Activity Type</label>
              <select
                value={filters.activityType}
                onChange={(e) => handleFilterChange('activityType', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Types</option>
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">User ID</label>
              <input
                type="text"
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
                placeholder="Filter by user ID"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Date From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Date To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm text-indigo-400 hover:text-indigo-300 underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {reconnecting && (
        <div className="mb-4 p-2 bg-yellow-900/30 border border-yellow-700/50 rounded-lg flex items-center gap-2 text-yellow-200 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Reconnecting to server...
        </div>
      )}

      {loading && !page && <p className="text-slate-400 text-sm">Loading activity...</p>}
      {!loading && error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {!loading && !error && activities.length === 0 && (
        <p className="text-slate-400 text-sm">
          No activity yet. Complete a quiz, hit a streak, or unlock a badge to show up here!
        </p>
      )}

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {activities.map((activity) => {
          const Icon = ACTIVITY_ICONS[activity.activityType] || Trophy;
          return (
            <div key={activity.id} className="p-3 bg-slate-700 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-indigo-300" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-200">
                    <span className="font-semibold">{activity.user?.name || 'A squad member'}</span>{' '}
                    {activity.message}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-slate-500">
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                    <span className="px-1.5 py-0.5 text-xs bg-slate-800 border border-slate-600 rounded text-slate-400">
                      {getActivityTypeLabel(activity.activityType)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2 ml-11">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleReact(activity.id, emoji)}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors flex items-center gap-1 ${
                      activity.myReactions.includes(emoji)
                        ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                        : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <span>{emoji}</span>
                    <span>{activity.reactionCounts[emoji] || 0}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        <div ref={loadMoreRef} className="h-4" />
        {hasMore && !loading && (
          <p className="text-center text-slate-500 text-sm py-2">Scroll for more...</p>
        )}
      </div>
    </div>
  );
}