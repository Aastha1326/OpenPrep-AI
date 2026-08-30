/**
 * @fileoverview Interactive calendar component to visualize and adjust the study plan.
 * Supports dark and light modes via Tailwind CSS.
 */
import React, { useState } from 'react';

const InteractiveCalendar = ({ schedule }) => {
    const [selectedDay, setSelectedDay] = useState(null);

    if (!schedule || schedule.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                No study plan generated yet. Create one to see your calendar.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {schedule.map((day, index) => (
                    <div
                        key={index}
                        onClick={() => setSelectedDay(selectedDay === index ? null : index)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${selectedDay === index
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-700'
                            }`}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <h3 className="font-bold text-gray-900 dark:text-white">
                                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </h3>
                            <span className="px-2 py-1 text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full">
                                {day.estimatedHours} hrs
                            </span>
                        </div>

                        <div className="space-y-2">
                            <div className="flex flex-wrap gap-1">
                                {day.topics.slice(0, 3).map((topic, i) => (
                                    <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                                        {topic}
                                    </span>
                                ))}
                                {day.topics.length > 3 && (
                                    <span className="text-xs px-2 py-0.5 text-gray-500 dark:text-gray-400">+{day.topics.length - 3}</span>
                                )}
                            </div>

                            <p className="text-xs text-gray-500 dark:text-gray-400 italic border-t border-gray-100 dark:border-gray-700 pt-2 mt-2">
                                {day.notes}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {selectedDay !== null && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                Edit Plan: {new Date(schedule[selectedDay].date).toLocaleDateString()}
                            </h3>
                            <button
                                onClick={() => setSelectedDay(null)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Topics (comma separated)</label>
                                <input
                                    type="text"
                                    defaultValue={schedule[selectedDay].topics.join(', ')}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estimated Hours</label>
                                <input
                                    type="number"
                                    defaultValue={schedule[selectedDay].estimatedHours}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setSelectedDay(null)}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => setSelectedDay(null)}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InteractiveCalendar;
