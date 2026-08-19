import React from 'react';
import { Award, ArrowRight, Brain, CheckCircle2, Clock, BarChart3 } from 'lucide-react';

export default function ExamQuestionCard({ session, onInspect }) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 shadow-xl transition-all duration-300 hover:shadow-indigo-500/10 flex flex-col justify-between group">
      <div>
        {/* Header Title & Difficulty */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-300 transition">
              {session.sessionTitle}
            </h3>
            <p className="text-xs text-slate-400 font-medium">{session.categoryDomain}</p>
          </div>

          <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-xs px-2.5 py-1 rounded-lg font-mono font-semibold">
            {session.adaptiveDifficulty}
          </span>
        </div>

        {/* Mastery Box */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 mb-4 font-mono">
          <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">CAT Mastery Score</div>
          <div className="text-2xl font-black text-white">
            {session.masteryScorePercent}%
          </div>
          <div className="text-xs text-emerald-400 mt-1 font-semibold">
            Theta Ability: {session.thetaAbilityEstimate}
          </div>
        </div>

        {/* Specs */}
        <div className="space-y-2 text-xs font-mono mb-5">
          <div className="flex justify-between text-slate-400">
            <span>Completed Questions:</span>
            <span className="text-white font-bold">{session.totalQuestionsCompleted} Questions</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Avg Speed / Question:</span>
            <span className="text-cyan-400 font-bold">{session.averageTimePerQuestionSec} SEC</span>
          </div>
        </div>
      </div>

      {/* Footer Action */}
      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
        <span className="text-[11px] text-slate-500 font-mono">NGN Clinical Judgment Standard</span>
        <button
          onClick={onInspect}
          className="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-indigo-500/30 transition flex items-center gap-1"
        >
          <span>CAT Analytics</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
