import React from 'react';
import { Target, TrendingUp, Zap, HelpCircle } from 'lucide-react';

const FeedbackRadarChart = ({ scores = [85, 70, 92, 60, 80] }) => {
    // For a real app, you'd use Recharts or Chart.js here. 
    // This is a premium CSS-based visual representation of a skills matrix.

    return (
        <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 shadow-2xl overflow-hidden relative group">
            {/* Ambient Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 z-0" />

            <div className="relative z-10">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-400" />
                    Interview Performance Matrix
                </h3>

                <div className="space-y-5">

                    {/* Technical Depth */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-300">Technical Depth</span>
                            <span className="text-sm font-bold text-indigo-400">{scores[0]}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                            <div className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-2.5 rounded-full transition-all duration-1000 ease-out" style={{ width: `${scores[0]}%` }} />
                        </div>
                    </div>

                    {/* Communication */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-300">Communication Clarity</span>
                            <span className="text-sm font-bold text-emerald-400">{scores[1]}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                            <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2.5 rounded-full transition-all duration-1000 ease-out" style={{ width: `${scores[1]}%` }} />
                        </div>
                    </div>

                    {/* Problem Solving */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-300">Problem Solving</span>
                            <span className="text-sm font-bold text-purple-400">{scores[2]}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                            <div className="bg-gradient-to-r from-purple-500 to-purple-400 h-2.5 rounded-full transition-all duration-1000 ease-out" style={{ width: `${scores[2]}%` }} />
                        </div>
                    </div>

                    {/* System Design */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-300">System Design</span>
                            <span className="text-sm font-bold text-yellow-400">{scores[3]}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                            <div className="bg-gradient-to-r from-yellow-500 to-yellow-400 h-2.5 rounded-full transition-all duration-1000 ease-out" style={{ width: `${scores[3]}%` }} />
                        </div>
                    </div>

                    {/* Confidence */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-300">Vocal Confidence</span>
                            <span className="text-sm font-bold text-red-400">{scores[4]}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                            <div className="bg-gradient-to-r from-red-500 to-red-400 h-2.5 rounded-full transition-all duration-1000 ease-out" style={{ width: `${scores[4]}%` }} />
                        </div>
                    </div>

                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
                    <button className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                        <TrendingUp className="w-4 h-4" /> View Trend Analysis
                    </button>
                    <button className="text-gray-500 hover:text-white transition-colors">
                        <HelpCircle className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full" />
        </div>
    );
};

export default FeedbackRadarChart;
