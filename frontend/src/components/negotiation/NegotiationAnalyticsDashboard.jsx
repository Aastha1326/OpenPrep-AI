import React from 'react';
import { BarChart2, TrendingUp, Users, DollarSign, ArrowUpRight } from 'lucide-react';

const NegotiationAnalyticsDashboard = ({ pastSessions = [] }) => {
    // Generate dummy historical metrics if none provided
    const metrics = {
        totalNegotiations: 24,
        averageUplift: '$14,500',
        successRate: '68%',
        topCompany: 'Google'
    };

    return (
        <div className="w-full bg-gray-900 border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden group mb-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <BarChart2 className="w-5 h-5 text-emerald-400" />
                        Platform Negotiation Analytics
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">Global anonymized uplift and success rates</p>
                </div>

                <button className="flex items-center gap-1 text-sm bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors mt-4 md:mt-0">
                    <TrendingUp className="w-4 h-4" /> View Detailed Report
                </button>
            </div>

            <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Metric 1 */}
                <div className="bg-gray-800/50 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 text-gray-400 text-sm font-medium mb-2 uppercase tracking-wide">
                        <Users className="w-4 h-4" /> Global Sessions
                    </div>
                    <div className="text-2xl font-bold text-white">{metrics.totalNegotiations}k+</div>
                    <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3" /> +12% this week
                    </div>
                </div>

                {/* Metric 2 */}
                <div className="bg-gray-800/50 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 text-gray-400 text-sm font-medium mb-2 uppercase tracking-wide">
                        <DollarSign className="w-4 h-4" /> Avg Uplift
                    </div>
                    <div className="text-2xl font-bold text-emerald-400">{metrics.averageUplift}</div>
                    <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3" /> Above market avg
                    </div>
                </div>

                {/* Metric 3 */}
                <div className="bg-gray-800/50 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 text-gray-400 text-sm font-medium mb-2 uppercase tracking-wide">
                        <TrendingUp className="w-4 h-4" /> Success Rate
                    </div>
                    <div className="text-2xl font-bold text-blue-400">{metrics.successRate}</div>
                    <div className="text-xs text-gray-400 mt-1">Offers accepted {'>'} initial</div>
                </div>

                {/* Metric 4 */}
                <div className="bg-gray-800/50 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 text-gray-400 text-sm font-medium mb-2 uppercase tracking-wide">
                        <BarChart2 className="w-4 h-4" /> Top Employer
                    </div>
                    <div className="text-2xl font-bold text-purple-400">{metrics.topCompany}</div>
                    <div className="text-xs text-gray-400 mt-1">Most frequent counter-offers</div>
                </div>
            </div>
        </div>
    );
};

export default NegotiationAnalyticsDashboard;
