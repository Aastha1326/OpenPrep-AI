import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, Settings, ShieldAlert, Monitor, User } from 'lucide-react';

const VideoTerminal = ({ isLive, aiStatus, onToggleMic, onToggleCam }) => {
    const [micOn, setMicOn] = useState(false);
    const [camOn, setCamOn] = useState(false);
    const [volume, setVolume] = useState(0);

    // Simulate volume meter when mic is on
    useEffect(() => {
        if (!micOn || !isLive) return;
        const interval = setInterval(() => {
            setVolume(Math.random() * 100);
        }, 150);
        return () => clearInterval(interval);
    }, [micOn, isLive]);

    const handleMicToggle = () => {
        setMicOn(!micOn);
        if (onToggleMic) onToggleMic(!micOn);
    };

    const handleCamToggle = () => {
        setCamOn(!camOn);
        if (onToggleCam) onToggleCam(!camOn);
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Split Screen Video Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[400px]">
                {/* AI Interviewer Side */}
                <div className="relative bg-gray-900 rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center">
                    {/* Background abstract AI effect */}
                    <div className="absolute inset-0 bg-blue-900/20 mix-blend-screen" />
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-3xl transition-opacity duration-1000 ${isLive && aiStatus === 'speaking' ? 'bg-indigo-500/40 animate-pulse' : 'bg-transparent'}`} />

                    <div className="relative z-10 flex flex-col items-center gap-4">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center ${isLive ? 'bg-indigo-600 shadow-[0_0_30px_rgba(79,70,229,0.5)]' : 'bg-gray-800 border border-gray-700'}`}>
                            <Monitor className={`w-10 h-10 ${isLive ? 'text-white' : 'text-gray-500'}`} />
                        </div>
                        <h3 className="text-white font-medium text-lg">AI Interviewer</h3>
                        {isLive && (
                            <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30 uppercase tracking-widest font-bold">
                                {aiStatus || 'Listening...'}
                            </span>
                        )}
                    </div>
                </div>

                {/* User Camera Side */}
                <div className="relative bg-gray-900 rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center">
                    <div className="relative z-10 flex flex-col items-center gap-4">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center ${camOn ? 'bg-gray-800' : 'bg-gray-800 border border-gray-700'}`}>
                            <User className={`w-10 h-10 ${camOn ? 'text-gray-200' : 'text-gray-500'}`} />
                        </div>
                        <h3 className="text-gray-400 font-medium">{camOn ? 'Candidate Camera Active' : 'Camera Off'}</h3>
                    </div>

                    {/* Controls overlay */}
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                        <button
                            onClick={handleMicToggle}
                            className={`p-3 rounded-full flex items-center justify-center transition-all shadow-lg ${micOn ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-red-500 text-white hover:bg-red-400'}`}
                        >
                            {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                        </button>
                        <button
                            onClick={handleCamToggle}
                            className={`p-3 rounded-full flex items-center justify-center transition-all shadow-lg ${camOn ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-red-500 text-white hover:bg-red-400'}`}
                        >
                            {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                        </button>
                    </div>

                    {/* Mic Volume Meter */}
                    {micOn && (
                        <div className="absolute right-4 bottom-4 top-4 w-1 bg-gray-800 rounded-full overflow-hidden flex flex-col-reverse">
                            <div
                                className="w-full bg-gradient-to-t from-green-400 via-yellow-400 to-red-400 transition-all duration-150"
                                style={{ height: `${volume}%` }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Settings & Info Bar */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center text-sm text-gray-400">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1"><ShieldAlert className="w-4 h-4 text-emerald-400" /> End-to-End Encrypted Session</span>
                </div>
                <button className="flex items-center gap-2 hover:text-white transition-colors">
                    <Settings className="w-4 h-4" /> AV Settings
                </button>
            </div>
        </div>
    );
};

export default VideoTerminal;
