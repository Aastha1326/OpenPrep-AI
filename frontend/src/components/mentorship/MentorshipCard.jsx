import React from 'react';
import { UserCircle2, Briefcase, Star, Clock, CheckBadge, Zap } from 'lucide-react';

const MentorshipCard = ({ mentor, onConnectClick }) => {

    // Derived UI states based on availability
    const isAvailable = mentor.availabilityStatus === 'Open';
    const isWaitlist = mentor.availabilityStatus === 'Waitlist';

    return (
        <div className="bg-gray-900 border border-white/10 rounded-3xl p-6 shadow-2xl relative group hover:border-blue-500/40 transition-colors duration-300 overflow-hidden flex flex-col h-full">

            {/* Ambient Background Gradient based on Score */}
            <div
                className="absolute inset-0 opacity-10 blur-3xl pointer-events-none transition-opacity duration-300 group-hover:opacity-20"
                style={{
                    background: `linear-gradient(to bottom right, ${mentor.matchAffinityScore > 80 ? '#10b981' : '#3b82f6'}, transparent)`
                }}
            />

            <div className="relative z-10 flex flex-col h-full">
                {/* Header Area */}
                <div className="flex justify-between items-start mb-6">
                    <div className="flex gap-4 items-center">
                        <div className="w-14 h-14 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center border-2 border-gray-600 group-hover:border-blue-400 transition-colors shadow-lg">
                            <UserCircle2 className="w-8 h-8 text-gray-400 group-hover:text-blue-300" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                {mentor.fullName}
                                {mentor.isVerified && <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400/20" title="Verified Alumni" />}
                            </h3>
                            <p className="text-gray-400 text-sm font-medium">{mentor.currentRole}</p>
                        </div>
                    </div>

                    {/* Affinity Badge */}
                    <div className="flex flex-col items-center justify-center bg-black/40 border border-white/5 rounded-xl px-3 py-2 shadow-inner">
                        <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-1">Affinity</span>
                        <span className={`text-xl font-black ${mentor.matchAffinityScore >= 80 ? 'text-emerald-400' : 'text-blue-400'}`}>
                            {mentor.matchAffinityScore}
                        </span>
                    </div>
                </div>

                {/* Company & Details */}
                <div className="mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-300 font-semibold mb-2">
                        <Briefcase className="w-4 h-4 text-purple-400" /> {mentor.currentCompany}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                        <Clock className="w-4 h-4 text-emerald-400" /> {mentor.yearsOfExperience} Years Experience
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2 italic mb-4 leading-relaxed">
                        "{mentor.bioText}"
                    </p>
                </div>

                {/* Skills Pills */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {(mentor.skillsRequired || []).map((skill, idx) => (
                        <span key={idx} className="px-3 py-1 bg-white/5 text-gray-300 border border-white/10 rounded-md text-xs font-semibold">
                            {skill}
                        </span>
                    ))}
                </div>

                {/* Action Area (Pushed to bottom) */}
                <div className="mt-auto border-t border-white/10 pt-5 flex items-center justify-between">
                    <div>
                        {isAvailable && <span className="text-xs font-bold tracking-widest uppercase text-emerald-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Accepting Mentees</span>}
                        {isWaitlist && <span className="text-xs font-bold tracking-widest uppercase text-yellow-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400" /> Waitlist Open</span>}
                        {!isAvailable && !isWaitlist && <span className="text-xs font-bold tracking-widest uppercase text-red-400 flex items-center gap-1">Full Capacity</span>}
                    </div>

                    <button
                        onClick={() => onConnectClick(mentor)}
                        disabled={!isAvailable && !isWaitlist}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95
                            ${isAvailable || isWaitlist
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500'
                                : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'}
                        `}
                    >
                        {isWaitlist ? 'Join Waitlist' : 'Connect'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MentorshipCard;
