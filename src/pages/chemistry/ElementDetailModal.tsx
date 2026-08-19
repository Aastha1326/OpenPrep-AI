import React from 'react';
import { X, Atom, Zap, Layers, Sparkles, BookOpen, User, Database } from 'lucide-react';
import { ElementData } from './periodicData';

interface ElementDetailModalProps {
    element: ElementData | null;
    onClose: () => void;
}

export const ElementDetailModal: React.FC<ElementDetailModalProps> = ({ element, onClose }) => {
    if (!element) return null;

    const categoryBadgeColors = {
        alkali: "from-rose-600 to-red-600 text-rose-200 border-rose-400",
        alkaline: "from-amber-600 to-yellow-600 text-amber-200 border-amber-400",
        transition: "from-blue-600 to-indigo-600 text-blue-200 border-blue-400",
        "post-transition": "from-teal-600 to-emerald-600 text-teal-200 border-teal-400",
        metalloid: "from-cyan-600 to-sky-600 text-cyan-200 border-cyan-400",
        nonmetal: "from-purple-600 to-pink-600 text-purple-200 border-purple-400",
        halogen: "from-violet-600 to-purple-600 text-violet-200 border-violet-400",
        noble: "from-emerald-600 to-teal-600 text-emerald-200 border-emerald-400",
        lanthanide: "from-indigo-600 to-purple-600 text-indigo-200 border-indigo-400",
        actinide: "from-pink-600 to-rose-600 text-pink-200 border-pink-400"
    }[element.category] || "from-slate-700 to-slate-800 text-slate-200 border-slate-600";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
                {/* Background Ambient Glow */}
                <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-indigo-500/10 via-teal-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

                {/* Header Title */}
                <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${categoryBadgeColors} border flex flex-col items-center justify-center shadow-lg`}>
                            <span className="text-xs font-mono font-bold opacity-80">{element.number}</span>
                            <span className="text-2xl font-black">{element.symbol}</span>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r ${categoryBadgeColors}`}>
                                    {element.category}
                                </span>
                                <span className="text-xs text-slate-400 uppercase font-semibold">
                                    Phase: {element.phase}
                                </span>
                            </div>
                            <h2 className="text-2xl font-black text-slate-100">{element.name}</h2>
                            <p className="text-xs text-slate-400 font-mono">Atomic Mass: {element.atomicMass} u</p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Property Grid Details */}
                <div className="grid grid-cols-2 gap-4 my-5">
                    <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                        <span className="text-[11px] text-slate-400 font-medium block">Electron Configuration</span>
                        <span className="text-sm font-mono font-bold text-indigo-300 mt-1 block">{element.electronConfiguration}</span>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                        <span className="text-[11px] text-slate-400 font-medium block">Electronegativity (Pauling)</span>
                        <span className="text-sm font-mono font-bold text-teal-300 mt-1 block">
                            {element.electronegativity > 0 ? element.electronegativity : 'N/A (Inert)'}
                        </span>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                        <span className="text-[11px] text-slate-400 font-medium block">Period & Group</span>
                        <span className="text-sm font-bold text-slate-200 mt-1 block">Period {element.period}, Group {element.group}</span>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                        <span className="text-[11px] text-slate-400 font-medium block">Discovered By</span>
                        <span className="text-sm font-bold text-amber-300 truncate mt-1 block">{element.discoveredBy}</span>
                    </div>
                </div>

                {/* Summary Description */}
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 mb-5">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                        Chemical & Physical Overview
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{element.summary}</p>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end pt-4 border-t border-slate-800">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
                    >
                        Close Window
                    </button>
                </div>
            </div>
        </div>
    );
};
