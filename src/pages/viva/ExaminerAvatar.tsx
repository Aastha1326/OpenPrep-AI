import React from 'react';
import { 
    UserCheck, 
    Bot, 
    Award, 
    Zap, 
    TrendingUp, 
    Sparkles, 
    Activity, 
    Volume2, 
    ShieldCheck,
    Cpu
} from 'lucide-react';
import { VivaSessionConfig, VivaQuestionTurn } from './vivaEngine';

interface ExaminerAvatarProps {
    config: VivaSessionConfig;
    isSpeaking: boolean;
    isListening: boolean;
    currentTurnIndex: number;
    maxTurns: number;
    recentTurn: VivaQuestionTurn | null;
}

export const ExaminerAvatar: React.FC<ExaminerAvatarProps> = ({
    config,
    isSpeaking,
    isListening,
    currentTurnIndex,
    maxTurns,
    recentTurn
}) => {
    const personaDetails = {
        strict_professor: {
            name: "Prof. Vikramaditya Sharma, Ph.D.",
            title: "Senior Chair of Computer Science & Academic Viva Examiner",
            avatarBg: "from-slate-900 via-indigo-950 to-blue-950",
            borderColor: "border-indigo-500/40",
            badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
            trait: "Demands rigorous derivations, precise mathematical terminology, and strict proof."
        },
        supportive_mentor: {
            name: "Dr. Ananya Roy",
            title: "Associate Professor & Research Mentor",
            avatarBg: "from-slate-900 via-teal-950 to-emerald-950",
            borderColor: "border-teal-500/40",
            badgeColor: "bg-teal-500/10 text-teal-400 border-teal-500/30",
            trait: "Guides candidates with constructive follow-up hints and encouraging feedback."
        },
        industry_expert: {
            name: "Rajesh K. Kulkarni",
            title: "Principal Systems Architect & Technical Director",
            avatarBg: "from-slate-900 via-amber-950 to-orange-950",
            borderColor: "border-amber-500/40",
            badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
            trait: "Focuses heavily on production scalability, high availability, and real-world failure modes."
        }
    }[config.examinerPersona] || {
        name: "Prof. Academic Examiner",
        title: "Viva Voce Evaluation Panel Chair",
        avatarBg: "from-slate-900 to-indigo-950",
        borderColor: "border-indigo-500/40",
        badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
        trait: "Conducts standard technical viva voce examination."
    };

    return (
        <div className={`relative bg-slate-900/90 backdrop-blur-xl border ${personaDetails.borderColor} rounded-3xl p-6 shadow-2xl overflow-hidden transition-all duration-300`}>
            {/* Ambient Animated Glow Overlay */}
            <div className={`absolute -top-24 -left-24 w-72 h-72 bg-gradient-to-br ${personaDetails.avatarBg} rounded-full blur-3xl opacity-40 pointer-events-none animate-pulse`} />

            {/* Header Persona Badge */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-inner">
                        <Bot className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">AI Viva Examiner</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${personaDetails.badgeColor}`}>
                                Active Session
                            </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-100 mt-0.5">{personaDetails.name}</h3>
                    </div>
                </div>

                {/* Progress Turn Counter */}
                <div className="flex flex-col items-end">
                    <span className="text-xs font-medium text-slate-400">Viva Examination Progress</span>
                    <div className="flex items-center gap-1.5 mt-1">
                        <div className="flex gap-1">
                            {Array.from({ length: maxTurns }).map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                                        idx < currentTurnIndex
                                            ? 'bg-emerald-400 shadow-lg shadow-emerald-500/50 scale-105'
                                            : idx === currentTurnIndex
                                            ? 'bg-amber-400 animate-ping'
                                            : 'bg-slate-800 border border-slate-700'
                                    }`}
                                />
                            ))}
                        </div>
                        <span className="text-xs font-bold text-slate-300 ml-1">{currentTurnIndex}/{maxTurns} Turns</span>
                    </div>
                </div>
            </div>

            {/* Main Avatar Canvas Area */}
            <div className="flex flex-col md:flex-row items-center gap-6 my-2">
                {/* Visual Avatar Sphere */}
                <div className="relative group">
                    {/* Speech Pulse Rings */}
                    {isSpeaking && (
                        <>
                            <div className="absolute inset-0 rounded-full border-2 border-indigo-400/40 animate-ping" />
                            <div className="absolute -inset-3 rounded-full border border-teal-400/20 animate-pulse" />
                        </>
                    )}

                    {/* Speech Listening Pulse */}
                    {isListening && (
                        <div className="absolute -inset-2 rounded-full border-2 border-emerald-400/50 animate-pulse" />
                    )}

                    {/* Central Avatar Visual Ring */}
                    <div className={`w-28 h-28 rounded-full bg-gradient-to-tr ${personaDetails.avatarBg} border-2 ${personaDetails.borderColor} p-1 shadow-2xl flex items-center justify-center relative overflow-hidden`}>
                        <div className="w-full h-full rounded-full bg-slate-950/80 flex items-center justify-center relative">
                            {isSpeaking ? (
                                <div className="flex items-center gap-1">
                                    <div className="w-1.5 h-6 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-1.5 h-9 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-1.5 h-11 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    <div className="w-1.5 h-7 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '450ms' }} />
                                </div>
                            ) : isListening ? (
                                <div className="flex flex-col items-center">
                                    <Volume2 className="w-8 h-8 text-emerald-400 animate-pulse" />
                                    <span className="text-[10px] font-bold text-emerald-300 mt-1 uppercase tracking-tighter">Listening</span>
                                </div>
                            ) : (
                                <Cpu className="w-10 h-10 text-indigo-400/80 group-hover:scale-110 transition-transform duration-300" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Examiner Description & Real-time Evaluation Badge */}
                <div className="flex-1 space-y-3 text-center md:text-left">
                    <p className="text-xs text-slate-400 italic">
                        "{personaDetails.trait}"
                    </p>

                    {/* Live Telemetry Metric Badges */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5">
                            <span className="text-[10px] text-slate-500 font-medium block">Subject Target</span>
                            <span className="text-xs font-bold text-slate-200 truncate block mt-0.5">{config.subject}</span>
                        </div>
                        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5">
                            <span className="text-[10px] text-slate-500 font-medium block">Academic Level</span>
                            <span className="text-xs font-bold text-indigo-300 capitalize block mt-0.5">{config.academicLevel}</span>
                        </div>
                        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 col-span-2 sm:col-span-1">
                            <span className="text-[10px] text-slate-500 font-medium block">Recent Turn Score</span>
                            <span className="text-xs font-bold text-emerald-400 block mt-0.5">
                                {recentTurn ? `${recentTurn.conceptualScore}/100 pts` : 'Awaiting Input'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
