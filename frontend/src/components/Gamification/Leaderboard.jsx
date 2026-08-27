/**
 * @fileoverview Component for displaying the global or subject-specific leaderboard.
 */
import React from 'react';

const Leaderboard = ({ data, currentUserRank }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    Global Leaderboard
                </h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3 font-medium">Rank</th>
                            <th className="px-6 py-3 font-medium">Student</th>
                            <th className="px-6 py-3 font-medium text-right">Total XP</th>
                            <th className="px-6 py-3 font-medium text-right">Badges</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {data.map((user) => (
                            <tr
                                key={user.rank}
                                className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${currentUserRank === user.rank ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                    }`}
                            >
                                <td className="px-6 py-4">
                                    {user.rank <= 3 ? (
                                        <span className={`text-lg font-bold ${user.rank === 1 ? 'text-yellow-500' : user.rank === 2 ? 'text-gray-400' : 'text-amber-600'
                                            }`}>
                                            #{user.rank}
                                        </span>
                                    ) : (
                                        <span className="text-gray-600 dark:text-gray-400">#{user.rank}</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                    {user.username} {currentUserRank === user.rank && <span className="text-xs text-blue-600 dark:text-blue-400 ml-1">(You)</span>}
                                </td>
                                <td className="px-6 py-4 text-right font-mono text-gray-700 dark:text-gray-300">{user.totalXP.toLocaleString()}</td>
                                <td className="px-6 py-4 text-right">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                                        {user.badges}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Leaderboard;
