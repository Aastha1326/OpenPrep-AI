import React, { useState, useEffect, useCallback } from 'react';
import API from '../services/api';

const TIER_COLORS = { bronze: 'from-amber-600 to-yellow-700', silver: 'from-gray-400 to-slate-500', gold: 'from-yellow-400 to-amber-500', platinum: 'from-purple-400 to-indigo-500' };
const TIER_BADGES = { bronze: 'bg-amber-100 text-amber-800', silver: 'bg-gray-100 text-gray-800', gold: 'bg-yellow-100 text-yellow-800', platinum: 'bg-purple-100 text-purple-800' };
const STATUS_ICONS = { locked: '🔒', in_progress: '🔄', earned: '✨', claimed: '✅' };

const MilestoneRewardsDashboard = () => {
  const [milestones, setMilestones] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [toast, setToast] = useState(null);

  const fetchMilestones = useCallback(async () => {
    setLoading(true);
    try { const res = await API.get('/milestones'); if (res.data.success) setMilestones(res.data.data); }
    catch (err) { setError(err.response?.data?.error || 'Failed to load milestones'); }
    finally { setLoading(false); }
  }, []);

  const fetchStats = useCallback(async () => {
    try { const res = await API.get('/milestones/stats'); if (res.data.success) setStats(res.data.data); } catch (e) { /* ignore */ }
  }, []);

  useEffect(() => { fetchMilestones(); fetchStats(); }, [fetchMilestones, fetchStats]);

  const handleEvaluate = async () => {
    setEvaluating(true); setError(null);
    try {
      const res = await API.post('/milestones/evaluate');
      if (res.data.success) {
        setMilestones(res.data.data.milestones);
        fetchStats();
        if (res.data.data.newlyEarnedCount > 0) {
          setToast(`🎉 ${res.data.data.newlyEarnedCount} new milestone(s) earned!`);
          setTimeout(() => setToast(null), 4000);
        } else {
          setToast('No new milestones earned yet. Keep studying!');
          setTimeout(() => setToast(null), 3000);
        }
      }
    } catch (err) { setError(err.response?.data?.error || 'Evaluation failed'); }
    finally { setEvaluating(false); }
  };

  const handleClaim = async (milestoneId) => {
    try {
      const res = await API.put(`/milestones/${milestoneId}/claim`);
      if (res.data.success) {
        setMilestones((prev) => prev.map((m) => m.id === milestoneId ? { ...m, status: 'claimed', claimedAt: res.data.data.claimedAt } : m));
        fetchStats();
        setToast(`🏆 Reward claimed: ${res.data.data.rewardLabel}`);
        setTimeout(() => setToast(null), 3000);
      }
    } catch (err) { setError(err.response?.data?.error || 'Failed to claim'); }
  };

  const filtered = milestones.filter((m) => filter === 'all' || m.status === filter || (filter === 'available' && m.status === 'earned'));

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4" /><p className="text-gray-600 dark:text-gray-400">Loading milestones...</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Toast */}
        {toast && <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-6 py-3 rounded-xl shadow-2xl font-semibold animate-pulse">{toast}</div>}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">🏆 Milestone Rewards</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Earn badges and rewards as you hit learning milestones</p>
          </div>
          <button onClick={handleEvaluate} disabled={evaluating}
            className="px-6 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-semibold rounded-lg shadow transition-all">
            {evaluating ? '⏳ Evaluating...' : '🔄 Check Progress'}</button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700 text-sm">{error}</div>}

        {/* Stats Bar */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-4 text-center">
              <div className="text-2xl font-bold text-amber-600">{stats.total}</div><p className="text-xs text-gray-500">Total</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.earned + stats.claimed}</div><p className="text-xs text-gray-500">Earned</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div><p className="text-xs text-gray-500">In Progress</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.totalXpEarned}</div><p className="text-xs text-gray-500">XP Earned</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-4 text-center">
              <div className="flex justify-center gap-1 text-sm">
                <span className="text-amber-600">🥉{stats.byTier.bronze}</span>
                <span className="text-gray-500">🥈{stats.byTier.silver}</span>
                <span className="text-yellow-500">🥇{stats.byTier.gold}</span>
                <span className="text-purple-500">💎{stats.byTier.platinum}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Badges by Tier</p>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-1 mb-6 bg-gray-200 dark:bg-gray-700 rounded-xl p-1 overflow-x-auto">
          {['all', 'available', 'in_progress', 'locked', 'claimed'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${filter === f ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow' : 'text-gray-600 dark:text-gray-300'}`}>
              {f.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</button>
          ))}
        </div>

        {/* Milestones Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="md:col-span-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border p-12 text-center">
              <div className="text-5xl mb-4">🏆</div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">No milestones found</h2>
              <p className="text-gray-500 mt-2">Click "Check Progress" to evaluate your milestones.</p>
            </div>
          ) : filtered.map((m) => (
            <div key={m.id} className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border overflow-hidden transition-all hover:shadow-md ${m.status === 'earned' ? 'ring-2 ring-amber-400' : ''}`}>
              {/* Tier Header */}
              <div className={`bg-gradient-to-r ${TIER_COLORS[m.tier]} px-4 py-3 flex justify-between items-center`}>
                <span className="text-2xl">{m.icon}</span>
                <span className={`px-2 py-0.5 text-xs rounded-full font-bold uppercase ${m.status === 'earned' ? 'bg-white/30 text-white' : 'bg-white/20 text-white/80'}`}>{m.tier}</span>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{m.title}</h3>
                  <span>{STATUS_ICONS[m.status]}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{m.description}</p>
                {/* Progress */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{m.currentValue} / {m.targetValue} {m.unit}</span>
                    <span>{Math.min(100, Math.round((m.currentValue / m.targetValue) * 100))}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className={`bg-gradient-to-r ${TIER_COLORS[m.tier]} h-2 rounded-full transition-all`}
                      style={{ width: `${Math.min(100, (m.currentValue / m.targetValue) * 100)}%` }} />
                  </div>
                </div>
                {/* Reward */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Reward: <span className="font-medium text-gray-700 dark:text-gray-300">{m.rewardLabel}</span></span>
                  {m.status === 'earned' && (
                    <button onClick={() => handleClaim(m.id)}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-all animate-pulse">
                      🎁 Claim</button>
                  )}
                  {m.status === 'claimed' && <span className="text-xs text-green-600 font-medium">✅ Claimed</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MilestoneRewardsDashboard;
