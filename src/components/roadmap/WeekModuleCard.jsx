import React from 'react';
import { Calendar, CheckCircle2, Circle, Clock } from 'lucide-react';

export const WeekModuleCard = ({ module, onToggleTask }) => {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 font-bold font-mono text-xs flex items-center justify-center">
                        W{module.weekNumber}
                    </span>
                    <h4 className="text-sm font-bold text-slate-100">{module.themeTitle}</h4>
                </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">{module.description}</p>

            <div className="space-y-2">
                {module.tasks.map((task) => (
                    <div
                        key={task.id}
                        onClick={() => onToggleTask(module.weekNumber, task.id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            task.completed
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-slate-300'
                                : 'bg-slate-950 border-slate-800/80 text-slate-200 hover:border-slate-700'
                        }`}
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            {task.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            ) : (
                                <Circle className="w-4 h-4 text-slate-600 flex-shrink-0" />
                            )}
                            <span className={`text-xs font-medium truncate ${task.completed ? 'line-through text-slate-400' : ''}`}>
                                {task.title}
                            </span>
                        </div>

                        <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1 flex-shrink-0">
                            <Clock className="w-3 h-3 text-slate-600" /> {task.estimatedMinutes}m
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
