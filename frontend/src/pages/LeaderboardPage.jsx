import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Trophy, Crown, Flame, Award, HelpCircle, Search, RefreshCw, Sparkles, User as UserIcon } from 'lucide-react';
import API from '../services/api';

export function LeaderboardPage() {
  const { user } = useSelector((state) => state.auth || {});
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeRange] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/leaderboard?timeframe=${timeframe}&limit=50`);
      if (res.data?.success) {
        setLeaderboard(res.data.leaderboard || []);
        setCurrentUserRank(res.data.currentUserRank || null);
      }
    } catch (err) {
      console.warn('Failed to load leaderboard data:', err.message);
      // Fallback preview data
      setLeaderboard([
        { userId: '1', name: 'Alex Rivera', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Alex', totalPoints: 1450, xp: 950, badgesCount: 8, currentStreak: 12, rank: 1, badgeTag: '🥇 Gold Champion' },
        { userId: '2', name: 'Sam Chen', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Sam', totalPoints: 1220, xp: 810, badgesCount: 6, currentStreak: 9, rank: 2, badgeTag: '🥈 Silver Competitor' },
        { userId: '3', name: 'Jordan Taylor', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Jordan', totalPoints: 1050, xp: 720, badgesCount: 5, currentStreak: 7, rank: 3, badgeTag: '🥉 Bronze Achiever' },
        { userId: '4', name: 'Taylor Swift', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Taylor', totalPoints: 890, xp: 600, badgesCount: 4, currentStreak: 5, rank: 4 },
        { userId: '5', name: 'Morgan Freeman', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Morgan', totalPoints: 760, xp: 510, badgesCount: 3, currentStreak: 4, rank: 5 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [timeframe]);

  const filteredParticipants = leaderboard.filter((item) =>
    (item.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const topThree = leaderboard.slice(0, 3);
  const remainingRanks = filteredParticipants.slice(topThree.length);

  return (
    <div className="min-h-screen bg-[#FFFBE9] dark:bg-[#080808] text-[#1F150C] dark:text-[#E1DCC9] p-6 md:p-8 transition-colors font-inter">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-2xl">
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-playfair">
                Global Gamification Leaderboard
              </h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Compete with fellow students, earn milestone badges, and climb the global rankings.
              </p>
            </div>
          </div>

          {/* Timeframe Controls */}
          <div className="flex items-center space-x-2 bg-neutral-100 dark:bg-neutral-800 p-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 self-start md:self-auto">
            {['all', 'weekly', 'monthly'].map((t) => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                  timeframe === t
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </header>

        {/* TOP 3 PODIUM SECTION */}
        {topThree.length >= 3 && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            {/* Rank 2 - Silver */}
            <div className="md:order-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 text-center shadow-md relative flex flex-col items-center justify-between">
              <div className="absolute -top-3 px-3 py-1 bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-full text-xs font-bold uppercase tracking-wider flex items-center space-x-1">
                <span>🥈 2nd Place</span>
              </div>
              <img
                src={topThree[1].avatar}
                alt={topThree[1].name}
                className="w-20 h-20 rounded-full border-4 border-slate-300 dark:border-slate-700 mt-4 mb-3"
              />
              <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{topThree[1].name}</h3>
              <p className="text-xs text-neutral-500 font-mono mt-1">{topThree[1].totalPoints} PTS</p>
              <div className="mt-4 flex items-center justify-center space-x-3 text-xs text-neutral-400 font-mono">
                <span>⚡ {topThree[1].xp} XP</span>
                <span>🏅 {topThree[1].badgesCount} Badges</span>
              </div>
            </div>

            {/* Rank 1 - Gold */}
            <div className="md:order-2 bg-gradient-to-b from-amber-500/20 via-white dark:via-neutral-900 to-amber-500/10 border-2 border-amber-500 rounded-3xl p-6 text-center shadow-xl relative flex flex-col items-center justify-between scale-105">
              <div className="absolute -top-4 px-4 py-1.5 bg-amber-500 text-white rounded-full text-xs font-black uppercase tracking-wider flex items-center space-x-1 shadow-lg shadow-amber-500/40">
                <Crown className="w-4 h-4 fill-current" />
                <span>🥇 Champion</span>
              </div>
              <img
                src={topThree[0].avatar}
                alt={topThree[0].name}
                className="w-24 h-24 rounded-full border-4 border-amber-500 mt-4 mb-3 shadow-lg shadow-amber-500/30"
              />
              <h3 className="text-xl font-black text-neutral-900 dark:text-neutral-100">{topThree[0].name}</h3>
              <p className="text-sm font-bold text-amber-600 dark:text-amber-400 font-mono mt-1">{topThree[0].totalPoints} TOTAL PTS</p>
              <div className="mt-4 flex items-center justify-center space-x-3 text-xs text-neutral-400 font-mono">
                <span>⚡ {topThree[0].xp} XP</span>
                <span>🏅 {topThree[0].badgesCount} Badges</span>
                <span>🔥 {topThree[0].currentStreak}d</span>
              </div>
            </div>

            {/* Rank 3 - Bronze */}
            <div className="md:order-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 text-center shadow-md relative flex flex-col items-center justify-between">
              <div className="absolute -top-3 px-3 py-1 bg-amber-800/40 border border-amber-700/50 text-amber-300 rounded-full text-xs font-bold uppercase tracking-wider flex items-center space-x-1">
                <span>🥉 3rd Place</span>
              </div>
              <img
                src={topThree[2].avatar}
                alt={topThree[2].name}
                className="w-20 h-20 rounded-full border-4 border-amber-800/50 mt-4 mb-3"
              />
              <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{topThree[2].name}</h3>
              <p className="text-xs text-neutral-500 font-mono mt-1">{topThree[2].totalPoints} PTS</p>
              <div className="mt-4 flex items-center justify-center space-x-3 text-xs text-neutral-400 font-mono">
                <span>⚡ {topThree[2].xp} XP</span>
                <span>🏅 {topThree[2].badgesCount} Badges</span>
              </div>
            </div>
          </section>
        )}

        {/* SEARCH & PARTICIPANT LIST TABLE */}
        <section className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h3 className="text-lg font-bold font-playfair">Global Participant Rankings</h3>
            
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
              <input
                type="text"
                placeholder="Search participants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-neutral-400 flex items-center justify-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Fetching rankings...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 font-semibold">
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Participant</th>
                    <th className="py-3 px-4">Streak</th>
                    <th className="py-3 px-4">Badges</th>
                    <th className="py-3 px-4">XP</th>
                    <th className="py-3 px-4 text-right">Total Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {filteredParticipants.map((participant) => {
                    const isCurrentUser = user && user.id === participant.userId;

                    return (
                      <tr
                        key={participant.userId}
                        className={`transition hover:bg-neutral-50 dark:hover:bg-neutral-850 ${
                          isCurrentUser ? 'bg-amber-500/10 font-bold' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 font-mono font-bold">
                          #{participant.rank}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-3">
                            <img
                              src={participant.avatar}
                              alt={participant.name}
                              className="w-8 h-8 rounded-full border border-neutral-300 dark:border-neutral-700"
                            />
                            <div>
                              <span className="font-bold text-neutral-900 dark:text-neutral-100 block">
                                {participant.name} {isCurrentUser && '(You)'}
                              </span>
                              {participant.badgeTag && (
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">
                                  {participant.badgeTag}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono">
                          🔥 {participant.currentStreak || 0}d
                        </td>

                        <td className="py-3.5 px-4 font-mono">
                          🏅 {participant.badgesCount || 0}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-neutral-500">
                          {participant.xp || 0} XP
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                          {participant.totalPoints} PTS
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* LOGGED IN USER POSITION FOOTER */}
        {currentUserRank && (
          <div className="sticky bottom-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between border border-amber-400/40 font-mono">
            <div className="flex items-center space-x-3">
              <UserIcon className="w-5 h-5 text-amber-200" />
              <div>
                <span className="text-xs text-amber-200 font-sans block">Your Leaderboard Standing</span>
                <span className="text-sm font-bold">Rank #{currentUserRank.rank} — {currentUserRank.totalPoints} Total PTS</span>
              </div>
            </div>
            <div className="text-xs text-amber-100">
              🏅 {currentUserRank.badgesCount || 0} Badges • 🔥 {currentUserRank.currentStreak || 0}d Streak
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default LeaderboardPage;
