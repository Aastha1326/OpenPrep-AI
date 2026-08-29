import React, { useState, useEffect, useCallback } from 'react';
import API from '../services/api';

const PRIORITY_COLORS = { critical: 'bg-red-100 text-red-800', high: 'bg-orange-100 text-orange-800', medium: 'bg-yellow-100 text-yellow-800', low: 'bg-green-100 text-green-800' };
const TYPE_ICONS = { review: '📖', practice: '✏️', weakness: '🎯', revision: '🔄', rest: '😴' };
const INSIGHT_ICONS = { strength: '💪', weakness: '⚠️', risk: '🚨', opportunity: '🌟' };

const ExamStrategyCoach = () => {
  const [strategy, setStrategy] = useState(null);
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [examId, setExamId] = useState('');
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  const fetchActive = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get('/exam-strategies/active');
      if (res.data.success && res.data.data) { setStrategy(res.data.data); await API.put(`/exam-strategies/${res.data.data.id}/view`); }
    } catch (err) { setError(err.response?.data?.error || 'Failed to load strategy'); }
    finally { setLoading(false); }
  }, []);

  const fetchAll = useCallback(async () => {
    try { const res = await API.get('/exam-strategies'); if (res.data.success) setStrategies(res.data.data); } catch (e) { /* ignore */ }
  }, []);

  useEffect(() => { fetchActive(); fetchAll(); }, [fetchActive, fetchAll]);

  const handleGenerate = async () => {
    if (!examId.trim()) return;
    setGenerating(true); setError(null);
    try {
      const res = await API.post('/exam-strategies/generate', { examId: examId.trim() });
      if (res.data.success) { setStrategy(res.data.data); fetchAll(); }
    } catch (err) { setError(err.response?.data?.error || 'Generation failed'); }
    finally { setGenerating(false); }
  };

  const handleCompleteAction = async () => {
    if (!strategy) return;
    try { const res = await API.put(`/exam-strategies/${strategy.id}/complete-action`); if (res.data.success) setStrategy(res.data.data); } catch (e) { /* ignore */ }
  };

  const handleFeedback = async (rating) => {
    if (!strategy || feedbackGiven) return;
    try { await API.put(`/exam-strategies/${strategy.id}/feedback`, { rating }); setFeedbackGiven(true); } catch (e) { /* ignore */ }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" /><p className="text-gray-600 dark:text-gray-400">Loading strategy...</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div><h1 className="text-3xl font-bold text-gray-900 dark:text-white">🎯 Exam Strategy Coach</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">AI-powered exam-day strategy & battle card</p></div>
          <div className="flex items-center gap-3">
            <input type="text" value={examId} onChange={(e) => setExamId(e.target.value)} placeholder="Enter Exam ID"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
            <button onClick={handleGenerate} disabled={generating || !examId.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg shadow transition-all">
              {generating ? '⏳ Generating...' : '🤖 Generate Strategy'}</button>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700 text-sm">{error}</div>}

        {!strategy ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="text-6xl mb-4">🧠</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Active Strategy</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Generate an AI-powered exam strategy for personalised action plans and a battle card.</p>
            <input type="text" value={examId} onChange={(e) => setExamId(e.target.value)} placeholder="Enter your Exam ID"
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white w-full max-w-md mb-4" />
            <button onClick={handleGenerate} disabled={generating || !examId.trim()}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl shadow-lg transition-all">
              {generating ? 'Generating...' : 'Generate My Strategy'}</button>
          </div>
        ) : (
          <>
            {/* Title Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white mb-6 shadow-xl">
              <h2 className="text-2xl font-bold">{strategy.title}</h2>
              <div className="flex flex-wrap gap-4 mt-3 text-sm opacity-90">
                <span>📅 {strategy.inputSnapshot?.examDate || 'N/A'}</span>
                <span>⏰ {strategy.inputSnapshot?.daysUntilExam ?? '?'} days left</span>
                <span>📊 Readiness: {strategy.inputSnapshot?.overallReadinessScore ?? '?'}%</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-gray-200 dark:bg-gray-700 rounded-xl p-1 overflow-x-auto">
              {['overview', 'daily', 'battle-card', 'insights'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow' : 'text-gray-600 dark:text-gray-300'}`}>
                  {tab.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Priority Actions ({strategy.actionsCompleted}/{strategy.actionsTotal})</h3>
                  <div className="space-y-3">
                    {(strategy.priorityActions || []).slice(0, 6).map((a, i) => (
                      <div key={a.id || i} className={`p-3 rounded-lg border ${PRIORITY_COLORS[a.priority] || 'bg-gray-100'}`}>
                        <div className="flex justify-between items-start">
                          <div><span className="font-medium text-sm">{a.title}</span><p className="text-xs mt-1 opacity-80">{a.description}</p></div>
                          <span className="text-xs ml-2">{a.estimatedMinutes}m</span></div>
                        </div>
                    ))}
                  </div>
                  <button onClick={handleCompleteAction} className="mt-4 w-full py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg">✅ Mark Next Action Done</button>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📈 Readiness Prediction</h3>
                  {strategy.readinessPrediction && (<div className="space-y-4">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-blue-600">{strategy.readinessPrediction.predictedScore || 0}%</div>
                      <p className="text-gray-500 text-sm mt-1">Current: {strategy.readinessPrediction.currentScore || 0}% | Range: {strategy.readinessPrediction.confidenceInterval?.low || 0}%–{strategy.readinessPrediction.confidenceInterval?.high || 100}%</p>
                    </div>
                    <div className="space-y-2">{(strategy.readinessPrediction.keyDrivers || []).map((d, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm"><span>{d.impact === 'positive' ? '✅' : '❌'}</span><span className="text-gray-700 dark:text-gray-300">{d.factor}</span></div>
                    ))}</div>
                  </div>)}
                </div>
              </div>
            )}

            {/* Daily Tab */}
            {activeTab === 'daily' && (
              <div className="space-y-4">{(strategy.dailyBreakdown || []).map((day) => (
                <div key={day.day} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div><span className="text-xs font-bold text-blue-600 uppercase">Day {day.day}</span><h4 className="text-gray-900 dark:text-white font-semibold">{day.label}</h4><p className="text-sm text-gray-500">{day.focusArea}</p></div>
                    <span className="text-xs text-gray-400">{day.date}</span>
                  </div>
                  <div className="space-y-2">{(day.tasks || []).map((task, ti) => (
                    <div key={ti} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span>{TYPE_ICONS[task.type] || '📝'}</span>
                      <span className="text-sm text-gray-900 dark:text-white flex-1">{task.title}</span>
                      <span className="text-xs text-gray-400">{task.durationMinutes}m</span>
                    </div>
                  ))}</div>
                  {day.dailyGoal && <p className="mt-3 text-xs text-gray-500 italic">🎯 {day.dailyGoal}</p>}
                </div>
              ))}</div>
            )}

            {/* Battle Card Tab */}
            {activeTab === 'battle-card' && strategy.battleCard && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-xl lg:col-span-2">
                  <h3 className="text-xl font-bold mb-2">{strategy.battleCard.title}</h3>
                  <p className="text-sm opacity-90">{strategy.battleCard.motivationalMessage}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border p-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">⚡ Last-Minute Reminders</h4>
                  <ul className="space-y-2">{(strategy.battleCard.lastMinuteReminders || []).map((r, i) => (<li key={i} className="text-sm text-gray-700 dark:text-gray-300">• {r}</li>))}</ul>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border p-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">💡 Confidence Boosters</h4>
                  <ul className="space-y-2">{(strategy.battleCard.confidenceBoosters || []).map((b, i) => (<li key={i} className="text-sm text-green-700 dark:text-green-400">✓ {b}</li>))}</ul>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border p-6 lg:col-span-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">🚨 Risk Areas</h4>
                  <div className="space-y-2">{(strategy.battleCard.riskAreas || []).map((r, i) => (
                    <div key={i} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <span className="font-medium text-sm text-red-800 dark:text-red-300">{r.topic}</span>
                      <span className="text-xs text-red-600 dark:text-red-400 ml-2">— {r.mitigation}</span>
                    </div>
                  ))}</div>
                </div>
                {!feedbackGiven && (<div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border p-6 lg:col-span-2 text-center">
                  <p className="text-sm text-gray-500 mb-3">Was this strategy helpful?</p>
                  <div className="flex justify-center gap-2">{[1, 2, 3, 4, 5].map((r) => (
                    <button key={r} onClick={() => handleFeedback(r)} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-blue-100 rounded text-lg transition-all">{['😞', '😐', '🙂', '😊', '🤩'][r - 1]}</button>
                  ))}</div>
                </div>)}
              </div>
            )}

            {/* Insights Tab */}
            {activeTab === 'insights' && (
              <div className="space-y-4">{(strategy.aiInsights || []).map((insight, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border p-5 flex gap-4">
                  <span className="text-lg">{insight.type === 'strength' ? '💪' : insight.type === 'weakness' ? '⚠️' : insight.type === 'risk' ? '🚨' : '🌟'}</span>
                  <div><h4 className="font-semibold text-gray-900 dark:text-white">{insight.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{insight.description}</p>
                    {insight.actionable && <span className="inline-block mt-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">Actionable</span>}
                  </div>
                </div>
              ))}</div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ExamStrategyCoach;
