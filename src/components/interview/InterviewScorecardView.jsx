import React from 'react';
import { Award, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export const InterviewScorecardView = ({ scorecard, onRestart }) => {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">AI Evaluation Complete</span>
                    <h3 className="text-xl font-black text-slate-100 mt-1">Mock Interview Performance Scorecard</h3>
                </div>

                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-2xl">
                    <Award className="w-5 h-5 text-emerald-400" />
                    <span className="text-xl font-black text-emerald-400 font-mono">{scorecard.overallRating}% Overall</span>
                </div>
            </div>

            {/* Score Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400 font-bold uppercase">Technical Accuracy</span>
                    <p className="text-2xl font-black text-indigo-400 font-mono">{scorecard.technicalAccuracyScore}%</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400 font-bold uppercase">Communication</span>
                    <p className="text-2xl font-black text-teal-400 font-mono">{scorecard.communicationScore}%</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400 font-bold uppercase">Problem Solving</span>
                    <p className="text-2xl font-black text-amber-400 font-mono">{scorecard.problemSolvingScore}%</p>
                </div>
            </div>

            {/* Feedback Summary */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> AI Interviewer Feedback
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">{scorecard.aiFeedbackSummary}</p>
            </div>

            {/* Key Improvements */}
            <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-400" /> Suggested Areas of Improvement
                </span>
                <div className="space-y-1.5">
                    {scorecard.areasOfImprovement.map((area, idx) => (
                        <div key={idx} className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800/80 text-xs text-slate-300 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                            <span>{area}</span>
                        </div>
                    ))}
                </div>
            </div>

            <button
                type="button"
                onClick={onRestart}
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
            >
                <span>Start Another Mock Session</span>
                <ArrowRight className="w-4 h-4" />
            </button>
        </div>
    );
};
