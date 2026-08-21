import React, { useState } from 'react';
import { Atom, Sparkles, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { balanceChemicalEquation } from './periodicData';

export const ReactionBalancer: React.FC = () => {
    const [equationInput, setEquationInput] = useState<string>('Fe + O2 -> Fe2O3');
    const [result, setResult] = useState<{ balanced: string; success: boolean; message: string } | null>(null);

    const handleBalance = () => {
        if (!equationInput.trim()) return;
        const res = balanceChemicalEquation(equationInput);
        setResult(res);
    };

    return (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                        <Atom className="w-4 h-4 text-teal-400" />
                        Chemical Reaction Equation Balancer
                    </h3>
                    <p className="text-xs text-slate-400">Enter unbalanced reaction formula (e.g. CH4 + O2 -&gt; CO2 + H2O)</p>
                </div>

                <span className="px-2.5 py-1 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 text-[11px] font-bold">
                    Linear Algebra Matrix Solver
                </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
                <input
                    type="text"
                    value={equationInput}
                    onChange={(e) => setEquationInput(e.target.value)}
                    placeholder="Enter equation (Reactants -> Products)..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                />
                <button
                    onClick={handleBalance}
                    className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-500/20 transition-all"
                >
                    <Sparkles className="w-3.5 h-3.5" /> Balance Reaction
                </button>
            </div>

            {result && (
                <div className={`p-4 rounded-2xl border text-xs ${
                    result.success
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}>
                    <div className="flex items-center justify-between font-mono font-bold text-sm">
                        <span>{result.balanced}</span>
                        {result.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                    </div>
                    <p className="text-[11px] opacity-80 mt-1">{result.message}</p>
                </div>
            )}
        </div>
    );
};
