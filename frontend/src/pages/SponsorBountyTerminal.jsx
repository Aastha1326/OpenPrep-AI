import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Shield, Zap, RefreshCw, Key, Crosshair, ArrowRight, Activity, Command, Package, Star } from 'lucide-react';
import BountyHUD from '../components/bounties/BountyHUD';

/**
 * SponsorBountyTerminal
 * 
 * An interactive, gamified "Hacker/Cyberpunk" style terminal view where 
 * students enter encrypted 16-character bounty hashes sourced from real-life
 * career fair interactions. 
 * High-velocity production UI with built in simulated delays, format masks, and success toasts.
 */
const SponsorBountyTerminal = () => {
    // ------------ State ------------
    const [tokenInput, setTokenInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [terminalLog, setTerminalLog] = useState([
        { type: 'SYSTEM', message: 'CONNECTION SECURE. BOUNTY SUBSYSTEM INITIALIZED.', time: new Date().toLocaleTimeString() },
        { type: 'INFO', message: 'Ready to receive encrypted corporate drops.', time: new Date().toLocaleTimeString() }
    ]);

    const [studentStats, setStudentStats] = useState({
        reputation: 840,
        rank: 2153,
        history: [
            { companyName: 'OpenAI', brandColor: '#10a37f' },
            { companyName: 'Stripe', brandColor: '#635bff' }
        ]
    });

    const scrollRef = useRef(null);

    // Auto-scroll terminal log
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [terminalLog]);

    // ------------ Token Masking Strategy ------------
    // Automatically insert hyphens: XXXX-XXXX-XXXX-XXXX
    const handleInputChange = (e) => {
        let raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        let formatted = '';
        for (let i = 0; i < raw.length; i++) {
            if (i > 0 && i % 4 === 0) formatted += '-';
            formatted += raw[i];
        }
        // Max length is 19 (16 chars + 3 dashes)
        setTokenInput(formatted.substring(0, 19));
    };

    // ------------ Execution Handler ------------
    const submitBountyClaim = (e) => {
        e?.preventDefault();
        if (tokenInput.length !== 19 || isProcessing) return;

        setIsProcessing(true);
        const attemptTime = new Date().toLocaleTimeString();

        appendLog('ACTION', `TRANSMITTING TOKEN HASH [${tokenInput.substring(0, 4)}-****-****-****]`, attemptTime);

        // Simulated network delay mocking BountyRPCService verification
        setTimeout(() => {
            // Mock Failure state occasionally for demonstration of interactive terminal
            if (tokenInput.startsWith('FAIL')) {
                appendLog('ERROR', 'REMOTE REJECTION: TOKEN HASH INVALID OR PREVIOUSLY CLAIMED.', new Date().toLocaleTimeString());
                setIsProcessing(false);
                setTokenInput('');
                return;
            }

            // Mock Success State
            const gainedRep = Math.floor(Math.random() * (5000 - 500) + 500);
            const colors = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            const randomCompany = ['Tesla', 'SpaceX', 'Vercel', 'NextJS', 'Google'][Math.floor(Math.random() * 5)];

            appendLog('SUCCESS', `DECRYPTED. PAYLOAD VALID. OFFLOADING ${gainedRep} PTS FROM [${randomCompany.toUpperCase()}].`, new Date().toLocaleTimeString());

            setStudentStats(prev => ({
                ...prev,
                reputation: prev.reputation + gainedRep,
                history: [...prev.history, { companyName: randomCompany, brandColor: randomColor }]
            }));

            setTokenInput('');
            setIsProcessing(false);
        }, 1500);
    };

    const appendLog = (type, message, time) => {
        setTerminalLog(prev => [...prev.slice(-49), { type, message, time }]);
    };

    // ------------ RENDER ------------
    return (
        <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">

            {/* Immersive HUD Overlay */}
            <div className="p-4 md:p-8 relative z-20">
                <BountyHUD
                    reputation={studentStats.reputation}
                    rank={studentStats.rank}
                    recentSponsors={studentStats.history}
                />
            </div>

            {/* Main Terminal Frame */}
            <div className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 pb-12 flex flex-col lg:flex-row gap-8 relative z-10 animate-in slide-in-from-bottom-8 duration-700 fade-in">

                {/* Left Column - Input Area */}
                <div className="w-full lg:w-1/3 flex flex-col gap-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden group">

                        {/* Scanline decoration */}
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjIiIGZpbGw9IiMzMzMiLz48L3N2Zz4=')] opacity-20 pointer-events-none mix-blend-overlay"></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                                    <Key className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black tracking-tight text-white">DECRYPT BOUNTY</h2>
                                    <p className="text-xs text-cyan-500 font-mono tracking-widest uppercase mt-0.5">Awaiting Input Signal</p>
                                </div>
                            </div>

                            <form onSubmit={submitBountyClaim} className="flex flex-col gap-4">
                                <div className="relative">
                                    <Crosshair className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={tokenInput}
                                        onChange={handleInputChange}
                                        disabled={isProcessing}
                                        placeholder="XXXX-XXXX-XXXX-XXXX"
                                        className="w-full pl-12 pr-4 py-4 bg-black border border-slate-700 rounded-xl font-mono text-lg text-cyan-200 tracking-[0.2em] focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all disabled:opacity-50 placeholder:text-slate-700 uppercase"
                                    />
                                    {/* Character count bar */}
                                    <div className="absolute bottom-0 left-0 h-1 bg-slate-800 rounded-b-xl w-full overflow-hidden">
                                        <div
                                            className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.8)] transition-all duration-300"
                                            style={{ width: `${(tokenInput.length / 19) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={tokenInput.length !== 19 || isProcessing}
                                    className="w-full py-4 rounded-xl bg-white text-black font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:bg-cyan-400 hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] disabled:opacity-20 disabled:cursor-not-allowed group/btn"
                                >
                                    {isProcessing ? (
                                        <>
                                            <RefreshCw className="w-5 h-5 animate-spin" />
                                            PROCESSING SIGNAL
                                        </>
                                    ) : (
                                        <>
                                            INITIATE DECRYPTION
                                            <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform" />
                                        </>
                                    )}
                                </button>

                                <p className="text-slate-500 text-xs text-center mt-2 flex justify-center items-center gap-1.5 font-mono">
                                    <Shield className="w-3.5 h-3.5" /> 128-BIT SECURE CONNECTION
                                </p>
                            </form>
                        </div>
                    </div>

                    {/* Reward Inventory Mini View */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden flex-1 flex flex-col">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Package className="w-4 h-4" /> Payload Inventory
                        </h3>

                        <div className="flex-1 flex flex-col justify-center items-center opacity-50 p-6 border-2 border-dashed border-slate-800 rounded-xl">
                            <Star className="w-10 h-10 text-slate-700 mb-3" />
                            <p className="text-slate-500 text-xs text-center font-bold">DIGITAL SWAG LOCKED.<br />DECRYPT TOKENS TO REVEAL INVENTORY.</p>
                        </div>
                    </div>
                </div>

                {/* Right Column - Terminal Readout */}
                <div className="w-full lg:w-2/3 bg-black border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col relative">
                    {/* Terminal Window Header (MacOS style) */}
                    <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-rose-500/20 border border-rose-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                        </div>
                        <div className="text-xs font-mono text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Command className="w-3 h-3" /> RPC_GATEWAY_V7
                        </div>
                        <div></div> {/* Spacer */}
                    </div>

                    {/* Actual Log Output Region */}
                    <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto font-mono text-sm leading-relaxed scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                        {terminalLog.map((log, index) => (
                            <div key={index} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 mb-2 animate-in fade-in duration-300">
                                <span className="text-slate-600 shrink-0 text-xs sm:text-sm mt-1 sm:mt-0">[{log.time}]</span>
                                <span className={`shrink-0 font-bold hidden sm:block
                     ${log.type === 'SYSTEM' ? 'text-purple-400'
                                        : log.type === 'INFO' ? 'text-blue-400'
                                            : log.type === 'ACTION' ? 'text-cyan-400'
                                                : log.type === 'ERROR' ? 'text-rose-500'
                                                    : 'text-emerald-400'}
                  `}>
                                    {log.type.padEnd(8, ' ')}
                                </span>
                                {/* Mobile badge version of type */}
                                <span className={`shrink-0 font-bold inline-block sm:hidden px-1.5 py-0.5 rounded ml-1 text-[10px]
                     ${log.type === 'SYSTEM' ? 'bg-purple-900/30 text-purple-400'
                                        : log.type === 'INFO' ? 'bg-blue-900/30 text-blue-400'
                                            : log.type === 'ACTION' ? 'bg-cyan-900/30 text-cyan-400'
                                                : log.type === 'ERROR' ? 'bg-rose-900/30 text-rose-500'
                                                    : 'bg-emerald-900/30 text-emerald-400'}
                  `}>
                                    {log.type}
                                </span>

                                <span className={`flex-1 break-all sm:break-normal ${log.type === 'ERROR' && 'text-rose-400 font-bold'}`}>
                                    {log.message}
                                </span>
                            </div>
                        ))}

                        {isProcessing && (
                            <div className="flex items-center gap-4 mt-4 opacity-50">
                                <span className="text-cyan-400 flex">
                                    <span className="animate-[pulse_1s_infinite]">█</span>
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SponsorBountyTerminal;
