import React, { useState, useEffect } from 'react';
import VideoTerminal from '../components/interview/VideoTerminal';
import RealtimeTranscript from '../components/interview/RealtimeTranscript';
import { PlayCircle, StopCircle, CornerDownRight } from 'lucide-react';

const MockInterviewArena = () => {
    const [isLive, setIsLive] = useState(false);
    const [transcript, setTranscript] = useState([]);
    const [aiStatus, setAiStatus] = useState('Standby');
    const [userInput, setUserInput] = useState('');

    // Prepopulate starting greeting
    useEffect(() => {
        if (isLive && transcript.length === 0) {
            setAiStatus('speaking');
            setTranscript([
                { role: 'ai', text: "Hello! I am your AI Engineer interviewer. Let's start by discussing your background in scalable architecture." }
            ]);
            setTimeout(() => setAiStatus('listening'), 3000);
        }
    }, [isLive, transcript.length]);

    const handleStartStop = () => {
        setIsLive(!isLive);
        if (isLive) {
            // End session
            setAiStatus('Standby');
        }
    };

    const handleSendInput = (e) => {
        e.preventDefault();
        if (!userInput.trim() || !isLive) return;

        // Optimistic UX
        setTranscript(prev => [...prev, { role: 'user', text: userInput }]);
        setUserInput('');
        setAiStatus('processing');

        // Simulate API delay for AI response
        setTimeout(() => {
            setAiStatus('speaking');
            setTranscript(prev => [...prev, {
                role: 'ai',
                text: "That makes sense. Can you explain the specific challenges you faced regarding database concurrency during that implementation?"
            }]);

            setTimeout(() => setAiStatus('listening'), 2500);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-gray-950 p-6 md:p-10 font-sans selection:bg-indigo-500/30">
            {/* Arena Header */}
            <div className="max-w-7xl mx-auto mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                        AI Mock Interview Arena
                    </h1>
                    <p className="text-gray-400 mt-2 font-medium">Senior Backend Engineer Track • System Design & Logic</p>
                </div>
                <div>
                    <button
                        onClick={handleStartStop}
                        className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold shadow-2xl transition-transform hover:scale-105 ${isLive ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white'}`}
                    >
                        {isLive ? (
                            <><StopCircle className="w-5 h-5" /> End Session</>
                        ) : (
                            <><PlayCircle className="w-5 h-5" /> Begin Interview</>
                        )}
                    </button>
                </div>
            </div>

            {/* Main Stage Grid */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 h-[75vh]">

                {/* Left Side: Video Terminal (Span 2) */}
                <div className="lg:col-span-2 flex flex-col gap-8">
                    <VideoTerminal isLive={isLive} aiStatus={aiStatus} />

                    {/* Chat Input for Text fallback */}
                    <div className="mt-auto">
                        <form onSubmit={handleSendInput} className="relative group">
                            <input
                                type="text"
                                value={userInput}
                                onChange={e => setUserInput(e.target.value)}
                                disabled={!isLive || aiStatus !== 'listening'}
                                placeholder={isLive ? (aiStatus === 'listening' ? "Type your response..." : "Wait for AI to finish...") : "Start the session to interact..."}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white outline-none focus:border-indigo-500 focus:bg-white/10 transition-all disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={!userInput.trim() || !isLive || aiStatus !== 'listening'}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:hover:bg-indigo-600"
                            >
                                <CornerDownRight className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right Side: Log Panel */}
                <div className="lg:col-span-1 h-full min-h-[500px]">
                    <RealtimeTranscript transcript={transcript} isLive={isLive} />
                </div>
            </div>
        </div>
    );
};

export default MockInterviewArena;
