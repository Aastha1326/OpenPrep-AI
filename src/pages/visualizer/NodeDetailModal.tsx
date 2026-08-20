import React from 'react';
import { 
    X, 
    BookOpen, 
    Brain, 
    Sparkles, 
    Target, 
    CheckCircle2, 
    Zap, 
    HelpCircle, 
    FileText, 
    Layers,
    ArrowRight
} from 'lucide-react';
import { MindMapNode } from './mindMapEngine';

interface NodeDetailModalProps {
    node: MindMapNode | null;
    onClose: () => void;
    onLaunchQuiz: (nodeId: string) => void;
}

export const NodeDetailModal: React.FC<NodeDetailModalProps> = ({
    node,
    onClose,
    onLaunchQuiz
}) => {
    if (!node) return null;

    const categoryColors = {
        root: "from-indigo-600 to-blue-600 border-indigo-400 text-indigo-200",
        subject: "from-teal-600 to-emerald-600 border-teal-400 text-teal-200",
        subtopic: "from-amber-600 to-orange-600 border-amber-400 text-amber-200",
        concept: "from-purple-600 to-pink-600 border-purple-400 text-purple-200",
        formula: "from-cyan-600 to-blue-600 border-cyan-400 text-cyan-200"
    }[node.category] || "from-slate-700 to-slate-800 border-slate-600 text-slate-200";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
                {/* Background Ambient Glow */}
                <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-indigo-500/10 via-teal-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

                {/* Header Title */}
                <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r ${categoryColors}`}>
                                {node.category} Node
                            </span>
                            <span className="text-xs font-semibold text-slate-400 capitalize">
                                • {node.difficultyLevel} Level
                            </span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-100">{node.label}</h2>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Node Overview Body */}
                <div className="space-y-5 my-5">
                    {/* Description */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                            <FileText className="w-3.5 h-3.5 text-indigo-400" />
                            Concept Summary
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
                            {node.description}
                        </p>
                    </div>

                    {/* Key Formulas Section if available */}
                    {node.keyFormulas && node.keyFormulas.length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                <Zap className="w-3.5 h-3.5 text-amber-400" />
                                Mathematical Derivations & Formulas
                            </h4>
                            <div className="space-y-2">
                                {node.keyFormulas.map((form, idx) => (
                                    <div key={idx} className="bg-slate-950 font-mono text-xs text-amber-300 p-3 rounded-xl border border-amber-500/20 shadow-inner">
                                        {form}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Mastery Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 text-center">
                            <span className="text-[11px] text-slate-400 font-medium block">Concept Mastery</span>
                            <span className="text-xl font-bold text-emerald-400 mt-1 block">{node.masteryPercentage}%</span>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                                <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${node.masteryPercentage}%` }} />
                            </div>
                        </div>

                        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 text-center">
                            <span className="text-[11px] text-slate-400 font-medium block">Linked Flashcards</span>
                            <span className="text-xl font-bold text-indigo-400 mt-1 block">{node.flashcardCount} Cards</span>
                            <span className="text-[10px] text-slate-500 block mt-1">Ready for Spaced Repetition</span>
                        </div>
                    </div>
                </div>

                {/* Footer Modal Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-semibold transition-colors"
                    >
                        Close Preview
                    </button>

                    <button
                        onClick={() => onLaunchQuiz(node.id)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all"
                    >
                        <Brain className="w-4 h-4" /> Launch Quick Quiz on Node <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
};
