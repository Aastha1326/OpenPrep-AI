import React from 'react';
import { Award, CheckCircle2, AlertTriangle, Cpu, TrendingUp } from 'lucide-react';
import { CandidateResponseRecord } from '../../services/aiInterviewSimulationEngine';

interface FeedbackCardProps {
    record: CandidateResponseRecord;
}

export const InterviewFeedbackBreakdownCardTile: React.FC<FeedbackCardProps> = ({ record }) => {
    return (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-5 shadow-2xl">
            {/* Score Metrics Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                    <span className="text-[10px] text-indigo-400 font-mono uppercase font-bold">AI Response Evaluation</span>
                    <h4 className="text-base font-bold text-slate-100 mt-0.5">{record.questionText}</h4>
                </div>

                <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800 self-start sm:self-auto">
                    <Award className="w-6 h-6 text-amber-400" />
                    <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Overall Confidence</span>
                        <span className="text-xl font-black text-amber-400 font-mono">{record.overallConfidenceScore} / 100</span>
                    </div>
                </div>
            </div>

            {/* Score Gauges */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">Technical Depth Score</span>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-emerald-400 font-mono">{record.technicalDepthScore}%</span>
                        <div className="w-24 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${record.technicalDepthScore}%` }} />
                        </div>
                    </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">Clarity & Structure</span>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-indigo-400 font-mono">{record.clarityScore}%</span>
                        <div className="w-24 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${record.clarityScore}%` }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Feedback */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                    <Cpu className="w-4 h-4 text-indigo-400" /> AI Feedback Summary
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">{record.aiFeedbackSummary}</p>
            </div>

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                    <span className="text-[10px] text-emerald-400 font-mono uppercase font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Identified Strengths
                    </span>
                    <ul className="space-y-1">
                        {record.strengths.map((s, idx) => (
                            <li key={idx} className="p-2 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-slate-300">
                                {s}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="space-y-2">
                    <span className="text-[10px] text-rose-400 font-mono uppercase font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Areas to Refine
                    </span>
                    <ul className="space-y-1">
                        {record.areasToImprove.map((area, idx) => (
                            <li key={idx} className="p-2 bg-rose-500/5 border border-rose-500/20 rounded-xl text-slate-300">
                                {area}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};
