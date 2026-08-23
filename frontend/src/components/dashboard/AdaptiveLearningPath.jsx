import React, { useState, useEffect } from 'react';
import { Compass, CheckCircle2, Clock, AlertTriangle, RefreshCw, BookOpen, FileText, HelpCircle, ExternalLink, Play, ChevronRight } from 'lucide-react';
import API from '../../services/api';

const AdaptiveLearningPath = () => {
  const [path, setPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [goalInput, setGoalInput] = useState('Prepare for SAT & Board Exams');
  const [expandedItem, setExpandedItem] = useState(null);

  const fetchCurrentPath = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get('/learning-path');
      if (res.data?.success) {
        setPath(res.data.data);
        if (res.data.data?.goal) {
          setGoalInput(res.data.data.goal);
        }
      }
    } catch (err) {
      console.warn('Failed to load learning path:', err);
      setError('Failed to load adaptive learning path.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentPath();
  }, []);

  const handleGeneratePath = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await API.post('/learning-path/generate', { goal: goalInput });
      if (res.data?.success) {
        setPath(res.data.data);
      }
    } catch (err) {
      setError('Failed to generate new learning path.');
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateStatus = async (itemId, newStatus) => {
    try {
      const res = await API.patch(`/learning-path/item/${itemId}`, { status: newStatus });
      if (res.data?.success) {
        setPath(res.data.data);
      }
    } catch (err) {
      console.error('Failed to update path item:', err);
    }
  };

  const getStatusBadge = (masteryStatus) => {
    switch (masteryStatus) {
      case 'weak':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">Weak Gap</span>;
      case 'mastered':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Mastered</span>;
      case 'developing':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">Developing</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-500">Unattempted</span>;
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-6" data-testid="adaptive-learning-path-widget">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-playfair text-neutral-900 dark:text-neutral-100">
              Adaptive Learning Path
            </h3>
            <p className="text-xs text-neutral-500 italic">
              Goal: {path?.goal || goalInput}
            </p>
          </div>
        </div>

        <button
          onClick={handleGeneratePath}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-xl shadow transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
          {generating ? 'Regenerating...' : 'Regenerate Path'}
        </button>
      </div>

      {/* Progress Bar */}
      {path && (
        <div className="space-y-1.5 bg-neutral-50 dark:bg-neutral-800/40 p-4 rounded-xl border border-neutral-200/60 dark:border-neutral-700/50">
          <div className="flex justify-between items-center text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            <span>Overall Goal Progress</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">{path.overallProgress || 0}%</span>
          </div>
          <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-amber-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${path.overallProgress || 0}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 text-rose-700 dark:bg-rose-950/30 text-xs rounded-lg border border-rose-200">
          {error}
        </div>
      )}

      {/* Path Items List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-8 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-500" /> Calculating adaptive learning trajectory...
          </div>
        ) : path && path.pathItems && path.pathItems.length > 0 ? (
          path.pathItems.map((item, idx) => {
            const isCompleted = item.status === 'completed';
            const isExpanded = expandedItem === item.itemId;

            return (
              <div
                key={item.itemId || idx}
                className={`p-4 rounded-xl border transition-all ${
                  isCompleted
                    ? 'bg-neutral-50/50 dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800 opacity-75'
                    : item.status === 'in_progress'
                    ? 'bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/40 shadow-sm'
                    : 'bg-white dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700/60'
                }`}
                data-testid={`path-item-${item.itemId}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleUpdateStatus(item.itemId, isCompleted ? 'pending' : 'completed')}
                      className={`mt-0.5 p-1 rounded-lg transition ${
                        isCompleted
                          ? 'text-emerald-500 bg-emerald-500/10'
                          : 'text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400'
                      }`}
                      title={isCompleted ? 'Mark as Incomplete' : 'Mark as Complete'}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className={`font-bold text-sm text-neutral-900 dark:text-neutral-100 ${isCompleted ? 'line-through text-neutral-500' : ''}`}>
                          {idx + 1}. {item.topicName}
                        </h4>
                        {getStatusBadge(item.masteryStatus)}
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        Subject: {item.subjectName} • Target: {item.targetDate}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={item.status}
                      onChange={(e) => handleUpdateStatus(item.itemId, e.target.value)}
                      className="text-xs p-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="skipped">Skipped</option>
                    </select>

                    <button
                      onClick={() => setExpandedItem(isExpanded ? null : item.itemId)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                      title="View Curated Study Resources"
                    >
                      <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Expanded Curated Resources */}
                {isExpanded && item.recommendedResources && (
                  <div className="mt-3 pt-3 border-t border-neutral-200/60 dark:border-neutral-700/50 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block">
                      Curated Study Resources:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {item.recommendedResources.map((res, rIdx) => (
                        <a
                          key={rIdx}
                          href={res.url}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition text-xs font-semibold text-neutral-800 dark:text-neutral-200"
                        >
                          <span className="flex items-center gap-2 line-clamp-1">
                            {res.type === 'note' ? <FileText className="w-4 h-4 text-indigo-500" /> : <HelpCircle className="w-4 h-4 text-amber-500" />}
                            {res.title}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-60" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="py-8 text-center text-xs text-neutral-400">
            No adaptive path items available. Click &quot;Regenerate Path&quot; to build your study schedule.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdaptiveLearningPath;
