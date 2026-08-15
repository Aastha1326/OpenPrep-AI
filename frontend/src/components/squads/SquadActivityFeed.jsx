import React, { useState, useEffect, useCallback } from 'react';
import { Flame, Trophy, Award, Zap } from 'lucide-react';
import { socket, connectSocket } from '../../services/socket';
import API from '../../services/api';

const EMOJIS = ['🔥', '👏', '🎯'];

const ACTIVITY_ICONS = {
  quiz_completed: Zap,
  streak_hit: Flame,
  badge_unlocked: Award,
};

export default function SquadActivityFeed({ squadId }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFeed = useCallback(async () => {
    try {
      const res = await API.get(`/squads/${squadId}/activity`);
      setActivities(res.data || []);
    } catch (err) {
      setError('Could not load the activity feed.');
    } finally {
      setLoading(false);
    }
  }, [squadId]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

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

    return () => {
      socket.emit('leave_squad_room', { squadId });
      socket.off('squad:activity_new', handleNewActivity);
      socket.off('squad:activity_reaction', handleReaction);
    };
  }, [squadId]);

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
      fetchFeed();
    }
  };

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-md border border-slate-700">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-amber-400" />
        <h3 className="text-lg font-bold">Activity Feed</h3>
      </div>

      {loading && <p className="text-slate-400 text-sm">Loading activity...</p>}
      {!loading && error && <p className="text-red-400 text-sm">{error}</p>}
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
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(activity.createdAt).toLocaleString()}
                  </p>
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
      </div>
    </div>
  );
}