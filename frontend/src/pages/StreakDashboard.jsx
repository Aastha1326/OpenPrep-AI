import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const StreakDashboard = () => {
    const [summary, setSummary] = useState(null);
    const [heatmap, setHeatmap] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [probability, setProbability] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [logStatus, setLogStatus] = useState('');

    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const [sumRes, heatRes, anRes, probRes, recRes] = await Promise.all([
                axios.get(`${API_URL}/streaks/summary`, { headers }),
                axios.get(`${API_URL}/streaks/heatmap`, { headers }),
                axios.get(`${API_URL}/streaks/analytics`, { headers }),
                axios.get(`${API_URL}/streaks/probability`, { headers }),
                axios.get(`${API_URL}/streaks/recommendations`, { headers })
            ]);

            setSummary(sumRes.data.data);
            setHeatmap(heatRes.data.data);
            setAnalytics(anRes.data.data);
            setProbability(probRes.data.data);
            setRecommendations(recRes.data.data);
        } catch (error) {
            console.error('Failed to load streak data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const handleLogActivity = async (type) => {
        try {
            const token = localStorage.getItem('token');
            setLogStatus(`Logging ${type}...`);
            await axios.post(`${API_URL}/streaks/log`, { activityType: type }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLogStatus('Activity logged successfully! Streak maintained.');
            // Refresh summary to see updated streak
            const sumRes = await axios.get(`${API_URL}/streaks/summary`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSummary(sumRes.data.data);
            setTimeout(() => setLogStatus(''), 3000);
        } catch (error) {
            console.error('Failed to log activity', error);
            setLogStatus('Error logging activity.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <p className="text-gray-600 dark:text-gray-400">Loading your streak dashboard...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Daily Study Streak</h1>
                    <p className="text-gray-600 dark:text-gray-400">Track your consistency, maintain your streak, and view your progress.</p>
                </div>

                {/* Hero Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-lg">
                        <h3 className="text-lg font-semibold opacity-90">Current Streak</h3>
                        <p className="text-4xl font-bold mt-2">{summary?.currentStreak || 0} <span className="text-xl font-normal">days</span></p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
                        <h3 className="text-lg font-semibold opacity-90">Longest Streak</h3>
                        <p className="text-4xl font-bold mt-2">{summary?.longestStreak || 0} <span className="text-xl font-normal">days</span></p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
                        <h3 className="text-lg font-semibold opacity-90">Total Study Minutes</h3>
                        <p className="text-4xl font-bold mt-2">{summary?.studyMinutes || 0}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
                        <h3 className="text-lg font-semibold opacity-90">Total XP</h3>
                        <p className="text-4xl font-bold mt-2">{summary?.xp || 0}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    {/* Quick Logger */}
                    <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Logger</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Did you study offline? Log an activity to maintain your streak.</p>
                        <div className="space-y-3">
                            <button onClick={() => handleLogActivity('quiz_attempt')} className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white">
                                📝 Log Quiz Attempt
                            </button>
                            <button onClick={() => handleLogActivity('flashcard_review')} className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white">
                                🗂️ Log Flashcard Review
                            </button>
                            <button onClick={() => handleLogActivity('pyq_upload')} className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white">
                                📄 Log PYQ Session
                            </button>
                        </div>
                        {logStatus && <p className="mt-4 text-sm font-medium text-green-600 dark:text-green-400">{logStatus}</p>}
                    </div>

                    {/* Streak Probabilities */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Maintenance Probability</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Based on your historical consistency, here is the likelihood of maintaining your streak.</p>
                        
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between text-sm font-medium mb-1 text-gray-900 dark:text-white">
                                    <span>7-Day Maintenance</span>
                                    <span>{probability?.sevenDayProbability || 0}%</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                                    <div className="bg-blue-600 h-4 rounded-full transition-all duration-1000" style={{ width: `${probability?.sevenDayProbability || 0}%` }}></div>
                                </div>
                            </div>
                            
                            <div>
                                <div className="flex justify-between text-sm font-medium mb-1 text-gray-900 dark:text-white">
                                    <span>30-Day Maintenance</span>
                                    <span>{probability?.thirtyDayProbability || 0}%</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                                    <div className="bg-purple-600 h-4 rounded-full transition-all duration-1000" style={{ width: `${probability?.thirtyDayProbability || 0}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* 12-Week Consistency Analytics */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">12-Week Consistency</h3>
                        <div className="flex items-end justify-between h-48 mt-8 space-x-2">
                            {analytics?.weeklyConsistencyPercentages?.map((percent, idx) => (
                                <div key={idx} className="flex flex-col items-center w-full group relative">
                                    <div className="w-full bg-blue-500 rounded-t-sm transition-all duration-300 hover:bg-blue-400" style={{ height: `${Math.max(percent, 5)}%` }}></div>
                                    <span className="text-xs text-gray-500 mt-2">W{12 - idx}</span>
                                    
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-2 py-1">
                                        {percent}%
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recommendations */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Personalized Recommendations</h3>
                        <div className="space-y-4">
                            {recommendations.map((rec, idx) => (
                                <div key={idx} className="p-4 border border-gray-100 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white">{rec.title}</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{rec.description}</p>
                                    </div>
                                    <Link to={rec.actionUrl} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                                        Start
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 90-Day Heatmap (Simplified View) */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-8">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">90-Day Activity Heatmap</h3>
                    <div className="flex flex-wrap gap-1">
                        {Array.from({ length: 90 }).map((_, i) => {
                            const d = new Date();
                            d.setDate(d.getDate() - (89 - i));
                            const dateStr = d.toISOString().split('T')[0];
                            const count = heatmap?.[dateStr] || 0;
                            
                            let color = 'bg-gray-100 dark:bg-gray-700';
                            if (count > 0 && count <= 2) color = 'bg-green-200 dark:bg-green-900/40';
                            if (count > 2 && count <= 5) color = 'bg-green-400 dark:bg-green-600';
                            if (count > 5) color = 'bg-green-600 dark:bg-green-500';

                            return (
                                <div 
                                    key={i} 
                                    className={`w-3 h-3 md:w-4 md:h-4 rounded-sm ${color}`}
                                    title={`${dateStr}: ${count} activities`}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StreakDashboard;
