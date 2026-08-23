import React, { useState, useEffect } from 'react';
import MarketDataHUD from '../components/negotiation/MarketDataHUD';
import NegotiationChat from '../components/negotiation/NegotiationChat';
import { Send, LogOut, Calculator } from 'lucide-react';

const NegotiationTerminal = () => {
    const [sessionConfig, setSessionConfig] = useState({
        targetCompany: 'Meta',
        roleTitle: 'Senior Frontend Engineer',
        marketAverage: 185000,
        initialOffer: 165000,
        targetSalaryGoal: 195000
    });

    const [leverage, setLeverage] = useState(50);
    const [status, setStatus] = useState('NotStarted'); // NotStarted, InProgress, Accepted
    const [transcript, setTranscript] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        // Pseudo-start the session on mount
        setTimeout(() => {
            const recruiterPrompt = `Hi! We're thrilled to extend you an offer for the ${sessionConfig.roleTitle} position at ${sessionConfig.targetCompany}. Based on our internal bands, we can offer a base salary of $${sessionConfig.initialOffer.toLocaleString()}. How does that sound?`;

            setTranscript([{ role: 'recruiter', text: recruiterPrompt, type: 'initial_offer', proposedOffer: sessionConfig.initialOffer }]);
            setStatus('InProgress');
        }, 1500);
    }, [sessionConfig.roleTitle, sessionConfig.targetCompany, sessionConfig.initialOffer]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!userInput.trim() || status !== 'InProgress') return;

        // Extremely naive pseudo-extraction for demo visuals
        const numericAskMatch = userInput.match(/\$?(\d{3,},?\d{3})/);
        let extractedAsk = null;
        if (numericAskMatch) {
            extractedAsk = parseInt(numericAskMatch[1].replace(/,/g, ''), 10);
        }

        const newMsg = {
            role: 'candidate',
            text: userInput,
            ask: extractedAsk
        };

        setTranscript(prev => [...prev, newMsg]);
        setUserInput('');
        setIsTyping(true);

        // Pseudo-response logic delayed for realistic feel
        setTimeout(() => {
            let nextRecruiterReply = '';
            let updatedLeverage = leverage;
            let currentBestOffer = [...transcript].reverse().find(m => m.proposedOffer)?.proposedOffer || sessionConfig.initialOffer;

            if (extractedAsk) {
                if (extractedAsk <= currentBestOffer) {
                    nextRecruiterReply = `Great, I'm glad we could agree on $${extractedAsk.toLocaleString()}. We will send over the updated paperwork!`;
                    setStatus('Accepted');
                } else if (updatedLeverage > 40) {
                    const bump = Math.floor((extractedAsk - currentBestOffer) * 0.3); // Meet 30% of the way
                    const newOffer = currentBestOffer + bump;
                    nextRecruiterReply = `I appreciate your flexibility. I campaigned for you internally, and we can come up to $${newOffer.toLocaleString()}. That is our best and final offer.`;
                    setTranscript(prev => [...prev, { role: 'recruiter', text: nextRecruiterReply, proposedOffer: newOffer }]);
                    setLeverage(Math.max(0, updatedLeverage - 10)); // Spent leverage
                    setIsTyping(false);
                    return;
                } else {
                    nextRecruiterReply = `I completely understand, but $${currentBestOffer.toLocaleString()} is our absolute maximum for this equity band. We really can't go any higher.`;
                }
            } else {
                nextRecruiterReply = "I totally understand. Is there a specific base salary figure you were targeting based on your research?";
                updatedLeverage = Math.min(100, leverage + 5); // Kept it vague, built slight leverage
            }

            setLeverage(updatedLeverage);
            setTranscript(prev => [...prev, { role: 'recruiter', text: nextRecruiterReply }]);
            setIsTyping(false);

        }, 2200);
    };

    return (
        <div className="min-h-screen bg-gray-950 font-sans p-4 md:p-8 flex flex-col gap-6 selection:bg-emerald-500/30">

            {/* Header */}
            <div className="max-w-6xl mx-auto w-full flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-blue-400">
                        Salary Negotiation Simulator
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Master your leverage and secure higher counter-offers.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
                    <LogOut className="w-4 h-4" /> Exit
                </button>
            </div>

            {/* Main Desktop Real Estate */}
            <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 h-[70vh]">

                {/* HUD & Logic Column */}
                <div className="lg:col-span-4 mb-2">
                    <MarketDataHUD sessionInfo={sessionConfig} currentLeverage={leverage} />
                </div>

                {/* Chat Column */}
                <div className="lg:col-span-4 h-[55vh] flex flex-col gap-4 relative">
                    <NegotiationChat transcript={transcript} status={status} />

                    {isTyping && (
                        <div className="absolute bottom-[90px] left-6">
                            <span className="px-4 py-2 bg-indigo-900/40 text-indigo-300 rounded-full text-xs font-mono border border-indigo-500/20 animate-pulse block backdrop-blur-md">
                                AI Recruiter is typing...
                            </span>
                        </div>
                    )}

                    {/* Control Bar */}
                    <div className="bg-white/5 border border-white/10 p-2 rounded-2xl backdrop-blur-xl">
                        <form onSubmit={handleSubmit} className="flex gap-2 relative group">
                            <input
                                type="text"
                                value={userInput}
                                onChange={e => setUserInput(e.target.value)}
                                disabled={status === 'Accepted'}
                                placeholder={status === 'Accepted' ? "Simulation Ended. Offer Accepted." : "Reply to the recruiter (e.g. 'I was targeting $190,000...')"}
                                className="flex-1 bg-gray-900 border border-white/5 rounded-xl px-5 py-4 text-white outline-none focus:border-emerald-500/50 transition-colors placeholder-gray-600 disabled:opacity-50"
                            />
                            {userInput.length > 3 && (
                                <div className="absolute right-[80px] top-1/2 -translate-y-1/2 flex items-center gap-1 bg-gray-800 px-3 py-1 rounded text-[10px] text-gray-400 select-none">
                                    <Calculator className="w-3 h-3" /> Auto-extracting numbers
                                </div>
                            )}
                            <button
                                type="submit"
                                disabled={!userInput.trim() || status === 'Accepted'}
                                className="px-6 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:shadow-none transition-all active:scale-95 flex items-center justify-center"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>

            </div>

        </div>
    );
};

export default NegotiationTerminal;
