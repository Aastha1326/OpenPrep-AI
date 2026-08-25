import React from 'react';
import { Target, TrendingUp, Briefcase, Hash, DollarSign, Activity, Zap } from 'lucide-react';

const MarketDataHUD = ({ sessionInfo, currentLeverage = 50 }) => {

    // Safety fallback
    if (!sessionInfo) return null;

    const { targetCompany = 'Unknown', roleTitle = 'Software Engineer', marketAverage = 110000, initialOffer = 100000, targetSalaryGoal = 130000 } = sessionInfo;

    return (
        <div className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
            {/* Ambient Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-blue-500/10 opacity-50 z-0 pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8">

                {/* Context Block */}
                <div className="md:col-span-4 flex flex-col justify-center">
                    <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                        <Briefcase className="w-6 h-6 text-emerald-400" />
                        {targetCompany}
                    </h2>
                    <p className="text-gray-400 font-medium text-sm tracking-widest uppercase mb-1">
                        {roleTitle}
                    </p>
                    <div className="flex items-center gap-2 mt-4 text-emerald-300 bg-emerald-500/10 w-max px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/20">
                        <Zap className="w-3 h-3" /> Active Negotiation
                    </div>
                </div>

                {/* Telemetry Multi-Stats Block */}
                <div className="md:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-4">

                    {/* Market Avg */}
                    <div className="bg-gray-900/60 rounded-xl p-4 border border-white/5 shadow-inner">
                        <div className="flex justify-between items-center mb-2">
                            <Hash className="w-4 h-4 text-gray-500" />
                            <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Market Avg</span>
                        </div>
                        <p className="text-xl font-bold text-gray-200">
                            ${marketAverage.toLocaleString()}
                        </p>
                    </div>

                    {/* Initial Offer */}
                    <div className="bg-gray-900/60 rounded-xl p-4 border border-white/5 shadow-inner">
                        <div className="flex justify-between items-center mb-2">
                            <DollarSign className="w-4 h-4 text-red-400" />
                            <span className="text-[10px] font-bold tracking-widest text-red-300 uppercase">Initial Offer</span>
                        </div>
                        <p className="text-xl font-bold text-white">
                            ${initialOffer.toLocaleString()}
                        </p>
                    </div>

                    {/* Target Goal */}
                    <div className="bg-gray-900/60 rounded-xl p-4 border border-emerald-500/20 shadow-inner overflow-hidden relative">
                        <div className="absolute inset-0 bg-emerald-500/5" />
                        <div className="relative">
                            <div className="flex justify-between items-center mb-2">
                                <Target className="w-4 h-4 text-emerald-400" />
                                <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase">Your Goal</span>
                            </div>
                            <p className="text-xl font-bold text-emerald-400 drop-shadow-md">
                                ${targetSalaryGoal.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {/* Leverage Score */}
                    <div className="bg-gray-900/60 rounded-xl p-4 border border-white/5 shadow-inner col-span-2 md:col-span-1">
                        <div className="flex justify-between items-center mb-2">
                            <Activity className="w-4 h-4 text-purple-400" />
                            <span className="text-[10px] font-bold tracking-widest text-purple-300 uppercase">Leverage</span>
                        </div>
                        <div className="flex items-end gap-2">
                            <p className="text-xl font-bold text-white">
                                {currentLeverage}
                            </p>
                            <span className="text-xs text-gray-500 mb-1">/ 100</span>
                        </div>
                        {/* Mini progress bar */}
                        <div className="w-full bg-white/10 h-1 mt-2 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 transition-all duration-700"
                                style={{ width: `${currentLeverage}%` }}
                            />
                        </div>
                    </div>

                </div>
            </div>

        </div>
    );
};

export default MarketDataHUD;
