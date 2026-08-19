import React from 'react';
import { 
    Calculator, 
    Atom, 
    Zap, 
    Layers, 
    HelpCircle, 
    Plus,
    Code,
    Sparkles
} from 'lucide-react';
import { MATH_TOOLBAR_SNIPPETS, MathSymbolSnippet } from './mathPresets';

interface MathToolbarProps {
    onInsertSnippet: (snippet: string) => void;
}

export const MathToolbar: React.FC<MathToolbarProps> = ({ onInsertSnippet }) => {
    const categories: { id: MathSymbolSnippet['category']; label: string; icon: any }[] = [
        { id: 'calculus', label: 'Calculus', icon: Calculator },
        { id: 'algebra', label: 'Matrices', icon: Layers },
        { id: 'chemistry', label: 'Chemistry', icon: Atom },
        { id: 'physics', label: 'Physics', icon: Zap },
        { id: 'symbols', label: 'Symbols', icon: Code }
    ];

    const [activeCategory, setActiveCategory] = React.useState<MathSymbolSnippet['category']>('calculus');

    const filteredSnippets = MATH_TOOLBAR_SNIPPETS.filter(s => s.category === activeCategory);

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-3 shadow-lg">
            {/* Category Selector Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-800/80">
                {categories.map((cat) => {
                    const IconComponent = cat.icon;
                    return (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => setActiveCategory(cat.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                                activeCategory === cat.id
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                            }`}
                        >
                            <IconComponent className="w-3.5 h-3.5" />
                            {cat.label}
                        </button>
                    );
                })}
            </div>

            {/* Quick-Insert Buttons Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {filteredSnippets.map((item, idx) => (
                    <button
                        key={idx}
                        type="button"
                        onClick={() => onInsertSnippet(item.snippet)}
                        title={item.description}
                        className="group flex flex-col items-start p-2 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900 transition-all text-left"
                    >
                        <div className="flex items-center justify-between w-full">
                            <span className="text-xs font-bold text-slate-200 group-hover:text-indigo-400 truncate">{item.label}</span>
                            <Plus className="w-3 h-3 text-slate-500 group-hover:text-indigo-400" />
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 truncate w-full mt-0.5">{item.snippet}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};
