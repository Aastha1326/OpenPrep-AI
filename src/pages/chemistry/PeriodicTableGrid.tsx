import React, { useState } from 'react';
import { Atom, Search, Filter, Layers, Download, Sparkles } from 'lucide-react';
import { ElementData, PERIODIC_ELEMENTS_DATA } from './periodicData';
import { ElementDetailModal } from './ElementDetailModal';
import { ReactionBalancer } from './ReactionBalancer';

export const PeriodicTableGrid: React.FC = () => {
    const [selectedElement, setSelectedElement] = useState<ElementData | null>(null);
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');

    const categoryColors: Record<string, string> = {
        alkali: "bg-rose-950/80 border-rose-500/50 text-rose-200 hover:bg-rose-900",
        alkaline: "bg-amber-950/80 border-amber-500/50 text-amber-200 hover:bg-amber-900",
        transition: "bg-blue-950/80 border-blue-500/50 text-blue-200 hover:bg-blue-900",
        "post-transition": "bg-teal-950/80 border-teal-500/50 text-teal-200 hover:bg-teal-900",
        metalloid: "bg-cyan-950/80 border-cyan-500/50 text-cyan-200 hover:bg-cyan-900",
        nonmetal: "bg-purple-950/80 border-purple-500/50 text-purple-200 hover:bg-purple-900",
        halogen: "bg-violet-950/80 border-violet-500/50 text-violet-200 hover:bg-violet-900",
        noble: "bg-emerald-950/80 border-emerald-500/50 text-emerald-200 hover:bg-emerald-900"
    };

    const filteredElements = PERIODIC_ELEMENTS_DATA.filter(el => {
        const matchesCat = activeCategory === 'all' || el.category === activeCategory;
        const matchesQuery = el.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             el.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             el.number.toString().includes(searchQuery);
        return matchesCat && matchesQuery;
    });

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl">
                <div>
                    <div className="flex items-center gap-2 text-teal-400 font-semibold text-xs uppercase tracking-wider">
                        <Atom className="w-4 h-4" />
                        Chemistry & STEM Study Suite
                    </div>
                    <h1 className="text-2xl font-black text-slate-100 mt-1">Interactive Periodic Table Visualizer</h1>
                    <p className="text-xs text-slate-400">Explore chemical element properties, electron configurations, and stoichiometry balancing.</p>
                </div>

                <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search Element (e.g. Iron, Fe, 26)..."
                        className="bg-slate-950 border border-slate-800 rounded-2xl pl-9 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500 w-64"
                    />
                </div>
            </div>

            {/* Chemical Reaction Balancer Component */}
            <ReactionBalancer />

            {/* Category Filter Badges */}
            <div className="flex flex-wrap items-center gap-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Filter Group:</span>
                {['all', 'alkali', 'alkaline', 'transition', 'metalloid', 'nonmetal', 'halogen', 'noble'].map((cat) => (
                    <button
                        key={cat}
                        type="button"
                        onClick={() => setActiveCategory(cat)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all ${
                            activeCategory === cat
                                ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20'
                                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Elements Interactive Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {filteredElements.map((element) => {
                    const styleClass = categoryColors[element.category] || "bg-slate-900 border-slate-800 text-slate-200";
                    return (
                        <div
                            key={element.number}
                            onClick={() => setSelectedElement(element)}
                            className={`cursor-pointer p-3.5 rounded-2xl border transition-all duration-200 hover:scale-105 shadow-lg ${styleClass}`}
                        >
                            <div className="flex items-center justify-between text-[10px] font-mono font-bold opacity-75">
                                <span>#{element.number}</span>
                                <span>{element.atomicMass}</span>
                            </div>

                            <div className="my-2 text-center">
                                <span className="text-2xl font-black block">{element.symbol}</span>
                                <span className="text-xs font-bold truncate block">{element.name}</span>
                            </div>

                            <span className="text-[9px] font-mono block text-center opacity-70 truncate">
                                {element.electronConfiguration}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Element Detail Modal */}
            <ElementDetailModal
                element={selectedElement}
                onClose={() => setSelectedElement(null)}
            />
        </div>
    );
};
