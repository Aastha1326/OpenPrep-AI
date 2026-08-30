import React, { useState } from 'react';
import { Code, Play, CheckCircle, Terminal, Cpu } from 'lucide-react';
import { MOCK_CODING_PROBLEMS, runCodeExecutionSimulator } from '../../services/codingSandboxEngine';
import { ExecutionResultsView } from '../../components/sandbox/ExecutionResultsView';

export const CodingChallengeArenaHub = () => {
    const [problem] = useState(MOCK_CODING_PROBLEMS[0]);
    const [selectedLanguage, setSelectedLanguage] = useState('javascript');
    const [code, setCode] = useState(MOCK_CODING_PROBLEMS[0].starterCodeJavaScript);
    const [executionResults, setExecutionResults] = useState(null);
    const [isRunning, setIsRunning] = useState(false);

    const handleRunCode = () => {
        setIsRunning(true);
        setTimeout(() => {
            const results = runCodeExecutionSimulator(code);
            setExecutionResults(results);
            setIsRunning(false);
        }, 600);
    };

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6 text-slate-100 font-sans p-4">
            {/* Banner Header */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-2xl">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                    <Code className="w-4 h-4" /> OpenPrep-AI Execution Sandbox
                </div>
                <h1 className="text-2xl font-black text-slate-100">Algorithmic Coding Arena</h1>
                <p className="text-xs text-slate-400">Solve data structure problems with instant test case execution & complexity profiling.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Problem Description Panel */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col justify-between">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                                    {problem.difficulty}
                                </span>
                                <span className="text-xs font-bold text-slate-400">{problem.category}</span>
                            </div>

                            <div className="flex gap-2 text-xs font-mono">
                                <span className="text-amber-400 font-bold">Target Time: {problem.timeComplexityTarget}</span>
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-slate-100">{problem.title}</h3>
                        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
                            {problem.description}
                        </p>

                        {/* Test Cases List */}
                        <div className="space-y-2">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">Sample Test Cases:</span>
                            <div className="space-y-2">
                                {problem.testCases.map((tc) => (
                                    <div key={tc.id} className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1 font-mono text-xs">
                                        <div className="text-slate-400">Input: <span className="text-slate-200">{tc.inputStr}</span></div>
                                        <div className="text-indigo-400">Expected: <span className="text-indigo-300">{tc.expectedOutput}</span></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Live Code Editor & Results Panel */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col justify-between">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                                <button
                                    onClick={() => { setSelectedLanguage('javascript'); setCode(problem.starterCodeJavaScript); }}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                        selectedLanguage === 'javascript' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                                    }`}
                                >
                                    JavaScript
                                </button>
                                <button
                                    onClick={() => { setSelectedLanguage('python'); setCode(problem.starterCodePython); }}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                        selectedLanguage === 'python' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                                    }`}
                                >
                                    Python 3
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={handleRunCode}
                                disabled={isRunning}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                            >
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>{isRunning ? 'Running Test Cases...' : 'Run Code'}</span>
                            </button>
                        </div>

                        {/* Editor Window */}
                        <textarea
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            rows={12}
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-emerald-400 focus:outline-none focus:border-indigo-500 leading-relaxed"
                        />
                    </div>

                    {/* Results Output View */}
                    {executionResults && <ExecutionResultsView results={executionResults} />}
                </div>
            </div>
        </div>
    );
};

export default CodingChallengeArenaHub;
