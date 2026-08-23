import React, { useState } from 'react';
import ResumeUploadDropper from '../components/resume/ResumeUploadDropper';
import ATSScoreRadar from '../components/resume/ATSScoreRadar';
import { LayoutDashboard, Settings2, RefreshCcw } from 'lucide-react';

const ATSHeatmapTerminal = () => {
    const [targetRole, setTargetRole] = useState('Software Engineer');
    const [isProcessing, setIsProcessing] = useState(false);
    const [parseData, setParseData] = useState(null);

    const handleUploadComplete = (fileName, extractedText) => {
        setIsProcessing(true);
        setParseData(null);

        // Simulate sending to backend /api/resume/:id/process
        setTimeout(() => {

            // Dummy Payload from AST Backend
            const dummyPayload = {
                overallAtsScore: Math.floor(Math.random() * (85 - 50 + 1) + 40),
                keywordMatchRate: 68.5,
                formattingPenalty: 15,
                extractedNodes: {
                    experienceCount: 3,
                    educationFound: true,
                    hardSkills: ['React', 'Node.js', 'TypeScript', 'SQL']
                },
                missingKeywords: ['AWS', 'Docker', 'GraphQL']
            };

            setParseData(dummyPayload);
            setIsProcessing(false);

        }, 1500);
    };

    const handleReset = () => {
        setParseData(null);
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30 font-sans p-6 md:p-12 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                            Enterprise ATS Heatmap
                        </h1>
                        <p className="text-gray-400 mt-2 font-medium">Bypass automated rejections with precision AST insights.</p>
                    </div>

                    <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
                        <Settings2 className="w-5 h-5 text-gray-400" />
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Target Role Context</span>
                            <input
                                type="text"
                                value={targetRole}
                                onChange={(e) => setTargetRole(e.target.value)}
                                className="bg-transparent border-none text-white text-sm font-semibold outline-none w-48 focus:text-indigo-400 transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {/* Dashboard Grid */}
                {!parseData && !isProcessing ? (
                    <div className="max-w-3xl mx-auto mt-20">
                        <ResumeUploadDropper onUploadComplete={handleUploadComplete} />

                        <div className="text-center mt-8">
                            <p className="text-gray-500 text-sm">Valid formats: <strong className="text-gray-400">PDF, DOCX</strong></p>
                            <p className="text-gray-500 text-sm mt-1">Processed securely in memory. Zero data retention policy applied.</p>
                        </div>
                    </div>
                ) : isProcessing ? (
                    <div className="h-[50vh] flex flex-col items-center justify-center">
                        <div className="w-16 h-16 border-4 border-white/10 border-t-indigo-500 rounded-full animate-spin mb-6" />
                        <h3 className="text-2xl font-bold text-white mb-2">Simulating Applicant Tracking System...</h3>
                        <p className="text-indigo-400 animate-pulse font-mono text-sm">Evaluating keyword density and structure layout</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

                        <ATSScoreRadar parseData={parseData} />

                        {/* Recommendation Engine (Demo block to add bulk constraints) */}
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative group overflow-hidden">
                            <div className="absolute left-0 top-0 w-2 h-full bg-gradient-to-b from-indigo-500 to-purple-500 rounded-l-3xl" />
                            <div className="pl-6 flex justify-between items-center">
                                <div>
                                    <h4 className="text-lg font-bold text-white mb-1">Tailored Action Plan</h4>
                                    <p className="text-sm text-gray-400">Steps to increase ATS score to 90+</p>
                                </div>
                                <button
                                    onClick={handleReset}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg transition-transform active:scale-95 text-sm font-bold"
                                >
                                    <RefreshCcw className="w-4 h-4" /> Scan Another Resume
                                </button>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
};

export default ATSHeatmapTerminal;
