/**
 * @fileoverview Main dashboard showcasing user streaks, badges, and the global leaderboard.
 */
import React, { useState, useEffect } from 'react';
import Leaderboard from '../components/Gamification/Leaderboard';
import axios from 'axios';

const GamificationDashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [timeframe, setTimeframe] = useState('all_time');

    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get(`${API_URL}/gamification/dashboard?timeframe=${timeframe}`);
                if (response.data.success) {
                    setDashboardData(response.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch gamification data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [timeframe]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="flex flex-col items-center gap-4">
                    <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-gray-600 dark:text-gray-400">Loading your achievements...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Gamification Dashboard</h1>
                    <p className="text-gray-600 dark:text-gray-400">Track your progress, maintain your streaks, and compete with peers.</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold opacity-90">Current Streak</h3>
                            <span className="text-3xl">🔥</span>
                        </div>
                        <p className="text-4xl font-bold">{dashboardData.userStats.currentStreak} <span className="text-lg font-normal opacity-80">days</span></p>
                        <p className="text-sm opacity-80 mt-2">Longest: {dashboardData.userStats.longestStreak} days</p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold opacity-90">Total XP</h3>
                            <span className="text-3xl">⚡</span>
                        </div>
                        <p className="text-4xl font-bold">{dashboardData.userStats.totalXP.toLocaleString()}</p>
                        <p className="text-sm opacity-80 mt-2">Keep studying to earn more!</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold opacity-90">Badges Earned</h3>
                            <span className="text-3xl">🏆</span>
                        </div>
                        <p className="text-4xl font-bold">{dashboardData.userStats.unlockedBadges.length}</p>
                        <p className="text-sm opacity-80 mt-2">Check your collection below</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Badges Collection */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Your Badges</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {dashboardData.userStats.unlockedBadges.map((badge, idx) => (
                                    <div key={idx} className="flex flex-col items-center text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600">
                                        <span className="text-4xl mb-2">{badge.icon}</span>
                                        <span className="font-semibold text-sm text-gray-900 dark:text-white">{badge.name}</span>
                                    </div>
                                ))}
                                {/* Placeholder for locked badge */}
                                <div className="flex flex-col items-center text-center p-4 bg-gray-100 dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 opacity-60">
                                    <span className="text-4xl mb-2 grayscale">🔒</span>
                                    <span className="font-semibold text-sm text-gray-500 dark:text-gray-400">???</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Leaderboard */}
                    <div className="lg:col-span-2">
                        <div className="flex justify-end mb-4">
                            <select
                                value={timeframe}
                                onChange={(e) => setTimeframe(e.target.value)}
                                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all_time">All Time</option>
                                <option value="this_month">This Month</option>
                                <option value="this_week">This Week</option>
                            </select>
                        </div>
                        <Leaderboard
                            data={dashboardData.leaderboard}
                            currentUserRank={4} // Mocked current user rank
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GamificationDashboard;
