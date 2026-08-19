import React, { useState } from 'react';
import { Cpu, Mic, Play, Send, Award, Search, CheckCircle2, RotateCcw } from 'lucide-react';
import {
    MOCK_INTERVIEW_QUESTIONS,
    InterviewQuestion,
    CandidateResponseRecord,
    calculateCandidateOverallScore
} from '../../services/aiInterviewSimulationEngine';
import { InterviewQuestionCardTile } from '../../components/interview/InterviewQuestionCardTile';
import { InterviewFeedbackBreakdownCardTile } from '../../components/interview/InterviewFeedbackBreakdownCardTile';

export const AiMockInterviewSimulatorPage: React.FC = () => {
    const [questions] = useState<InterviewQuestion[]>(MOCK_INTERVIEW_QUESTIONS);
    const [selectedQuestion, setSelectedQuestion] = useState<InterviewQuestion>(MOCK_INTERVIEW_QUESTIONS[0]);
    const [userAnswer, setUserAnswer] = useState<string>('');
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [responses, setResponses] = useState<CandidateResponseRecord[]>([]);
    const [roleFilter, setRoleFilter] = useState<string>('All');
    const [difficultyFilter, setDifficultyFilter] = useState<string>('All');

    const filteredQuestions = questions.filter(q => {
        const matchesRole = roleFilter === 'All' || q.roleCategory === roleFilter;
        const matchesDiff = difficultyFilter === 'All' || q.difficulty === difficultyFilter;
        return matchesRole && matchesDiff;
    });

    const handleToggleRecording = () => {
        setIsRecording(!isRecording);
    };

    const handleSubmitAnswer = () => {
        if (!userAnswer.trim()) return;

        const mockRecord: CandidateResponseRecord = {
            id: `resp_${Date.now()}`,
            questionId: selectedQuestion.id,
            questionText: selectedQuestion.questionText,
            userAnswerText: userAnswer.trim(),
            timeTakenSeconds: 85,
            clarityScore: 92,
            technicalDepthScore: 88,
            overallConfidenceScore: 90,
            aiFeedbackSummary: "Excellent technical breakdown of diffing heuristics. You correctly identified O(N) linear time complexity and the role of key props in DOM node preservation.",
            strengths: [
                "Accurate O(N) complexity reference",
                "Clear distinction between element root type comparison and key matching"
            ],
            areasToImprove: [
                "Could briefly mention Fiber architecture reconciliation phase"
            ]
        };

        setResponses(prev => [mockRecord, ...prev]);
        setUserAnswer('');
    };

    const overallAverage = calculateCandidateOverallScore(responses);

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 text-slate-100 font-sans p-4 sm:p-6">
            {/* Header Hub Banner */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                    <div>
                        <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                            <Cpu className="w-4 h-4 text-emerald-400" /> AI Prep Studio
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-100 mt-1">
                            AI Technical Mock Interview Simulator
                        </h1>
                        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                            Practice real-world technical interview questions, record text or audio responses, receive instantaneous AI feedback on clarity and technical depth, and monitor your interview readiness.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                        <Award className="w-6 h-6 text-amber-400" />
                        <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Average Candidate Readiness</span>
                            <span className="text-xl font-black text-amber-400 font-mono">
                                {responses.length > 0 ? `${overallAverage} / 100` : 'No Attempts Yet'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2 text-xs text-slate-300 font-mono focus:outline-none focus:border-indigo-500"
                    >
                        <option value="All">All Role Tracks</option>
                        <option value="Frontend Engineer">Frontend Engineer</option>
                        <option value="Backend Engineer">Backend Engineer</option>
                        <option value="System Design">System Design</option>
                    </select>

                    <select
                        value={difficultyFilter}
                        onChange={(e) => setDifficultyFilter(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2 text-xs text-slate-300 font-mono focus:outline-none focus:border-indigo-500"
                    >
                        <option value="All">All Difficulties</option>
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                    </select>
                </div>
            </div>

            {/* Grid Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Question Bank Selectors */}
                <div className="lg:col-span-4 space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider">
                        Available Questions ({filteredQuestions.length})
                    </h3>
                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                        {filteredQuestions.map(q => (
                            <InterviewQuestionCardTile
                                key={q.id}
                                question={q}
                                isActive={selectedQuestion.id === q.id}
                                onSelectQuestion={setSelectedQuestion}
                            />
                        ))}
                    </div>
                </div>

                {/* Right Column: Live Interview Simulator & AI Feedback */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Active Question Prompt Card */}
                    <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <span className="text-xs font-bold text-indigo-400 font-mono">
                                Active Prompt: {selectedQuestion.roleCategory} ({selectedQuestion.difficulty})
                            </span>
                            <span className="text-xs text-slate-500 font-mono">Simulated Timer: 02:15</span>
                        </div>

                        <h2 className="text-lg font-black text-slate-100 leading-snug">
                            {selectedQuestion.questionText}
                        </h2>

                        {/* Answer Input Box */}
                        <div className="space-y-2">
                            <label className="text-[10px] text-slate-400 font-mono uppercase font-bold block">
                                Your Technical Explanation & Approach
                            </label>
                            <textarea
                                rows={5}
                                value={userAnswer}
                                onChange={(e) => setUserAnswer(e.target.value)}
                                placeholder="Type or dictate your structured explanation here (mention trade-offs, algorithms, or architectural components)..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                            <button
                                type="button"
                                onClick={handleToggleRecording}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                                    isRecording
                                        ? 'bg-rose-500 text-white animate-pulse'
                                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                                }`}
                            >
                                <Mic className="w-4 h-4" /> {isRecording ? 'Recording Live Dictation...' : 'Dictate Answer'}
                            </button>

                            <button
                                type="button"
                                onClick={handleSubmitAnswer}
                                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                            >
                                <Send className="w-4 h-4" /> Submit for AI Analysis
                            </button>
                        </div>
                    </div>

                    {/* AI Feedback Records List */}
                    {responses.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider">
                                Evaluation Results & Feedback Log
                            </h3>
                            {responses.map(resp => (
                                <InterviewFeedbackBreakdownCardTile key={resp.id} record={resp} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AiMockInterviewSimulatorPage;
