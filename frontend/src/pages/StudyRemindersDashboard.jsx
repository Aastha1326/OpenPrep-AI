import React, { useState, useEffect, useCallback } from 'react';
import API from '../services/api';

const TYPE_ICONS = { daily: '📅', weekly: '📆', before_exam: '🎯', spaced_review: '🔁', custom: '⏰' };
const PRIORITY_BADGES = { high: 'bg-red-100 text-red-800', medium: 'bg-yellow-100 text-yellow-800', low: 'bg-green-100 text-green-800' };
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const StudyRemindersDashboard = () => {
  const [reminders, setReminders] = useState([]);
  const [stats, setStats] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', reminderType: 'daily', scheduledTime: '09:00', scheduledDays: [1, 2, 3, 4, 5], priority: 'medium', subjectContext: '' });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [remRes, statsRes, sugRes] = await Promise.all([
        API.get('/reminders'), API.get('/reminders/stats'), API.get('/reminders/suggestions'),
      ]);
      if (remRes.data.success) setReminders(remRes.data.data);
      if (statsRes.data.success) setStats(statsRes.data.data);
      if (sugRes.data.success) setSuggestions(sugRes.data.data);
    } catch (err) { setError(err.response?.data?.error || 'Failed to load reminders'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title) return;
    try {
      const res = await API.post('/reminders', form);
      if (res.data.success) { setReminders((prev) => [res.data.data, ...prev]); setShowForm(false); setForm({ title: '', message: '', reminderType: 'daily', scheduledTime: '09:00', scheduledDays: [1, 2, 3, 4, 5], priority: 'medium', subjectContext: '' }); fetchAll(); }
    } catch (err) { setError(err.response?.data?.error || 'Failed to create'); }
  };

  const handleAcceptSuggestion = async (sug) => {
    try {
      const res = await API.post('/reminders', { ...sug, channel: 'in_app' });
      if (res.data.success) {
        setSuggestions((prev) => prev.filter((s) => s.title !== sug.title));
        setToast(`✅ Reminder created: ${sug.title}`);
        setTimeout(() => setToast(null), 3000);
        fetchAll();
      }
    } catch (err) { setError(err.response?.data?.error || 'Failed to accept'); }
  };

  const handleToggle = async (id) => {
    try { const res = await API.put(`/reminders/${id}/toggle`); if (res.data.success) setReminders((prev) => prev.map((r) => r.id === id ? res.data.data : r)); } catch (e) { /* ignore */ }
  };

  const handleSnooze = async (id) => {
    try { const res = await API.put(`/reminders/${id}/snooze`, { minutes: 30 }); if (res.data.success) { setReminders((prev) => prev.map((r) => r.id === id ? res.data.data : r)); setToast('⏰ Reminder snoozed 30 min'); setTimeout(() => setToast(null), 2000); } } catch (e) { /* ignore */ }
  };

  const handleDelete = async (id) => {
    try { await API.delete(`/reminders/${id}`); setReminders((prev) => prev.filter((r) => r.id !== id)); } catch (e) { /* ignore */ }
  };

  const toggleDay = (day) => setForm((prev) => ({ ...prev, scheduledDays: prev.scheduledDays.includes(day) ? prev.scheduledDays.filter((d) => d !== day) : [...prev.scheduledDays, day].sort() }));

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" /><p className="text-gray-600 dark:text-gray-400">Loading reminders...</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {toast && <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-xl shadow-2xl font-semibold">{toast}</div>}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">⏰ Study Reminders</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Smart reminders timed to your study patterns</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition-all">
            {showForm ? '✕ Cancel' : '+ New Reminder'}
          </button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700 text-sm">{error}</div>}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.active}</div><p className="text-xs text-gray-500">Active</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.totalTriggered}</div><p className="text-xs text-gray-500">Triggered</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.aiSuggested}</div><p className="text-xs text-gray-500">AI Suggested</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-4 text-center">
              <div className="flex gap-2 justify-center text-xs">
                <span>📅{stats.byType.daily}</span><span>📆{stats.byType.weekly}</span><span>🔁{stats.byType.spaced_review}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">By Type</p>
            </div>
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <form onSubmit={handleCreate} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">New Reminder</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white text-sm" required />
              <select value={form.reminderType} onChange={(e) => setForm({ ...form, reminderType: e.target.value })}
                className="px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white text-sm">
                <option value="daily">Daily</option><option value="weekly">Weekly</option>
                <option value="before_exam">Before Exam</option><option value="spaced_review">Spaced Review</option><option value="custom">Custom</option>
              </select>
              <input type="time" value={form.scheduledTime} onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })}
                className="px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white text-sm" />
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white text-sm">
                <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
              </select>
              <input type="text" placeholder="Subject (optional)" value={form.subjectContext} onChange={(e) => setForm({ ...form, subjectContext: e.target.value })}
                className="px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white text-sm" />
              <input type="text" placeholder="Message (optional)" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white text-sm" />
              {form.reminderType === 'weekly' && (
                <div className="md:col-span-2 flex gap-2">
                  {DAY_NAMES.map((d, i) => (
                    <button key={i} type="button" onClick={() => toggleDay(i)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${form.scheduledDays.includes(i) ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>{d}</button>
                  ))}
                </div>
              )}
            </div>
            <button type="submit" className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg">Create Reminder</button>
          </form>
        )}

        {/* AI Suggestions */}
        {suggestions.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">🤖 AI-Suggested Reminders</h3>
            <div className="space-y-3">
              {suggestions.map((sug, i) => (
                <div key={i} className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{TYPE_ICONS[sug.reminderType]}</span>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white text-sm">{sug.title}</span>
                      <p className="text-xs text-gray-500">{sug.message}</p>
                    </div>
                  </div>
                  <button onClick={() => handleAcceptSuggestion(sug)}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg whitespace-nowrap transition-all">
                    ✅ Accept</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reminders List */}
        <div className="space-y-3">
          {reminders.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border p-12 text-center">
              <div className="text-5xl mb-4">⏰</div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Reminders Yet</h2>
              <p className="text-gray-500 dark:text-gray-400">Create your first reminder or accept an AI suggestion above.</p>
            </div>
          ) : reminders.map((r) => (
            <div key={r.id} className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-4 flex items-center gap-4 transition-all ${!r.enabled ? 'opacity-50' : ''}`}>
              <span className="text-2xl">{TYPE_ICONS[r.reminderType]}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white text-sm">{r.title}</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${PRIORITY_BADGES[r.priority]}`}>{r.priority}</span>
                  {r.aiSuggested && <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-800">AI</span>}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {r.scheduledTime} · {r.reminderType} · {r.triggerCount}× triggered
                  {r.subjectContext && <> · 📚 {r.subjectContext}</>}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleToggle(r.id)} className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${r.enabled ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                  {r.enabled ? 'ON' : 'OFF'}</button>
                <button onClick={() => handleSnooze(r.id)} className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-all">Snooze</button>
                <button onClick={() => handleDelete(r.id)} className="px-3 py-1 text-xs text-red-400 hover:text-red-600 transition-all">✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudyRemindersDashboard;
