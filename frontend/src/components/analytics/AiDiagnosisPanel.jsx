import React from 'react';
import { FaMagic, FaInfoCircle, FaRegLightbulb } from 'react-icons/fa';

const AiDiagnosisPanel = ({ recommendation }) => {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <FaMagic className="text-8xl text-indigo-400" />
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-800 pb-4">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <FaMagic className="text-base" />
          </div>
          <div>
            <h3 className="text-stone-100 font-extrabold font-playfair text-lg">AI Readiness Diagnosis</h3>
            <p className="text-stone-400 text-xs mt-0.5">Continuous recommendation feedback from Gemini Coach</p>
          </div>
        </div>

        <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl text-stone-300 text-sm leading-relaxed whitespace-pre-line font-medium text-left">
          {recommendation || 'Analyzing your recent quiz scores, active study plans, and memory retention rates to compile specific recommendations.'}
        </div>

        <div className="flex gap-2 items-start text-[10px] text-stone-500 font-semibold bg-stone-950/40 p-3 rounded-xl border border-neutral-850">
          <FaRegLightbulb className="text-amber-500 shrink-0 text-xs mt-0.5" />
          <span>Tips: Reviewing flashcards daily and achieving &gt;80% accuracy in quizzes will dramatically improve memory stability scores.</span>
        </div>
      </div>
    </div>
  );
};

export default AiDiagnosisPanel;
