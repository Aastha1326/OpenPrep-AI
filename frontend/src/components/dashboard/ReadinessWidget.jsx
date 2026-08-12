import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, ChevronRight, X, AlertCircle, Loader2 } from 'lucide-react';
import API from '../../services/api';

export default function ReadinessWidget() {
  const [readinessData, setReadinessData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get('/readiness')
      .then((res) => {
        setReadinessData(res.data.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load exam readiness analytics.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-8 bg-[#FFFBE9] dark:bg-[#16120E] rounded-3xl border border-[#CEAB93]/60 dark:border-[#412D15] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-2" />
        <p className="text-xs font-medium">Analyzing exam preparedness metrics...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#FFFBE9] dark:bg-[#16120E] rounded-3xl border border-[#CEAB93]/60 dark:border-[#412D15] shadow-sm font-inter text-[#1F150C] dark:text-[#E1DCC9]">
      <div className="flex items-center justify-between mb-6 border-b border-[#CEAB93]/30 pb-4">
        <div>
          <h2 className="text-xl font-bold font-playfair flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" /> Exam Readiness Engine
          </h2>
          <p className="text-xs text-[#8C6A53] dark:text-[#C4BA9D] mt-0.5">
            Subject-level confidence scores based on your continuous activity records.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-600 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Subject Readiness Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {readinessData?.subjects?.map((sub) => (
          <div
            key={sub.subjectId}
            onClick={() => setSelectedSubject(sub)}
            className="p-4 bg-white dark:bg-[#251D17] rounded-2xl border border-[#CEAB93]/40 dark:border-[#412D15] hover:border-amber-500 cursor-pointer transition shadow-sm flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#8C6A53] dark:text-[#C4BA9D]">{sub.subjectName}</span>
              <div className="text-2xl font-bold font-playfair mt-1 text-amber-600 dark:text-amber-400">{sub.overallScore}%</div>
            </div>
            {/* Visual Radial Gauge Indicator */}
            <div className="relative w-12 h-12 flex items-center justify-center rounded-full bg-amber-500/10 text-amber-600 font-bold text-xs">
              {sub.overallScore}%
            </div>
          </div>
        ))}
      </div>

      {/* AI Weekly Focus Recommendations */}
      {readinessData?.weeklyRecommendations && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 mb-1 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" /> AI Weekly Focus Recommendation
          </h4>
          <p className="text-xs text-[#8C6A53] dark:text-[#C4BA9D] leading-relaxed whitespace-pre-line">
            {readinessData.weeklyRecommendations}
          </p>
        </div>
      )}

      {/* Detailed Breakdown Drawer */}
      {selectedSubject && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#FFFBE9] dark:bg-[#16120E] h-full p-6 shadow-2xl overflow-y-auto border-l border-[#CEAB93]/60 dark:border-[#412D15] flex flex-col">
            <div className="flex items-center justify-between mb-6 border-b border-[#CEAB93]/30 pb-4">
              <h3 className="text-lg font-bold font-playfair">{selectedSubject.subjectName} Breakdown</h3>
              <button onClick={() => setSelectedSubject(null)} className="p-1 rounded-full hover:bg-black/10">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 flex-1">
              <div className="p-4 bg-white dark:bg-[#251D17] rounded-2xl border border-[#CEAB93]/30 text-center mb-6">
                <span className="text-xs text-[#8C6A53] dark:text-[#C4BA9D]">Overall Readiness</span>
                <div className="text-4xl font-bold font-playfair text-amber-600 dark:text-amber-400 mt-1">{selectedSubject.overallScore}%</div>
              </div>

              {Object.entries(selectedSubject.breakdown).map(([key, val]) => (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold capitalize">
                    <span>{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span>{val}%</span>
                  </div>
                  <div className="w-full bg-black/10 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${val}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
