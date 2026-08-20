import React from 'react';
import { 
    Award, 
    CheckCircle2, 
    AlertTriangle, 
    BookOpen, 
    Brain, 
    Sparkles, 
    RotateCcw, 
    Download, 
    Share2, 
    BarChart3,
    ShieldCheck
} from 'lucide-react';
import { VivaScorecard, VivaSessionConfig } from './vivaEngine';

interface VivaScorecardModalProps {
    scorecard: VivaScorecard;
    config: VivaSessionConfig;
    onRestart: () => void;
    onClose: () => void;
}

export const VivaScorecardModal: React.FC<VivaScorecardModalProps> = ({
    scorecard,
    config,
    onRestart,
    onClose
}) => {
    const getGradeBadge = (score: number) => {
        if (score >= 90) return { label: "First Class Honors (A+)", color: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10" };
        if (score >= 75) return { label: "Distinction (A)", color: "text-teal-400 border-teal-500/40 bg-teal-500/10" };
        if (score >= 60) return { label: "Pass with Merit (B)", color: "text-amber-400 border-amber-500/40 bg-amber-500/10" };
        return { label: "Needs Academic Revision (C)", color: "text-rose-400 border-rose-500/40 bg-rose-500/10" };
    };

    const grade = getGradeBadge(scorecard.totalScore);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
            <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden my-8">
                {/* Background Ambient Glow */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-500/10 via-teal-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

                {/* Header Title */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-teal-500/20 border border-indigo-500/30 text-indigo-400">
                            <Award className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Official Viva Voce Scorecard</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${grade.color}`}>
                                    {grade.label}
                                </span>
                            </div>
                            <h2 className="text-2xl font-black text-slate-100 mt-1">{config.topic}</h2>
                            <p className="text-xs text-slate-400">{config.subject} • {config.academicLevel} Level</p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-200 text-sm font-semibold px-3 py-1.5 rounded-xl border border-slate-800 hover:bg-slate-800 transition-colors"
                    >
                        Close Portal
                    </button>
                </div>

                {/* Top Metrics Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-6">
                    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-center relative overflow-hidden">
                        <span className="text-xs text-slate-400 font-medium block">Total Viva Score</span>
                        <span className="text-3xl font-black text-emerald-400 mt-1 block">{scorecard.totalScore}/100</span>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                            <div className="bg-emerald-400 h-full rounded-full transition-all duration-1000" style={{ width: `${scorecard.totalScore}%` }} />
                        </div>
                    </div>

                    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-center">
                        <span className="text-xs text-slate-400 font-medium block">Conceptual Depth</span>
                        <span className="text-3xl font-black text-indigo-400 mt-1 block">{scorecard.conceptualDepth}%</span>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                            <div className="bg-indigo-400 h-full rounded-full transition-all duration-1000" style={{ width: `${scorecard.conceptualDepth}%` }} />
                        </div>
                    </div>

                    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-center">
                        <span className="text-xs text-slate-400 font-medium block">Technical Accuracy</span>
                        <span className="text-3xl font-black text-teal-400 mt-1 block">{scorecard.technicalAccuracy}%</span>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                            <div className="bg-teal-400 h-full rounded-full transition-all duration-1000" style={{ width: `${scorecard.technicalAccuracy}%` }} />
                        </div>
                    </div>

                    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-center">
                        <span className="text-xs text-slate-400 font-medium block">Confidence Index</span>
                        <span className="text-3xl font-black text-amber-400 mt-1 block">{scorecard.confidenceIndex}%</span>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                            <div className="bg-amber-400 h-full rounded-full transition-all duration-1000" style={{ width: `${scorecard.confidenceIndex}%` }} />
                        </div>
                    </div>
                </div>

                {/* Examiner Assessment Summary */}
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 mb-6">
                    <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-2">
                        <Brain className="w-4 h-4 text-indigo-400" />
                        Examiner Official Assessment Remarks
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                        "{scorecard.examinerSummary}"
                    </p>
                </div>

                {/* Grid Breakdown: Strengths & Improvement Areas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Strengths */}
                    <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2 mb-3">
                            <CheckCircle2 className="w-4 h-4" />
                            Demonstrated Technical Strengths
                        </h4>
                        <ul className="space-y-2">
                            {scorecard.strengths.map((strength, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                                    <span>{strength}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Improvement Areas */}
                    <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2 mb-3">
                            <AlertTriangle className="w-4 h-4" />
                            Academic Improvement Recommendations
                        </h4>
                        <ul className="space-y-2">
                            {scorecard.improvementAreas.map((area, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                                    <span>{area}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Recommended Follow-up Topics */}
                <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 mb-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                        <BookOpen className="w-4 h-4 text-indigo-400" />
                        Recommended Next Study Topics
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {scorecard.recommendedTopics.map((topic, idx) => (
                            <span key={idx} className="px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
                                {topic}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Footer Modal Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
                    <button
                        onClick={() => alert("Downloading official PDF Viva Scorecard summary...")}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors"
                    >
                        <Download className="w-4 h-4" /> Export Scorecard PDF
                    </button>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                            onClick={onRestart}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all"
                        >
                            <RotateCcw className="w-4 h-4" /> Start New Viva Session
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
