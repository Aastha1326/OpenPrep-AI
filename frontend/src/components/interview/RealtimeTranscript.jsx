import React, { useEffect, useRef } from 'react';
import { AlignLeft, Bot, User } from 'lucide-react';

const RealtimeTranscript = ({ transcript = [], isLive }) => {
    const scrollRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [transcript]);

    return (
        <div className="h-full bg-white/5 border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-2xl backdrop-blur-md">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 bg-black/20 flex items-center justify-between">
                <h3 className="text-white font-semibold flex items-center gap-2">
                    <AlignLeft className="w-5 h-5 text-indigo-400" />
                    Live Transcript
                </h3>
                {isLive && (
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-xs text-gray-400 tracking-wider">RECORDING</span>
                    </div>
                )}
            </div>

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 p-6 overflow-y-auto space-y-6 scroll-smooth custom-scrollbar"
            >
                {transcript.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                        Waiting for interview to begin...
                    </div>
                ) : (
                    transcript.map((msg, idx) => {
                        const isAi = msg.role === 'ai';
                        return (
                            <div key={idx} className={`flex gap-4 ${isAi ? 'flex-row' : 'flex-row-reverse'}`}>
                                {/* Avatar */}
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${isAi ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
                                    {isAi ? <Bot className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-white" />}
                                </div>

                                {/* Bubble */}
                                <div className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-md ${isAi ? 'bg-white/10 rounded-tl-none border border-white/5' : 'bg-blue-600/40 rounded-tr-none border border-blue-500/20'}`}>
                                    <p className="text-gray-200 text-sm leading-relaxed">
                                        {msg.text}
                                    </p>
                                </div>

                                {/* Padding for alignment */}
                                <div className="flex-1" />
                            </div>
                        );
                    })
                )}
            </div>

            {/* Type indicator */}
            {isLive && transcript[transcript.length - 1]?.role === 'user' && (
                <div className="px-6 pb-4 pt-2 text-xs text-indigo-300 italic animate-pulse">
                    AI is processing response...
                </div>
            )}
        </div>
    );
};

export default RealtimeTranscript;
