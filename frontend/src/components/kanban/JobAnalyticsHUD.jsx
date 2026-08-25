import React from 'react';
import { Target, TrendingUp, Calendar, Zap } from 'lucide-react';

const JobAnalyticsHUD = ({ analytics }) => {
    if (!analytics) return null;

    return (
        <div className="w-full bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 shadow-2xl mb-8 flex flex-col sm:flex-row gap-6 justify-between items-center transition-all duration-300 hover:bg-white/15">
            {/* HUD Header */}
            <div className="flex flex-col flex-1">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300 flex items-center gap-2">
                    <Zap className="w-6 h-6 text-yellow-400" />
                    Telemetry & Pipeline Health
                </h2>
                <p className="text-sm text-gray-300 mt-1">Real-time application metrics</p>
            </div>

            {/* Metrics Group */}
            <div className="flex gap-4 flex-wrap justify-end">
                {/* Metric 1 */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 min-w-[140px] text-center hover:scale-105 transition-transform duration-200">
                    <div className="flex justify-center mb-2 text-blue-400">
                        <Target className="w-6 h-6" />
                    </div>
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Active Apps</p>
                    <p className="text-2xl font-bold text-white mt-1">{analytics.activeApplications}</p>
                </div>

                {/* Metric 2 */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 min-w-[140px] text-center hover:scale-105 transition-transform duration-200">
                    <div className="flex justify-center mb-2 text-indigo-400">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Conv. Rate</p>
                    <p className="text-2xl font-bold text-white mt-1">{analytics.conversionRateToInterview}</p>
                </div>

                {/* Metric 3 */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 min-w-[140px] text-center hover:scale-105 transition-transform duration-200">
                    <div className="flex justify-center mb-2 text-purple-400">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Avg. Days to Offer</p>
                    <p className="text-2xl font-bold text-white mt-1">
                        {analytics.averageDaysToOffer ? `${analytics.averageDaysToOffer}d` : 'N/A'}
                    </p>
                </div>
            </div>

            {/* Abstract Decorative Element */}
            <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -z-10 animate-pulse mix-blend-screen pointer-events-none" />
        </div>
    );
};

export default JobAnalyticsHUD;
