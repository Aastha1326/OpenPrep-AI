import React from 'react';
import { HelpCircle, Tag, Cpu, Clock, CheckCircle } from 'lucide-react';
import { InterviewQuestion } from '../../services/aiInterviewSimulationEngine';

interface QuestionCardProps {
    question: InterviewQuestion;
    onSelectQuestion: (question: InterviewQuestion) => void;
    isActive: boolean;
}

export const InterviewQuestionCardTile: React.FC<QuestionCardProps> = ({ question, onSelectQuestion, isActive }) => {
    return (
        <div className={`p-5 rounded-3xl border transition-all cursor-pointer space-y-3 shadow-lg ${
            isActive
                ? 'bg-slate-900 border-indigo-500 shadow-indigo-500/10'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
        }`} onClick={() => onSelectQuestion(question)}>
            <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] font-mono font-bold">
                    {question.roleCategory}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                    question.difficulty === 'Easy' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                    question.difficulty === 'Medium' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                    'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}>
                    {question.difficulty}
                </span>
            </div>

            <h3 className="text-sm font-bold text-slate-100 leading-snug line-clamp-2">
                {question.questionText}
            </h3>

            <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-mono uppercase font-bold flex items-center gap-1">
                    <Tag className="w-3 h-3 text-indigo-400" /> Target Key Concepts
                </span>
                <div className="flex flex-wrap gap-1">
                    {question.keyConcepts.map((concept, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[9px] text-slate-400 font-mono">
                            {concept}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};
