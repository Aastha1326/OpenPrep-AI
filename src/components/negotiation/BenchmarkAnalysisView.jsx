import React from 'react';
import { DollarSign, Award, ArrowUpRight, Copy, Check } from 'lucide-react';

export const BenchmarkAnalysisView = ({ analysis }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(analysis.counterOfferEmailScript);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Market Intelligence Analysis</span>
                    <h3 className="text-xl font-black text-slate-100 mt-1">Total Compensation & Negotiation Targets</h3>
                </div>

                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-2xl">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                    <span className="text-xl font-black text-emerald-400 font-mono">
                        ${analysis.totalFirstYearComp.toLocaleString()} / Year 1
                    </span>
                </div>
            </div>

            {/* Percentile & Target Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400 font-bold uppercase">Market Percentile</span>
                    <p className="text-2xl font-black text-indigo-400 font-mono">{analysis.marketPercentile}th Percentile</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400 font-bold uppercase">Counter Target (Base)</span>
                    <p className="text-2xl font-black text-emerald-400 font-mono">${analysis.recommendedCounterBase.toLocaleString()}</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400 font-bold uppercase">Counter Target (Equity)</span>
                    <p className="text-2xl font-black text-amber-400 font-mono">${analysis.recommendedCounterEquity.toLocaleString()}</p>
                </div>
            </div>

            {/* AI Generated Counter-Offer Email */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">AI Generated Counter-Offer Script:</span>
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-indigo-400 flex items-center gap-1.5 hover:text-indigo-300"
                    >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied script!' : 'Copy to Clipboard'}</span>
                    </button>
                </div>

                <textarea
                    readOnly
                    value={analysis.counterOfferEmailScript}
                    rows={8}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-300 leading-relaxed focus:outline-none"
                />
            </div>
        </div>
    );
};
