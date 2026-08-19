import React, { useState, useEffect } from 'react';
import { 
    Mic, 
    MicOff, 
    Send, 
    Play, 
    Sparkles, 
    RefreshCw, 
    HelpCircle, 
    Cpu, 
    MessageSquare, 
    Clock, 
    CheckCircle2, 
    AlertCircle,
    Volume2,
    Sliders,
    Brain,
    Shield
} from 'lucide-react';
import { 
    VivaSessionConfig, 
    VivaQuestionTurn, 
    VIVA_SUBJECT_PRESETS,
    generateOpeningQuestion,
    evaluateTurnAndGenerateFollowUp,
    calculateVivaScorecard,
    VivaScorecard
} from './vivaEngine';
import { ExaminerAvatar } from './ExaminerAvatar';
import { VivaScorecardModal } from './VivaScorecardModal';

export const VivaSimulatorCanvas: React.FC = () => {
    // Session State
    const [status, setStatus] = useState<'setup' | 'in_progress' | 'evaluating' | 'completed'>('setup');
    const [config, setConfig] = useState<VivaSessionConfig>({
        subject: VIVA_SUBJECT_PRESETS[0].subject,
        topic: VIVA_SUBJECT_PRESETS[0].topics[0],
        academicLevel: 'undergraduate',
        examinerPersona: 'strict_professor',
        maxTurns: 4
    });

    const [turns, setTurns] = useState<VivaQuestionTurn[]>([]);
    const [currentTurnIndex, setCurrentTurnIndex] = useState<number>(0);
    const [currentQuestion, setCurrentQuestion] = useState<string>('');
    const [studentAnswer, setStudentAnswer] = useState<string>('');
    const [isListening, setIsListening] = useState<boolean>(false);
    const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
    const [timerSeconds, setTimerSeconds] = useState<number>(0);
    const [scorecard, setScorecard] = useState<VivaScorecard | null>(null);

    // Live Turn Timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === 'in_progress') {
            interval = setInterval(() => {
                setTimerSeconds(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [status]);

    // Handle Start Viva Session
    const handleStartSession = () => {
        const initialQuestion = generateOpeningQuestion(config);
        setCurrentQuestion(initialQuestion);
        setTurns([]);
        setCurrentTurnIndex(1);
        setStatus('in_progress');
        setTimerSeconds(0);
        setStudentAnswer('');
        
        // Simulate TTS Opening Question
        setIsSpeaking(true);
        setTimeout(() => setIsSpeaking(false), 2500);
    };

    // Handle Speech Microphone Toggle Simulation
    const toggleSpeechInput = () => {
        if (isListening) {
            setIsListening(false);
        } else {
            setIsListening(true);
            // Simulated Web Speech API recognition transcript filling
            setTimeout(() => {
                setStudentAnswer(prev => prev ? `${prev} Additionally, thread deadlock conditions depend on non-preemptible resource allocation.` : "In process synchronization, deadlocks require non-preemption, hold and wait, mutual exclusion, and circular wait. Operating system kernels break circular wait using ordered resource acquisition lock hierarchies.");
                setIsListening(false);
            }, 3000);
        }
    };

    // Handle Submit Answer
    const handleSubmitAnswer = () => {
        if (!studentAnswer.trim()) return;

        const { nextQuestion, turnEvaluation } = evaluateTurnAndGenerateFollowUp(
            currentTurnIndex,
            currentQuestion,
            studentAnswer,
            config
        );

        const newTurn: VivaQuestionTurn = {
            turnNumber: currentTurnIndex,
            question: currentQuestion,
            studentResponse: studentAnswer,
            responseMode: 'text',
            responseTimeSeconds: timerSeconds,
            conceptualScore: turnEvaluation.conceptualScore || 75,
            technicalAccuracy: turnEvaluation.technicalAccuracy || 70,
            examinerFeedback: turnEvaluation.examinerFeedback || 'Solid technical response.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const updatedTurns = [...turns, newTurn];
        setTurns(updatedTurns);
        setStudentAnswer('');
        setTimerSeconds(0);

        if (currentTurnIndex >= config.maxTurns) {
            // Finish Session and Generate Scorecard
            setStatus('evaluating');
            setTimeout(() => {
                const finalCard = calculateVivaScorecard(updatedTurns, config);
                setScorecard(finalCard);
                setStatus('completed');
            }, 1500);
        } else {
            setCurrentTurnIndex(prev => prev + 1);
            setCurrentQuestion(nextQuestion);
            setIsSpeaking(true);
            setTimeout(() => setIsSpeaking(false), 2500);
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6">
            {/* Header Title Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl">
                <div>
                    <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
                        <Brain className="w-4 h-4" />
                        Interactive Oral Examination Module
                    </div>
                    <h1 className="text-2xl font-black text-slate-100 mt-1">AI Viva Voce Interview Simulator</h1>
                    <p className="text-xs text-slate-400">Practice multi-turn technical oral viva exams with real-time academic examiner follow-ups.</p>
                </div>

                <div className="flex items-center gap-3">
                    <span className="px-3 py-1.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5" /> Gemini 1.5 Multi-Turn Persona
                    </span>
                </div>
            </div>

            {/* Setup Screen */}
            {status === 'setup' && (
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
                    <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
                        <Sliders className="w-5 h-5 text-indigo-400" />
                        Configure Viva Voce Examination Parameters
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Subject Selection */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Select Examination Domain</label>
                            <select
                                value={config.subject}
                                onChange={(e) => {
                                    const selectedPreset = VIVA_SUBJECT_PRESETS.find(p => p.subject === e.target.value);
                                    setConfig({
                                        ...config,
                                        subject: e.target.value,
                                        topic: selectedPreset ? selectedPreset.topics[0] : ''
                                    });
                                }}
                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                            >
                                {VIVA_SUBJECT_PRESETS.map((preset, idx) => (
                                    <option key={idx} value={preset.subject}>{preset.subject}</option>
                                ))}
                            </select>
                        </div>

                        {/* Specific Topic Selection */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Select Specific Topic Focus</label>
                            <select
                                value={config.topic}
                                onChange={(e) => setConfig({ ...config, topic: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                            >
                                {(VIVA_SUBJECT_PRESETS.find(p => p.subject === config.subject)?.topics || []).map((top, idx) => (
                                    <option key={idx} value={top}>{top}</option>
                                ))}
                            </select>
                        </div>

                        {/* Academic Level */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Academic Standard Level</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['undergraduate', 'postgraduate', 'doctoral'] as const).map((level) => (
                                    <button
                                        key={level}
                                        type="button"
                                        onClick={() => setConfig({ ...config, academicLevel: level })}
                                        className={`p-3 rounded-2xl border text-xs font-bold capitalize transition-all ${
                                            config.academicLevel === level
                                                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                                        }`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Examiner Persona Selection */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">AI Examiner Persona</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: 'strict_professor', label: 'Strict Chair' },
                                    { id: 'supportive_mentor', label: 'Research Mentor' },
                                    { id: 'industry_expert', label: 'System Architect' }
                                ].map((persona) => (
                                    <button
                                        key={persona.id}
                                        type="button"
                                        onClick={() => setConfig({ ...config, examinerPersona: persona.id as any })}
                                        className={`p-3 rounded-2xl border text-xs font-bold transition-all ${
                                            config.examinerPersona === persona.id
                                                ? 'bg-teal-600 border-teal-500 text-white shadow-lg shadow-teal-500/25'
                                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                                        }`}
                                    >
                                        {persona.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800 flex justify-end">
                        <button
                            onClick={handleStartSession}
                            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 transition-all"
                        >
                            <Play className="w-4 h-4 fill-current" /> Begin AI Viva Voce Examination
                        </button>
                    </div>
                </div>
            )}

            {/* Active Examination Canvas */}
            {(status === 'in_progress' || status === 'evaluating') && (
                <div className="space-y-6">
                    {/* Top Avatar Component */}
                    <ExaminerAvatar
                        config={config}
                        isSpeaking={isSpeaking}
                        isListening={isListening}
                        currentTurnIndex={currentTurnIndex}
                        maxTurns={config.maxTurns}
                        recentTurn={turns[turns.length - 1] || null}
                    />

                    {/* Question Card Display */}
                    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
                        <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
                            <span className="font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                                <MessageSquare className="w-4 h-4" /> Turn #{currentTurnIndex} Question
                            </span>
                            <span className="flex items-center gap-1 font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl">
                                <Clock className="w-3.5 h-3.5" /> {timerSeconds}s Response Time
                            </span>
                        </div>
                        <h2 className="text-lg sm:text-xl font-bold text-slate-100 leading-relaxed">
                            {currentQuestion}
                        </h2>
                    </div>

                    {/* Response Input Canvas */}
                    {status === 'in_progress' && (
                        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Candidate Oral/Text Response</label>
                                <button
                                    onClick={toggleSpeechInput}
                                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                                        isListening
                                            ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse'
                                            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                                    }`}
                                >
                                    {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                                    {isListening ? 'Stop Mic Recording' : 'Activate Voice Speech Input'}
                                </button>
                            </div>

                            <textarea
                                value={studentAnswer}
                                onChange={(e) => setStudentAnswer(e.target.value)}
                                placeholder="Speak into microphone or type your technical answer with explicit derivations, mechanisms, and trade-offs..."
                                rows={4}
                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                            />

                            <div className="flex items-center justify-between pt-2">
                                <span className="text-[11px] text-slate-500">Press Enter or click Submit to answer the Examiner.</span>
                                <button
                                    onClick={handleSubmitAnswer}
                                    disabled={!studentAnswer.trim()}
                                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all"
                                >
                                    <Send className="w-4 h-4" /> Submit Viva Answer
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Evaluating State Loader */}
                    {status === 'evaluating' && (
                        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-2xl">
                            <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin mx-auto" />
                            <h3 className="text-lg font-bold text-slate-100">Aggregating Academic Viva Scorecard...</h3>
                            <p className="text-xs text-slate-400">Evaluating conceptual depth, technical accuracy, and multi-turn response confidence.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Scorecard Modal */}
            {status === 'completed' && scorecard && (
                <VivaScorecardModal
                    scorecard={scorecard}
                    config={config}
                    onRestart={() => setStatus('setup')}
                    onClose={() => setStatus('setup')}
                />
            )}
        </div>
    );
};
