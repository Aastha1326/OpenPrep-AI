import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingDown, Target, RefreshCw, Sparkles, CheckCircle2, ShieldAlert, FileText } from 'lucide-react';
import API from '../../services/api';
import VintagePaper from './VintagePaper';
import RevisionSheetModal from './RevisionSheetModal';

const WeaknessDashboardWidget = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleMessage, setRescheduleMessage] = useState(null);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get('/study-plans/weakness-analysis');
      if (res.data?.data) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch weakness analysis:', err);
      setError('Could not load AI weakness analysis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const handleAdaptiveReschedule = async () => {
    setRescheduling(true);
    setRescheduleMessage(null);
    try {
      const res = await API.post('/study-plans/reschedule-adaptive');
      if (res.data?.success) {
        setRescheduleMessage(res.data.message || 'Adaptive planner updated!');
        fetchAnalysis();
      }
    } catch (err) {
      console.error('Failed to reschedule planner:', err);
      setRescheduleMessage(err.response?.data?.error || 'Failed to reschedule planner');
    } finally {
      setRescheduling(false);
    }
  };

  const [selectedTopicForRevision, setSelectedTopicForRevision] = useState(null);

  const weakTopics = data?.weakTopics || [];
  const recommendations = data?.aiAnalysis?.recommendations || [];

  return (
    <VintagePaper className="w-full shadow-[0_10px_25px_rgba(0,0,0,0.5)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-400 pb-3 mb-4 gap-2">
        <h2 className="text-xl font-bold font-playfair text-neutral-900 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-700" /> AI Weakness & Adaptive Focus
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedTopicForRevision({ topicName: 'Overall Weak Topics' })}
            className="px-3 py-1 bg-gradient-to-r from-purple-800 to-indigo-900 text-amber-50 text-xs font-bold rounded shadow hover:shadow-md transition-all flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-yellow-400" /> Generate Revision Sheet
          </button>
          <button
            onClick={handleAdaptiveReschedule}
            disabled={rescheduling}
            className="px-3 py-1 bg-gradient-to-r from-amber-700 to-amber-900 text-amber-50 text-xs font-bold rounded shadow hover:shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${rescheduling ? 'animate-spin' : ''}`} />
            Boost Study Hours
          </button>
        </div>
      </div>

      {rescheduleMessage && (
        <div className="mb-3 p-2.5 bg-amber-50 border border-amber-300 rounded text-xs text-amber-900 font-semibold flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
          <span>{rescheduleMessage}</span>
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center text-xs text-neutral-500 italic flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-amber-800" /> Analyzing performance metrics...
        </div>
      ) : error ? (
        <div className="py-4 text-center text-xs text-red-600 font-medium">
          {error}
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Weak Topics Badges */}
          <div>
            <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider block mb-2">
              Detected Weak Topics (&lt;50% accuracy)
            </span>
            {weakTopics.length === 0 ? (
              <p className="text-xs text-neutral-500 italic">No weak topics detected. Great job!</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {weakTopics.map((topic, i) => (
                  <button
                    key={topic.id || i}
                    onClick={() => setSelectedTopicForRevision({ topicId: topic.id, topicName: topic.name, subjectId: topic.subject })}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-100 border border-red-300 text-red-900 hover:bg-red-200 font-bold text-xs shadow-sm transition-all"
                  >
                    <AlertTriangle className="w-3 h-3 text-red-700" />
                    {topic.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* AI Recommended Focus Areas */}
          <div>
            <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider block mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" /> Recommended Action Steps
            </span>
            {recommendations.length === 0 ? (
              <p className="text-xs text-neutral-500 italic">Complete practice quizzes to generate personalized focus steps.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {recommendations.slice(0, 3).map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-white border border-neutral-300 rounded text-xs text-neutral-800 space-y-1"
                  >
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-neutral-900">{rec.subject} — {rec.topic}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase ${
                        rec.priority?.toLowerCase() === 'high'
                          ? 'bg-red-100 text-red-800 font-bold'
                          : 'bg-amber-100 text-amber-800 font-bold'
                      }`}>
                        {rec.priority || 'High'}
                      </span>
                    </div>
                    <p className="text-neutral-600 italic">{rec.suggestion}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      <RevisionSheetModal
        isOpen={!!selectedTopicForRevision}
        onClose={() => setSelectedTopicForRevision(null)}
        subjectId={selectedTopicForRevision?.subjectId}
        topicId={selectedTopicForRevision?.topicId}
        topicName={selectedTopicForRevision?.topicName}
      />
    </VintagePaper>
  );
};

export default WeaknessDashboardWidget;
