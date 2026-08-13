import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import ExamReadinessCard from '../analytics/ExamReadinessCard';
import KnowledgeRadarChart from '../analytics/KnowledgeRadarChart';
import AiDiagnosisPanel from '../analytics/AiDiagnosisPanel';
import { FaBrain, FaExclamationCircle } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';

export default function ReadinessWidget() {
  const [readinessData, setReadinessData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recalculating, setRecalculating] = useState(false);

  const fetchReadiness = async (forceRecalculate = false) => {
    if (forceRecalculate) {
      setRecalculating(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      const endpoint = forceRecalculate ? '/readiness/recalculate' : '/readiness/summary';
      const res = await API.get(endpoint);
      // Wait, let's verify if POST or GET is used for recalculate
      // The issue spec says: "POST /api/readiness/recalculate -> forces fresh metric computation."
      // Let's call POST for recalculate and GET for summary!
      let resData;
      if (forceRecalculate) {
        const postRes = await API.post('/readiness/recalculate');
        resData = postRes.data;
      } else {
        const getRes = await API.get('/readiness/summary');
        resData = getRes.data;
      }

      if (resData?.success) {
        setReadinessData(resData.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to calculate exam readiness. Make sure you have registered subjects.');
    } finally {
      setLoading(false);
      setRecalculating(false);
    }
  };

  useEffect(() => {
    fetchReadiness();
  }, []);

  if (loading) {
    return (
      <div className="p-8 bg-neutral-900 border border-neutral-800 rounded-3xl flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
        <p className="text-xs text-stone-400 font-semibold">Recalculating ERI readiness indexes...</p>
      </div>
    );
  }

  if (readinessData?.insufficientData) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 text-center space-y-4 max-w-lg mx-auto shadow-xl">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-neutral-850 rounded-full text-indigo-400">
          <FaBrain className="text-xl" />
        </div>
        <div className="space-y-1">
          <h3 className="text-stone-100 font-bold text-sm">Readiness Insights Locked</h3>
          <p className="text-stone-400 text-xs leading-relaxed">
            Insufficient Data - Take your first quiz to unlock Readiness Insights and projected score forecasts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-400 font-semibold">
          <FaExclamationCircle className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Readiness Metrics Cards row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Overall score card */}
        <div className="lg:col-span-2">
          <ExamReadinessCard
            data={readinessData}
            onRecalculate={() => fetchReadiness(true)}
            loading={recalculating}
          />
        </div>

        {/* Mastery radar chart */}
        <div className="lg:col-span-1">
          <KnowledgeRadarChart subjects={readinessData?.subjects || []} />
        </div>

      </div>

      {/* AI Recommendation Diagnosis Panel */}
      <AiDiagnosisPanel recommendation={readinessData?.aiRecommendation} />
    </div>
  );
}
