import React, { useState, useRef } from 'react';
import { Target, CheckCircle2, XCircle, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';
import api from '../../services/api';

const DEFAULT_SAMPLE_HOTSPOT = {
  id: 'hs-demo-1',
  type: 'CIRCLE',
  label: 'Mitochondria',
  prompt: 'Click on the Mitochondria (ATP energy generator) in the cell diagram below.',
  center: { x: 45, y: 55 },
  radiusPercent: 12,
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1000&q=80';

const DiagramHotspotQuestion = ({
  questionPrompt = DEFAULT_SAMPLE_HOTSPOT.prompt,
  imageUrl = DEFAULT_IMAGE,
  targetHotspot = DEFAULT_SAMPLE_HOTSPOT,
  onAnswerComplete,
}) => {
  const [clickPoint, setClickPoint] = useState(null);
  const [result, setResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const imageRef = useRef(null);

  const handleImageClick = async (e) => {
    if (result) return; // Already answered

    const rect = imageRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const xPct = Math.round((clickX / rect.width) * 100);
    const yPct = Math.round((clickY / rect.height) * 100);

    const coords = { x: xPct, y: yPct };
    setClickPoint(coords);
    setVerifying(true);

    try {
      const res = await api.post('/quizzes/diagram-hotspot/verify', {
        hotspot: targetHotspot,
        clickCoordinates: coords,
      });

      if (res.data && res.data.success) {
        const verifyData = res.data.data;
        setResult(verifyData);
        if (onAnswerComplete) onAnswerComplete(verifyData);
      }
    } catch (err) {
      console.error('Hotspot verification error:', err);
      // Local fallback calculation
      const dx = xPct - targetHotspot.center.x;
      const dy = yPct - targetHotspot.center.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const isCorrect = dist <= (targetHotspot.radiusPercent || 12);
      const fallbackResult = { isCorrect, label: targetHotspot.label, clickCoordinates: coords };
      setResult(fallbackResult);
      if (onAnswerComplete) onAnswerComplete(fallbackResult);
    } finally {
      setVerifying(false);
    }
  };

  const handleReset = () => {
    setClickPoint(null);
    setResult(null);
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-6">
      {/* Header Prompt */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <span className="px-3 py-1 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 rounded-xl text-xs font-bold font-mono uppercase tracking-wider">
            Multi-Modal Visual Hotspot Question
          </span>
          <h3 className="text-stone-100 font-extrabold text-base font-playfair mt-2 leading-relaxed flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-400 shrink-0" />
            {questionPrompt}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoomLevel((z) => Math.min(2, z + 0.25))}
            className="p-2 bg-neutral-800 hover:bg-neutral-700 text-stone-300 rounded-xl transition-all cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(1, z - 0.25))}
            className="p-2 bg-neutral-800 hover:bg-neutral-700 text-stone-300 rounded-xl transition-all cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          {result && (
            <button
              onClick={handleReset}
              className="p-2 bg-neutral-800 hover:bg-neutral-700 text-stone-300 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          )}
        </div>
      </div>

      {/* Diagram Container */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 flex items-center justify-center p-2 group">
        <div
          className="relative transition-transform duration-300 cursor-crosshair max-w-full"
          style={{ transform: `scale(${zoomLevel})` }}
          onClick={handleImageClick}
        >
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Diagram Question"
            className="rounded-xl max-h-96 object-contain select-none shadow-lg"
          />

          {/* SVG Overlay for Target Hotspot & Click Indicator */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {/* Display Target Hotspot Circle */}
            {targetHotspot.center && (
              <circle
                cx={`${targetHotspot.center.x}%`}
                cy={`${targetHotspot.center.y}%`}
                r={`${targetHotspot.radiusPercent || 10}%`}
                className={`transition-all ${
                  result
                    ? result.isCorrect
                      ? 'fill-emerald-500/30 stroke-emerald-400 stroke-2 animate-pulse'
                      : 'fill-rose-500/20 stroke-rose-500 stroke-2'
                    : 'fill-indigo-500/10 stroke-indigo-400/40 stroke-dashed'
                }`}
              />
            )}

            {/* Click Point Marker */}
            {clickPoint && (
              <g>
                <circle
                  cx={`${clickPoint.x}%`}
                  cy={`${clickPoint.y}%`}
                  r="8"
                  className={`${result?.isCorrect ? 'fill-emerald-500' : 'fill-rose-500'} animate-ping opacity-75`}
                />
                <circle
                  cx={`${clickPoint.x}%`}
                  cy={`${clickPoint.y}%`}
                  r="6"
                  className={`${result?.isCorrect ? 'fill-emerald-400' : 'fill-rose-500'} stroke-white stroke-2`}
                />
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* Answer Result Feedback Banner */}
      {result && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-3 animate-fade-in ${
            result.isCorrect
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {result.isCorrect ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <div>
            <strong className="block text-sm font-extrabold mb-0.5">
              {result.isCorrect ? 'Correct Spot Identified!' : 'Incorrect Spot Clicked'}
            </strong>
            <span>
              {result.isCorrect
                ? `Spot-on! You accurately clicked inside the ${targetHotspot.label} target zone.`
                : `Target region was '${targetHotspot.label}'. Click 'Retry' to try pinpointing the region again.`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiagramHotspotQuestion;
