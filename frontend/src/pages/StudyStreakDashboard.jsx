import React, { useState, useEffect, useCallback } from 'react';
import API from '../services/api';

const INTENSITY_COLORS = ['bg-gray-200 dark:bg-gray-700', 'bg-emerald-200 dark:bg-emerald-900', 'bg-emerald-300 dark:bg-emerald-800', 'bg-emerald-400 dark:bg-emerald-700', 'bg-emerald-600 dark:bg-emerald-500'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const StudyStreakDashboard = () => {
  const [stats, setStats] = useState(null);
  const [heatmap, setHeatmap] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [recordForm, setRecordForm] = useState({ studyMinutes: 30, quizzesTaken: 0, topicsReviewed: 1, flashcardsReviewed: 0, xpEarned: 0 });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, heatRes, weekRes, predRes] = await Promise.all([
        API.get('/streaks/stats'),
        API.get('/streaks/heatmap?days=84'),
        API.get('/streaks/weekly?weeks=12'),
        API.get('/streaks/prediction'),
      ]);
      if (statsRes.data.success) setStats(statsRes.data.data);
      if (heatRes.data.success) setHeatmap(heatRes.data.data);
      if (weekRes.data.success) setWeekly(weekRes.data.data);
      if (predRes.data.success) setPrediction(predRes.data.data);
    } catch (err) { setError(err.response?.data?.error || 'Failed to load streak data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleRecord = async () => {
    setRecording(true); setError(null);
    try {
      const res = await API.post('/streaks/record', recordForm);
      if (res.data.success) {
        setStats(res.data.stats);
        setToast('🔥 Activity recorded! Keep the streak going!');
        setTimeout(() => setToast(null), 3000);
        fetchAll();
      }
    } catch (err) { setError(err.response?.data?.error || 'Failed to record'); }
    finally { setRecording(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4" /><p className="text-gray-600 dark:text-gray-400">Loading streak data...</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {toast && <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl shadow-2xl font-semibold animate-pulse">{toast}</div>}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">🔥 Study Streak Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Track your daily consistency and build powerful study habits</p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700 text-sm">{error}</div>}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-5 text-white shadow-lg">
              <div className="text-4xl font-bold">{stats.currentStreak}</div>
              <p className="text-sm opacity-90">🔥 Current Streak</p>
              <p className="text-xs opacity-70 mt-1">days in a row</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl p-5 text-white shadow-lg">
              <div className="text-4xl font-bold">{stats.longestStreak}</div>
              <p className="text-sm opacity-90">👑 Longest Streak</p>
              <p className="text-xs opacity-70 mt-1">personal best</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border p-5">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalStudyHours}h</div>
              <p className="text-xs text-gray-500">Total Study Hours</p>
              <p className="text-xs text-gray-400 mt-1">{stats.totalActiveDays} active days</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border p-5">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.thisWeek?.activeDays}/7</div>
              <p className="text-xs text-gray-500">This Week</p>
              <p className="text-xs text-gray-400 mt-1">{stats.thisWeek?.totalHours}h studied</p>
            </div>
          </div>
        )}

        {/* Calendar Heatmap */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📅 Activity Calendar</h3>
          <div className="flex gap-0.5 flex-wrap">
            {heatmap.map((day, i) => {
              const intensity = day.active ? Math.min(4, Math.ceil(day.intensity * 4)) : 0;
              return (
                <div key={i} className={`w-3 h-3 rounded-sm ${INTENSITY_COLORS[intensity]} cursor-pointer transition-all hover:scale-150`}
                  title={`${day.date}: ${day.studyMinutes}min`} />
              );
            })}
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
            <span>Less</span>
            {INTENSITY_COLORS.map((c, i) => <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />)}
            <span>More</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Weekly Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📊 Weekly Consistency</h3>
            <div className="space-y-2">
              {weekly.map((w, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-20 shrink-0">{w.weekLabel.slice(5)}</span>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-4 rounded-full transition-all flex items-center justify-end pr-2"
                      style={{ width: `${Math.max(5, w.consistencyPct)}%` }}>
                      {w.consistencyPct >= 20 && <span className="text-[10px] text-white font-bold">{w.consistencyPct}%</span>}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 w-12 text-right">{w.totalHours}h</span>
                </div>
              ))}
            </div>
          </div>

          {/* Prediction */}
          {prediction && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🔮 Streak Prediction</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                  <div className="text-3xl font-bold text-emerald-600">{prediction.predictedMaintain7Days}%</div>
                  <p className="text-xs text-gray-500">7-Day Prediction</p>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <div className="text-3xl font-bold text-blue-600">{prediction.predictedMaintain30Days}%</div>
                  <p className="text-xs text-gray-500">30-Day Prediction</p>
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Recent consistency:</span> {prediction.recentConsistency}%
                </p>
                <p className="text-sm text-violet-600 dark:text-violet-400 mt-2 italic">{prediction.recommendation}</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Record */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">⏱️ Record Today's Activity</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { key: 'studyMinutes', label: 'Study Min', icon: '📖', max: 600 },
              { key: 'quizzesTaken', label: 'Quizzes', icon: '📝', max: 50 },
              { key: 'topicsReviewed', label: 'Topics', icon: '📚', max: 50 },
              { key: 'flashcardsReviewed', label: 'Flashcards', icon: '🃏', max: 200 },
              { key: 'xpEarned', label: 'XP', icon: '⭐', max: 1000 },
            ].map((field) => (
              <div key={field.key}>
                <label className="text-xs text-gray-500 mb-1 block">{field.icon} {field.label}</label>
                <input type="number" min="0" max={field.max} value={recordForm[field.key]}
                  onChange={(e) => setRecordForm({ ...recordForm, [field.key]: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white text-sm" />
              </div>
            ))}
          </div>
          <button onClick={handleRecord} disabled={recording}
            className="mt-4 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold rounded-lg transition-all">
            {recording ? '⏳ Recording...' : '🔥 Log Activity'}</button>
        </div>
      </div>
    </div>
  );
};

export default StudyStreakDashboard;
