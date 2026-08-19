import React, { useState } from 'react';
import { Mic, MicOff, Play, Send, Bot, CheckCircle2, Sparkles } from 'lucide-react';
import { 
    MOCK_INTERVIEW_QUESTIONS, 
    evaluateInterviewResponse 
} from '../../services/mockInterviewEngine';
import { InterviewScorecardView } from './InterviewScorecardView';

export const TechnicalMockInterviewHub = () => {
    const [selectedQuestion, setSelectedQuestion] = useState(MOCK_INTERVIEW_QUESTIONS[0]);
    const [userAnswerText, setUserAnswerText] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [scorecard, setScorecard] = useState(null);

    const handleToggleRecording = () => {
        setIsRecording(prev => !prev);
    };

    const handleSubmitResponse = () => {
        if (!userAnswerText.trim()) return;
        const result = evaluateInterviewResponse(userAnswerText.length, 3);
        setScorecard(result);
    };

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6 text-slate-100 font-sans p-4">
            {/* Banner Header */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-2xl">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                    <Bot className="w-4 h-4" /> OpenPrep-AI Voice & Code Mock Interviewer
                </div>
                <h1 className="text-2xl font-black text-slate-100">Technical Mock Interview Simulator</h1>
                <p className="text-xs text-slate-400">Practice real-time system design and algorithm questions with instant AI scoring.</p>
            </div>

            {!scorecard ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Question Selection Sidebar */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Available Prompts</span>
                        <div className="space-y-2">
                            {MOCK_INTERVIEW_QUESTIONS.map((q) => (
                                <button
                                    key={q.id}
                                    type="button"
                                    onClick={() => { setSelectedQuestion(q); setUserAnswerText(''); }}
                                    className={`w-full text-left p-3.5 rounded-2xl border transition-all space-y-1 ${
                                        selectedQuestion.id === q.id
                                            ? 'bg-indigo-600/10 border-indigo-500 text-indigo-300'
                                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                                    }`}
                                >
                                    <div className="flex items-center justify-between text-[10px] font-bold">
                                        <span className="uppercase">{q.domain}</span>
                                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">{q.difficulty}</span>
                                    </div>
                                    <h4 className="text-xs font-bold leading-tight">{q.title}</h4>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Active Question Workspace */}
                    <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 flex flex-col justify-between">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                <div>
                                    <span className="text-xs font-bold text-indigo-400 uppercase">{selectedQuestion.domain}</span>
                                    <h3 className="text-lg font-bold text-slate-100">{selectedQuestion.title}</h3>
                                </div>
                                <span className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
                                    ⏱ {selectedQuestion.suggestedDurationMins} Mins
                                </span>
                            </div>

                            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
                                {selectedQuestion.prompt}
                            </p>

                            <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase text-slate-500 block">Expected Key Elements:</span>
                                <div className="space-y-1">
                                    {selectedQuestion.keyPointsExpected.map((pt, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-400">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                                            <span>{pt}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Response Textarea */}
                            <div className="space-y-2 pt-2">
                                <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
                                    <span>Your Technical Answer / Architectural Plan:</span>
                                    <button
                                        type="button"
                                        onClick={handleToggleRecording}
                                        className={`px-3 py-1 rounded-xl border text-[11px] flex items-center gap-1.5 transition-all ${
                                            isRecording
                                                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse'
                                                : 'bg-slate-950 border-slate-800 text-slate-300'
                                        }`}
                                    >
                                        {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                                        <span>{isRecording ? 'Listening (Speech to Text)...' : 'Record Voice Answer'}</span>
                                    </button>
                                </div>

                                <textarea
                                    value={userAnswerText}
                                    onChange={(e) => setUserAnswerText(e.target.value)}
                                    rows={5}
                                    placeholder="Type or speak your answer here. Detail trade-offs, data structures, and edge cases..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleSubmitResponse}
                            disabled={!userAnswerText.trim()}
                            className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 mt-4"
                        >
                            <Sparkles className="w-4 h-4" />
                            <span>Evaluate Response with AI</span>
                        </button>
                    </div>
                </div>
            ) : (
                <InterviewScorecardView scorecard={scorecard} onRestart={() => setScorecard(null)} />
            )}
        </div>
    );
};

export default TechnicalMockInterviewHub;
