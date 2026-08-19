import React, { useState } from 'react';
import { 
    Edit3, 
    Eye, 
    Columns, 
    Sparkles, 
    Copy, 
    Check, 
    RotateCcw, 
    FileText, 
    BookOpen, 
    Download,
    Calculator
} from 'lucide-react';
import { MathToolbar } from './MathToolbar';
import { MathRenderer } from './MathRenderer';
import { SAMPLE_MATH_DOCUMENTS } from './mathPresets';

export const MathMarkdownEditor: React.FC = () => {
    const [markdownText, setMarkdownText] = useState<string>(SAMPLE_MATH_DOCUMENTS.calculus);
    const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');
    const [copied, setCopied] = useState<boolean>(false);

    // Insert LaTeX snippet at current cursor or append
    const handleInsertSnippet = (snippet: string) => {
        setMarkdownText(prev => `${prev}\n$${snippet}$`);
    };

    const handleCopyMarkdown = () => {
        navigator.clipboard.writeText(markdownText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6">
            {/* Header Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-xl">
                <div>
                    <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
                        <Calculator className="w-4 h-4" />
                        KaTeX & mhchem Live Markdown Editor
                    </div>
                    <h1 className="text-2xl font-black text-slate-100 mt-1">LaTeX Math & Chemistry Studio</h1>
                    <p className="text-xs text-slate-400">Real-time side-by-side LaTeX formula rendering for STEM flashcards, quizzes, and notes.</p>
                </div>

                {/* View Mode Toggle Buttons */}
                <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                    <button
                        type="button"
                        onClick={() => setViewMode('split')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            viewMode === 'split' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <Columns className="w-3.5 h-3.5" /> Split Pane
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('edit')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            viewMode === 'edit' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <Edit3 className="w-3.5 h-3.5" /> Write Only
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('preview')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            viewMode === 'preview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <Eye className="w-3.5 h-3.5" /> Preview Only
                    </button>
                </div>
            </div>

            {/* Template Presets Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Sample Templates:</span>
                    <button
                        onClick={() => setMarkdownText(SAMPLE_MATH_DOCUMENTS.calculus)}
                        className="px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium hover:bg-indigo-500/20 transition-colors"
                    >
                        Calculus & Limits
                    </button>
                    <button
                        onClick={() => setMarkdownText(SAMPLE_MATH_DOCUMENTS.chemistry)}
                        className="px-3 py-1 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-medium hover:bg-teal-500/20 transition-colors"
                    >
                        Chemistry Reactions
                    </button>
                    <button
                        onClick={() => setMarkdownText(SAMPLE_MATH_DOCUMENTS.quantum)}
                        className="px-3 py-1 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium hover:bg-purple-500/20 transition-colors"
                    >
                        Quantum Mechanics
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleCopyMarkdown}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors"
                    >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Copied LaTeX' : 'Copy Code'}
                    </button>
                </div>
            </div>

            {/* Quick Math Toolbar */}
            <MathToolbar onInsertSnippet={handleInsertSnippet} />

            {/* Editor & Preview Split Container */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Write Pane */}
                {(viewMode === 'split' || viewMode === 'edit') && (
                    <div className={`bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-2xl ${
                        viewMode === 'edit' ? 'md:col-span-2' : ''
                    }`}>
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs text-slate-400">
                            <span className="font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                                <Edit3 className="w-4 h-4" /> Raw LaTeX Markdown Input
                            </span>
                            <span className="font-mono text-slate-500">{markdownText.length} Characters</span>
                        </div>

                        <textarea
                            value={markdownText}
                            onChange={(e) => setMarkdownText(e.target.value)}
                            placeholder="Type LaTeX math expressions using $E = mc^2$ or block math $$\int f(x) dx$$..."
                            rows={14}
                            className="w-full bg-slate-950 font-mono text-xs sm:text-sm text-slate-200 border border-slate-800/80 rounded-2xl p-4 focus:outline-none focus:border-indigo-500 transition-colors leading-relaxed"
                        />
                    </div>
                )}

                {/* Preview Pane */}
                {(viewMode === 'split' || viewMode === 'preview') && (
                    <div className={`bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-2xl min-h-[380px] ${
                        viewMode === 'preview' ? 'md:col-span-2' : ''
                    }`}>
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs text-slate-400">
                            <span className="font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                                <Eye className="w-4 h-4" /> Real-time Rendered Output
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                Live Output Ready
                            </span>
                        </div>

                        <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-6 min-h-[300px] overflow-y-auto">
                            <MathRenderer content={markdownText} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
