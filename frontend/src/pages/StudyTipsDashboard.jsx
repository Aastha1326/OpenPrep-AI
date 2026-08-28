import React, { useState, useEffect, useCallback } from 'react';
import API from '../services/api';

const TIP_ICONS = { technique: '🧠', motivation: '🔥', weakness: '🎯', schedule: '📅', revision: '📖', general: '💡' };
const PRIORITY_BADGES = { high: 'bg-red-100 text-red-800', medium: 'bg-yellow-100 text-yellow-800', low: 'bg-green-100 text-green-800' };

const StudyTipsDashboard = () => {
  const [tips, setTips] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('tips');

  const fetchTips = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get('/study-tips/active');
      if (res.data.success) setTips(res.data.data);
    } catch (err) { setError(err.response?.data?.error || 'Failed to load tips'); }
    finally { setLoading(false); }
  }, []);

  const fetchStats = useCallback(async () => {
    try { const res = await API.get('/study-tips/stats'); if (res.data.success) setStats(res.data.data); } catch (e) { /* ignore */ }
  }, []);

  useEffect(() => { fetchTips(); fetchStats(); }, [fetchTips, fetchStats]);

  const handleGenerate = async () => {
    setGenerating(true); setError(null);
    try {
      const res = await API.post('/study-tips/generate');
      if (res.data.success) { setTips(res.data.data); fetchStats(); }
    } catch (err) { setError(err.response?.data?.error || 'Generation failed'); }
    finally { setGenerating(false); }
  };

  const handleRate = async (tipId, helpful) => {
    try { await API.put(`/study-tips/${tipId}/rate`, { helpful }); setTips((prev) => prev.filter((t) => t.id !== tipId)); fetchStats(); } catch (e) { /* ignore */ }
  };

  const handleDismiss = async (tipId) => {
    try { await API.put(`/study-tips/${tipId}/dismiss`); setTips((prev) => prev.filter((t) => t.id !== tipId)); } catch (e) { /* ignore */ }
  };

  const handleView = async (tipId) => {
    try { await API.put(`/study-tips/${tipId}/view`); } catch (e) { /* ignore */ }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4" /><p className="text-gray-600 dark:text-gray-400">Loading tips...</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">💡 Study Tips & Insights</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">AI-powered personalized tips based on your learning patterns</p>
          </div>
          <button onClick={handleGenerate} disabled={generating}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold rounded-lg shadow transition-all">
            {generating ? '⏳ Generating...' : '✨ Get Fresh Tips'}</button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700 text-sm">{error}</div>}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-200 dark:bg-gray-700 rounded-xl p-1">
          {['tips', 'history', 'stats'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow' : 'text-gray-600 dark:text-gray-300'}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
          ))}
        </div>

        {/* Tips Tab */}
        {activeTab === 'tips' && (
          <div className="space-y-4">
            {tips.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border p-12 text-center">
                <div className="text-5xl mb-4">🧠</div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Active Tips</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Generate personalized tips based on your study patterns and performance.</p>
                <button onClick={handleGenerate} disabled={generating}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold rounded-xl shadow-lg transition-all">
                  {generating ? 'Generating...' : 'Get My First Tips'}</button>
              </div>
            ) : tips.map((tip) => (
              <div key={tip.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 transition-all hover:shadow-md"
                onClick={() => handleView(tip.id)}>
                <div className="flex items-start gap-4">
                  <span className="text-2xl mt-1">{TIP_ICONS[tip.tipType] || '💡'}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{tip.title}</h3>
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${PRIORITY_BADGES[tip.priority]}`}>{tip.priority}</span>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 capitalize">{tip.tipType}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{tip.content}</p>
                    {tip.subjectContext && <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">📚 Related: {tip.subjectContext}</p>}
                    <div className="flex items-center gap-3 mt-4">
                      <button onClick={(e) => { e.stopPropagation(); handleRate(tip.id, true); }}
                        className="px-3 py-1 text-xs bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-100 transition-all">👍 Helpful</button>
                      <button onClick={(e) => { e.stopPropagation(); handleRate(tip.id, false); }}
                        className="px-3 py-1 text-xs bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-100 transition-all">👎 Not helpful</button>
                      <button onClick={(e) => { e.stopPropagation(); handleDismiss(tip.id); }}
                        className="px-3 py-1 text-xs text-gray-400 hover:text-red-500 transition-all">✕ Dismiss</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <TipsHistory />
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border p-6 text-center">
              <div className="text-4xl font-bold text-emerald-600">{stats.total}</div>
              <p className="text-sm text-gray-500 mt-2">Total Tips Generated</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border p-6 text-center">
              <div className="text-4xl font-bold text-blue-600">{stats.viewRate}%</div>
              <p className="text-sm text-gray-500 mt-2">View Rate</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border p-6 text-center">
              <div className="text-4xl font-bold text-purple-600">{stats.helpful}</div>
              <p className="text-sm text-gray-500 mt-2">Marked Helpful</p>
            </div>
            {stats.byType?.length > 0 && (
              <div className="md:col-span-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tips by Category</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {stats.byType.map((item) => (
                    <div key={item.tipType} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span className="text-xl">{TIP_ICONS[item.tipType]}</span>
                      <div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">{item.tipType}</span>
                        <span className="text-xs text-gray-500 ml-2">× {item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/** Inline history component that fetches all tips */
const TipsHistory = () => {
  const [tips, setTips] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await API.get(`/study-tips?page=${page}&limit=10`);
        if (res.data.success) { setTips(res.data.data); setTotalPages(res.data.totalPages); }
      } catch (e) { /* ignore */ }
    };
    fetch();
  }, [page]);

  return (
    <div className="space-y-3">
      {tips.length === 0 ? <p className="text-gray-500 text-center py-8">No tips generated yet.</p> : tips.map((tip) => (
        <div key={tip.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-4 flex items-center gap-3">
          <span className="text-xl">{TIP_ICONS[tip.tipType]}</span>
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-900 dark:text-white">{tip.title}</span>
            <p className="text-xs text-gray-500 mt-0.5">{new Date(tip.createdAt).toLocaleDateString()} · {tip.tipType} · {tip.viewed ? 'Viewed' : 'Unread'}</p>
          </div>
          {tip.helpful === true && <span className="text-green-500">👍</span>}
          {tip.helpful === false && <span className="text-red-400">👎</span>}
        </div>
      ))}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm disabled:opacity-50">← Prev</button>
          <span className="px-3 py-1 text-sm text-gray-500">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm disabled:opacity-50">Next →</button>
        </div>
      )}
    </div>
  );
};

export default StudyTipsDashboard;
