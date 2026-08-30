import React from 'react';
import { CheckCircle2, Clock, HardDrive, Cpu, Terminal } from 'lucide-react';

export const ExecutionResultsView = ({ results }) => {
    return (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-black text-emerald-400 font-mono">STATUS: {results.status}</span>
                </div>

                <span className="text-[11px] text-slate-400 font-mono">
                    {results.testsPassedCount}/{results.testsTotalCount} Test Cases Passed
                </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800/80 space-y-0.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1">
                        <Clock className="w-3 h-3 text-indigo-400" /> Runtime
                    </span>
                    <p className="font-mono font-bold text-indigo-300">{results.runtimeMs} ms</p>
                </div>

                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800/80 space-y-0.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1">
                        <HardDrive className="w-3 h-3 text-teal-400" /> Memory
                    </span>
                    <p className="font-mono font-bold text-teal-300">{results.memoryUsageMb} MB</p>
                </div>

                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800/80 space-y-0.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1">
                        <Cpu className="w-3 h-3 text-amber-400" /> Time Complexity
                    </span>
                    <p className="font-mono font-bold text-amber-300">{results.timeComplexityResult}</p>
                </div>

                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800/80 space-y-0.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1">
                        <Terminal className="w-3 h-3 text-rose-400" /> Space Complexity
                    </span>
                    <p className="font-mono font-bold text-rose-300">{results.spaceComplexityResult}</p>
                </div>
            </div>
        </div>
    );
};
