import React, { useMemo } from 'react';
import { Star, Shield, Trophy, LayoutGrid, Award, Crown, Zap } from 'lucide-react';

/**
 * BountyHUD (Heads Up Display)
 * 
 * Embedded globally or specifically on the Bounty Terminal page.
 * Renders the student's current Gamification standing, tiers, and point differentials
 * featuring premium glassmorphism styling and glowing iconography.
 * 
 * @param {Object} props
 * @param {number} props.reputation - The raw integer values of the student's points
 * @param {number} props.rank - The student's global ranking (e.g., #451)
 * @param {Array} props.recentSponsors - Up to 3 objects detailing the last sponsors they engaged
 */
const BountyHUD = ({ reputation = 0, rank = 0, recentSponsors = [] }) => {

    // Deterministic styling generation based on reputation thresholds
    const tierMatrix = useMemo(() => {
        if (reputation >= 10000) return { title: 'Titan', class: 'from-amber-400 to-yellow-600 shadow-yellow-500/50', icon: Crown, border: 'border-yellow-500/50' };
        if (reputation >= 5000) return { title: 'Diamond', class: 'from-cyan-400 to-blue-600 shadow-cyan-500/50', icon: Trophy, border: 'border-cyan-500/50' };
        if (reputation >= 2000) return { title: 'Gold', class: 'from-yellow-400 to-amber-500 shadow-amber-500/30', icon: Award, border: 'border-amber-400/50' };
        if (reputation >= 500) return { title: 'Silver', class: 'from-slate-300 to-gray-500 shadow-slate-500/30', icon: Shield, border: 'border-slate-400/50' };
        return { title: 'Bronze', class: 'from-orange-700 to-orange-900 shadow-orange-900/30', icon: Star, border: 'border-orange-800/50' };
    }, [reputation]);

    const TierIcon = tierMatrix.icon;

    // Percentage completion towards next tier calculation
    const progressPercent = useMemo(() => {
        let upperBrim = 500;
        let lowerBrim = 0;
        if (reputation >= 500) { lowerBrim = 500; upperBrim = 2000; }
        if (reputation >= 2000) { lowerBrim = 2000; upperBrim = 5000; }
        if (reputation >= 5000) { lowerBrim = 5000; upperBrim = 10000; }
        if (reputation >= 10000) return 100;

        return Math.min(100, Math.max(0, ((reputation - lowerBrim) / (upperBrim - lowerBrim)) * 100));
    }, [reputation]);

    return (
        <div className="w-full relative overflow-hidden bg-white/10 dark:bg-slate-900/40 backdrop-blur-3xl border border-white/20 dark:border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 group">

            {/* Absolute positional ambient lighting */}
            <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${tierMatrix.class} opacity-10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/3 group-hover:scale-150 transition-transform duration-1000`}></div>
            <div className={`absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr ${tierMatrix.class} opacity-10 blur-2xl rounded-full translate-y-1/2 -translate-x-1/2 flex items-center justify-center`}></div>

            {/* Left Block - Primary Metric */}
            <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
                <div className={`
          relative w-24 h-24 rounded-full border-4 ${tierMatrix.border} 
          flex flex-col items-center justify-center bg-white dark:bg-slate-950 shadow-xl
        `}>
                    <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${tierMatrix.class} opacity-20 animate-pulse`}></div>
                    <TierIcon className={`w-8 h-8 mb-1 bg-clip-text text-transparent bg-gradient-to-br ${tierMatrix.class} drop-shadow-md brightness-110 !text-slate-800 dark:!text-white`} />
                    <span className="text-xs font-black uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-br from-slate-500 to-slate-900 dark:from-white dark:to-slate-400">
                        {tierMatrix.title}
                    </span>
                </div>

                <div className="flex flex-col">
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-500" /> Global Reputation
                    </p>
                    <h2 className="text-5xl font-black text-slate-900 dark:text-white drop-shadow-sm tracking-tighter tabular-nums flex items-baseline gap-2">
                        {reputation.toLocaleString()}
                        <span className="text-xl font-bold text-slate-400 tracking-normal opacity-50">PTS</span>
                    </h2>
                    {rank > 0 && (
                        <p className="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            Top {((rank / 12000) * 100).toFixed(1)}% of students
                        </p>
                    )}
                </div>
            </div>

            {/* Center Block - Progress to Next Tier */}
            <div className="flex-1 w-full relative z-10 max-w-sm px-4 hidden lg:block">
                <div className="flex justify-between items-center mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <span>{tierMatrix.title}</span>
                    <span>Level Up Rank</span>
                </div>
                <div className="h-3 w-full bg-slate-200 dark:bg-slate-950 rounded-full overflow-hidden shadow-inner flex shadow-sm border border-slate-300 dark:border-slate-800">
                    <div
                        className={`h-full bg-gradient-to-r ${tierMatrix.class} shadow-lg transition-all duration-1000 ease-out`}
                        style={{ width: `${progressPercent}%` }}
                    ></div>
                </div>
                <p className="text-right text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-2">
                    {progressPercent < 100 ? `${(100 - progressPercent).toFixed(1)}% until next tier` : 'Maximum Tier Achieved!'}
                </p>
            </div>

            {/* Right Block - Engaged Sponsors Vault */}
            <div className="w-full md:w-auto relative z-10 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800/80 pt-6 md:pt-0 md:pl-8 flex flex-col justify-center">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4" /> Captured Corporate Drops
                </p>
                <div className="flex items-center gap-3">
                    {recentSponsors.length === 0 ? (
                        <span className="text-sm font-semibold text-slate-400 italic">No items identified yet...</span>
                    ) : (
                        recentSponsors.map((sponsor, idx) => (
                            <div
                                key={idx}
                                title={sponsor.companyName}
                                className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-md flex items-center justify-center font-bold text-xl hover:-translate-y-1 transition-transform cursor-help"
                                style={{
                                    color: sponsor.brandColor || '#3b82f6',
                                    borderColor: `${sponsor.brandColor}50` || 'inherit'
                                }}
                            >
                                {sponsor.companyName.charAt(0)}
                            </div>
                        ))
                    )}

                    {recentSponsors.length > 0 && (
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-inner flex items-center justify-center font-bold text-xs text-slate-600 transition-transform">
                            +ALL
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BountyHUD;
