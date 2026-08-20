/**
 * @fileoverview Main dashboard page for Interview Analytics, featuring trend charts and keyword analysis.
 */
import React, { useState, useEffect } from 'react';
import ConfidenceTrendChart from '../components/Analytics/ConfidenceTrendChart';
import axios from 'axios';

const InterviewAnalyticsDashboard = () => {
    const [timeRange, setTimeRange] = useState(30);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    // Mock user ID for demonstration
    const userId = 'user-123';

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError('');
            try {
                const response = await axios.get(`${API_URL}/analytics/interview/user/${userId}?days=${timeRange}`);
                if (response.data.success) {
                    setAnalyticsData(response.data.data);
                } else {
                    setError('Failed to load analytics data.');
                }
            } catch (err) {
                console.error('Analytics fetch error:', err);
                setError('Network error. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [timeRange]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="flex flex-col items-center gap-4">
                    <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-gray-600 dark:text-gray-400">Loading your performance insights...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Interview Analytics</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Track your confidence and communication improvements over time.</p>
                    </div>

                    <div className="flex bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1">
                        {[7, 30, 90].map((days) => (
                            <button
                                key={days}
                                onClick={() => setTimeRange(days)}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${timeRange === days
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                {days} Days
                            </button>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
                        {error}
                    </div>
                )}

                {analyticsData && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Chart */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Confidence Trend</h2>
                                <ConfidenceTrendChart data={analyticsData.trend} />
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                                <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">💡 Coach's Tip</h3>
                                <p className="text-blue-800 dark:text-blue-300 text-sm">
                                    Your confidence has been steadily increasing! Try to maintain this momentum by practicing with the
                                    <span className="font-semibold"> AI Oral Viva Simulator</span> at least twice a week. Focus on reducing filler words to push your score above 8/10.
                                </p>
                            </div>
                        </div>

                        {/* Sidebar Stats */}
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Avg. Confidence</p>
                                <p className="text-5xl font-bold text-blue-600 dark:text-blue-400 mt-2">{analyticsData.averageConfidence}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">out of 10</p>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Top Keywords Used</h3>
                                <div className="flex flex-wrap gap-2">
                                    {analyticsData.topKeywords.map((keyword, idx) => (
                                        <span
                                            key={idx}
                                            className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium"
                                        >
                                            {keyword}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InterviewAnalyticsDashboard;
