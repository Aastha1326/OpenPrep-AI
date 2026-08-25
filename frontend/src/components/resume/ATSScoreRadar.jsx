import React from 'react';
import { ShieldAlert, CheckCircle, Search, FileText } from 'lucide-react';

const ATSScoreRadar = ({ parseData }) => {
    if (!parseData) return null;

    const { overallAtsScore = 0, keywordMatchRate = 0, formattingPenalty = 0, extractedNodes = {}, missingKeywords = [] } = parseData;

    // Determine colors based on score
    const getScoreColor = (score) => {
        if (score >= 80) return 'text-emerald-400';
        if (score >= 60) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <div className="bg-gray-900 border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-white/10 pb-6">
                <div>
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                        <FileText className="w-6 h-6 text-indigo-400" />
                        ATS Score Breakdown
                    </h3>
                    <p className="text-sm text-gray-400">Analysis complete. Applicant tracking system perspective.</p>
                </div>

                <div className="mt-4 md:mt-0 flex flex-col items-end">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Global Score</span>
                    <div className="flex items-end gap-1">
                        <span className={`text-5xl font-black ${getScoreColor(overallAtsScore)}`}>{overallAtsScore}</span>
                        <span className="text-xl text-gray-500 mb-1">/100</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Telemetry Metrics */}
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between text-sm font-medium mb-1">
                            <span className="text-gray-300">Keyword Density (JD Match)</span>
                            <span className="text-white">{keywordMatchRate.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-1000" style={{ width: `${Math.min(100, keywordMatchRate)}%` }} />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between text-sm font-medium mb-1">
                            <span className="text-gray-300">Formatting Penalty</span>
                            <span className="text-red-400">-{formattingPenalty} pts</span>
                        </div>
                        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-1000" style={{ width: `${Math.min(100, (formattingPenalty / 30) * 100)}%` }} />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Penalties for complex tables, dual columns, or unreadable blocks.</p>
                    </div>

                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                        <h4 className="text-sm font-bold text-gray-300 mb-2 uppercase tracking-wide">Extracted Entities (AST)</h4>
                        <ul className="text-sm text-gray-400 space-y-1">
                            <li className="flex justify-between">
                                <span>Experience Roles Found:</span>
                                <span className="text-white font-mono">{extractedNodes.experienceCount || 0}</span>
                            </li>
                            <li className="flex justify-between">
                                <span>Education Verified:</span>
                                <span className={extractedNodes.educationFound ? 'text-emerald-400' : 'text-red-400'}>
                                    {extractedNodes.educationFound ? 'Detected' : 'Missing'}
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Heatmap / Keywords Area */}
                <div className="flex flex-col h-full border-l border-white/10 lg:pl-8">
                    <h4 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
                        <Search className="w-4 h-4 text-indigo-400" />
                        Keyword Gap Analysis
                    </h4>

                    <div className="flex-1 space-y-6">
                        <div>
                            <span className="text-xs font-bold uppercase text-emerald-400 mb-2 block">Found Skills</span>
                            <div className="flex flex-wrap gap-2">
                                {(extractedNodes.hardSkills || []).map((skill, idx) => (
                                    <span key={idx} className="px-3 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-md text-xs font-bold">
                                        <CheckCircle className="w-3 h-3 inline mr-1" /> {skill}
                                    </span>
                                ))}
                                {(!extractedNodes.hardSkills || extractedNodes.hardSkills.length === 0) && (
                                    <span className="text-gray-500 text-sm italic">None detected</span>
                                )}
                            </div>
                        </div>

                        <div>
                            <span className="text-xs font-bold uppercase text-red-400 mb-2 block">Missing from Job Desc</span>
                            <div className="flex flex-wrap gap-2">
                                {missingKeywords.map((skill, idx) => (
                                    <span key={idx} className="px-3 py-1 bg-red-500/10 text-red-300 border border-red-500/20 rounded-md text-xs font-bold">
                                        <ShieldAlert className="w-3 h-3 inline mr-1" /> {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <div className="absolute right-0 bottom-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        </div>
    );
};

export default ATSScoreRadar;
