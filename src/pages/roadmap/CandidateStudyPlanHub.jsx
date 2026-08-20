import React, { useState } from 'react';
import { Calendar, Target, Award, Sparkles } from 'lucide-react';
import { DEFAULT_PREPARATION_ROADMAP, calculateRoadmapProgress } from '../../services/roadmapEngine';
import { WeekModuleCard } from '../../components/roadmap/WeekModuleCard';

export const CandidateStudyPlanHub = () => {
    const [roadmap, setRoadmap] = useState(DEFAULT_PREPARATION_ROADMAP);

    const handleToggleTask = (weekNumber, taskId) => {
        setRoadmap(prev => prev.map(m => {
            if (m.weekNumber === weekNumber) {
                return {
                    ...m,
                    tasks: m.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
                };
            }
            return m;
        }));
    };

    const stats = calculateRoadmapProgress(roadmap);

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6 text-slate-100 font-sans p-4">
            {/* Header Banner */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                    <div>
                        <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
                            <Calendar className="w-4 h-4" /> OpenPrep-AI Study Architect
                        </div>
                        <h1 className="text-2xl font-black text-slate-100 mt-1">Candidate Preparation Roadmap & Study Plan</h1>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                        <Target className="w-5 h-5 text-indigo-400" />
                        <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Interview Readiness</span>
                            <span className="text-lg font-black text-indigo-400 font-mono">{stats.completionPercentage}% Completed</span>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Overall Goal Milestones</span>
                        <span>{stats.completedTasks} of {stats.totalTasks} Tasks Finished</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <div
                            style={{ width: `${stats.completionPercentage}%` }}
                            className="h-full bg-gradient-to-r from-indigo-500 to-teal-400 transition-all duration-500 rounded-full"
                        />
                    </div>
                </div>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {roadmap.map((module) => (
                    <WeekModuleCard
                        key={module.weekNumber}
                        module={module}
                        onToggleTask={handleToggleTask}
                    />
                ))}
            </div>
        </div>
    );
};

export default CandidateStudyPlanHub;
