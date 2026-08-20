import React, { useState } from 'react';
import { DollarSign, Sparkles, TrendingUp, Calculator } from 'lucide-react';
import { calculateNegotiationBenchmark } from '../../services/negotiationEngine';
import { BenchmarkAnalysisView } from '../../components/negotiation/BenchmarkAnalysisView';

export const OfferNegotiationHub = () => {
    const [baseSalary, setBaseSalary] = useState(150000);
    const [annualBonus, setAnnualBonus] = useState(15000);
    const [equityValueFourYear, setEquityValueFourYear] = useState(120000);
    const [signingBonus, setSigningBonus] = useState(20000);
    const [analysis, setAnalysis] = useState(null);

    const handleCalculateBenchmark = () => {
        const result = calculateNegotiationBenchmark(
            { baseSalary, annualBonus, equityValueFourYear, signingBonus },
            "Tier 1 Tech"
        );
        setAnalysis(result);
    };

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6 text-slate-100 font-sans p-4">
            {/* Header Banner */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-2xl">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                    <TrendingUp className="w-4 h-4" /> OpenPrep-AI Offer Intelligence
                </div>
                <h1 className="text-2xl font-black text-slate-100">Offer Negotiation & Salary Benchmark Assistant</h1>
                <p className="text-xs text-slate-400">Evaluate tech compensation packages and generate data-backed AI counter-offer scripts.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Form Input Panel */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Offer Package Breakdown</span>

                    <div className="space-y-3 text-xs">
                        <div className="space-y-1">
                            <label className="text-slate-400 font-medium block">Base Salary ($/yr)</label>
                            <input
                                type="number"
                                value={baseSalary}
                                onChange={(e) => setBaseSalary(Number(e.target.value))}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-slate-400 font-medium block">Annual Bonus ($/yr)</label>
                            <input
                                type="number"
                                value={annualBonus}
                                onChange={(e) => setAnnualBonus(Number(e.target.value))}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-slate-400 font-medium block">4-Year Equity / RSU Grant ($)</label>
                            <input
                                type="number"
                                value={equityValueFourYear}
                                onChange={(e) => setEquityValueFourYear(Number(e.target.value))}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-slate-400 font-medium block">Signing Bonus ($)</label>
                            <input
                                type="number"
                                value={signingBonus}
                                onChange={(e) => setSigningBonus(Number(e.target.value))}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleCalculateBenchmark}
                        className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 mt-4"
                    >
                        <Sparkles className="w-4 h-4" />
                        <span>Benchmark & Generate Script</span>
                    </button>
                </div>

                {/* Analysis Output View */}
                <div className="md:col-span-2">
                    {analysis ? (
                        <BenchmarkAnalysisView analysis={analysis} />
                    ) : (
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 text-xs font-medium space-y-2">
                            <Calculator className="w-8 h-8 text-indigo-400 mx-auto" />
                            <p>Enter your offer details and click benchmark to generate personalized negotiation scripts.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OfferNegotiationHub;
