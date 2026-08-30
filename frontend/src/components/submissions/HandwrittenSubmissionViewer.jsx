import React, { useState, useEffect } from 'react';

/**
 * HandwrittenSubmissionViewer component
 * Renders a side-by-side view: original photo on the left, AI transcription and step-by-step grading rubric on the right.
 */
export default function HandwrittenSubmissionViewer({ submissionId }) {
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('rubric'); // 'rubric' | 'transcription'

  useEffect(() => {
    async function fetchSubmission() {
      try {
        setLoading(true);
        const response = await fetch(`/api/submissions/${submissionId}/evaluation`);
        const result = await response.json();
        if (result.success) {
          setSubmission(result.data);
        } else {
          setError(result.error || 'Failed to fetch evaluation.');
        }
      } catch (err) {
        setError(err.message || 'Failed to load evaluation details.');
      } finally {
        setLoading(false);
      }
    }

    if (submissionId) {
      fetchSubmission();
    }
  }, [submissionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-slate-900 text-white rounded-xl p-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium">Analyzing handwriting and grading submission...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-950/30 border border-red-500/50 rounded-xl p-6 text-red-200">
        <h4 className="font-bold text-lg mb-2">Evaluation Error</h4>
        <p>{error}</p>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="bg-slate-900 rounded-xl p-8 text-center text-slate-400">
        No submission selected for review.
      </div>
    );
  }

  const photos = submission.photoUrls || [];
  const evalData = submission.evaluation || {};
  const criteria = evalData.criteria || [];
  const annotations = evalData.feedbackAnnotations || [];

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[600px] bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 p-6 shadow-2xl">
      {/* LEFT PANEL: Original Image Photo Viewer */}
      <div className="flex-1 flex flex-col bg-slate-900/50 rounded-xl border border-slate-800 p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Original Answer Sheet
          </h3>
          <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full font-mono">
            Page {activePhotoIndex + 1} of {photos.length}
          </span>
        </div>

        {/* Image Display */}
        <div className="flex-1 relative flex items-center justify-center min-h-[350px] bg-slate-950 rounded-lg overflow-hidden border border-slate-800">
          {photos.length > 0 ? (
            <img
              src={photos[activePhotoIndex]}
              alt={`Answer Sheet Page ${activePhotoIndex + 1}`}
              className="max-h-[500px] object-contain transition-all duration-300 hover:scale-105"
            />
          ) : (
            <div className="text-slate-500">No photos uploaded</div>
          )}
        </div>

        {/* Carousel controls */}
        {photos.length > 1 && (
          <div className="flex justify-center items-center gap-4 mt-4">
            <button
              onClick={() => setActivePhotoIndex(prev => Math.max(0, prev - 1))}
              disabled={activePhotoIndex === 0}
              className="p-2 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex gap-1.5">
              {photos.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePhotoIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${idx === activePhotoIndex ? 'bg-blue-500 w-4' : 'bg-slate-700'}`}
                />
              ))}
            </div>
            <button
              onClick={() => setActivePhotoIndex(prev => Math.min(photos.length - 1, prev + 1))}
              disabled={activePhotoIndex === photos.length - 1}
              className="p-2 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* RIGHT PANEL: Transcription & Rubric / Feedback Reviewer */}
      <div className="flex-1 flex flex-col bg-slate-900/50 rounded-xl border border-slate-800 p-4">
        {/* Overall Score Banner */}
        <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-xl mb-4 shadow-inner">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Evaluation Result</span>
            <h4 className="text-xl font-bold text-white mt-1">Rubric Feedback Dashboard</h4>
          </div>
          <div className="text-right">
            <span className="text-sm font-semibold text-slate-400">Total Score</span>
            <div className="text-2xl font-black text-emerald-400">
              {evalData.totalScore || 0} <span className="text-sm text-slate-500">/ {evalData.maxScore || 10}</span>
            </div>
          </div>
        </div>

        {/* Tabs switcher */}
        <div className="flex border-b border-slate-800 mb-4">
          <button
            onClick={() => setActiveTab('rubric')}
            className={`px-4 py-2 border-b-2 font-medium text-sm transition-all ${activeTab === 'rubric' ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            Detailed Rubric Grading
          </button>
          <button
            onClick={() => setActiveTab('transcription')}
            className={`px-4 py-2 border-b-2 font-medium text-sm transition-all ${activeTab === 'transcription' ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            AI Transcription
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto max-h-[400px]">
          {activeTab === 'rubric' ? (
            <div className="space-y-6">
              {/* Overall Feedback */}
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                <h5 className="font-bold text-xs uppercase text-slate-400 tracking-wider mb-2">Overall Feedback</h5>
                <p className="text-slate-300 text-sm leading-relaxed">{evalData.overallFeedback || 'No overall feedback available.'}</p>
              </div>

              {/* Criteria-wise score cards */}
              <div className="space-y-3">
                <h5 className="font-bold text-xs uppercase text-slate-400 tracking-wider">Criteria Breakdown</h5>
                {criteria.map((item, idx) => {
                  const pct = (item.score / item.maxScore) * 100;
                  const barColor = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';
                  const scoreBadgeColor = pct >= 80 ? 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30' : pct >= 50 ? 'text-amber-400 bg-amber-950/40 border-amber-500/30' : 'text-red-400 bg-red-950/40 border-red-500/30';

                  return (
                    <div key={idx} className="p-3 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-sm text-white">{item.name}</span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full border ${scoreBadgeColor} font-mono font-bold`}>
                          {item.score} / {item.maxScore} Marks
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2">
                        <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${pct}%` }}></div>
                      </div>
                      <p className="text-xs text-slate-400 leading-normal">{item.feedback}</p>
                    </div>
                  );
                })}
              </div>

              {/* Annotations */}
              {annotations.length > 0 && (
                <div className="space-y-3">
                  <h5 className="font-bold text-xs uppercase text-slate-400 tracking-wider">Step-by-Step Corrections</h5>
                  <div className="space-y-2">
                    {annotations.map((ann, idx) => {
                      const colors = ann.severity === 'error'
                        ? { bg: 'bg-red-950/30 border-red-500/30', text: 'text-red-200', tag: 'bg-red-500/20 text-red-400 border-red-500/40' }
                        : ann.severity === 'warning'
                        ? { bg: 'bg-amber-950/30 border-amber-500/30', text: 'text-amber-200', tag: 'bg-amber-500/20 text-amber-400 border-amber-500/40' }
                        : { bg: 'bg-blue-950/30 border-blue-500/30', text: 'text-blue-200', tag: 'bg-blue-500/20 text-blue-400 border-blue-500/40' };

                      return (
                        <div key={idx} className={`p-3 border rounded-lg ${colors.bg} flex items-start gap-3`}>
                          <span className={`text-[10px] px-2 py-0.5 rounded border ${colors.tag} font-bold tracking-wide uppercase font-mono`}>
                            {ann.severity}
                          </span>
                          <div className="flex-1">
                            <span className="text-[11px] text-slate-400 block mb-1">Approx. Line {ann.line}</span>
                            <p className={`text-xs leading-normal ${colors.text}`}>{ann.message}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-sm leading-relaxed whitespace-pre-wrap text-slate-300">
                {submission.transcription || 'No transcription extracted.'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
