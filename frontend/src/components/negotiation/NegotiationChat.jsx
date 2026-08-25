import React, { useEffect, useRef } from 'react';
import { User, Briefcase, Bot } from 'lucide-react';

const NegotiationChat = ({ transcript = [], status }) => {
    const scrollRef = useRef(null);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [transcript]);

    return (
        <div className="h-full flex flex-col bg-gray-900/40 rounded-2xl border border-white/10 backdrop-blur-md overflow-hidden relative">

            {/* Watermark Logo */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none">
                <Briefcase className="w-64 h-64" />
            </div>

            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar z-10"
            >
                {transcript.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                        Waiting for simulation to begin...
                    </div>
                ) : (
                    transcript.map((msg, idx) => {
                        const isRecruiter = msg.role === 'recruiter';

                        return (
                            <div key={idx} className={`flex gap-4 ${isRecruiter ? 'flex-row' : 'flex-row-reverse'}`}>

                                {/* Avatar */}
                                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${isRecruiter ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
                                    {isRecruiter ? <Bot className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-white" />}
                                </div>

                                {/* Message Container */}
                                <div className="flex flex-col gap-2 max-w-[85%]">
                                    {/* Name & Stamp */}
                                    <div className={`flex items-center gap-2 text-xs ${isRecruiter ? 'flex-row' : 'flex-row-reverse'}`}>
                                        <span className="font-bold text-gray-300">{isRecruiter ? 'AI Recruiter' : 'You'}</span>
                                    </div>

                                    {/* Bubble */}
                                    <div className={`
                                        px-5 py-4 shadow-xl text-sm leading-relaxed
                                        ${isRecruiter ? 'bg-white/10 text-white rounded-2xl rounded-tl-sm border border-white/5' : 'bg-gradient-to-br from-emerald-600 to-emerald-500 text-white rounded-2xl rounded-tr-sm border border-emerald-500/30'}
                                    `}>
                                        {msg.text}

                                        {/* Optional extraction pill */}
                                        {msg.proposedOffer && (
                                            <div className="mt-3 pt-3 border-t border-white/20 flex items-center gap-2">
                                                <span className="bg-indigo-500/20 border border-indigo-500/50 text-indigo-300 px-3 py-1 text-xs font-bold rounded-full">
                                                    Proposed: ${msg.proposedOffer.toLocaleString()}
                                                </span>
                                            </div>
                                        )}

                                        {msg.ask && (
                                            <div className="mt-3 pt-3 border-t border-white/20 flex items-center gap-2 justify-end">
                                                <span className="bg-emerald-900/40 border border-emerald-400/50 text-emerald-200 px-3 py-1 text-xs font-bold rounded-full">
                                                    Counter Ask: ${msg.ask.toLocaleString()}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </div>
                        );
                    })
                )}

                {status === 'Accepted' && (
                    <div className="w-full flex justify-center py-6">
                        <div className="px-6 py-3 bg-emerald-500/20 border border-emerald-500/40 rounded-full text-emerald-400 text-sm font-bold shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                            Offer Accepted. Simulation Concluded.
                        </div>
                    </div>
                )}
            </div>

            {/* Floating shadow for depth over scroll */}
            <div className="h-6 w-full bg-gradient-to-t from-gray-950 to-transparent absolute bottom-0 z-20 pointer-events-none" />
        </div>
    );
};

export default NegotiationChat;
