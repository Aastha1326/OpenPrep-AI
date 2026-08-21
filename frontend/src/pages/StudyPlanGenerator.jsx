/**
 * @fileoverview Main page for generating and viewing the dynamic study plan.
 */
import React, { useState } from 'react';
import InteractiveCalendar from '../components/StudyPlan/InteractiveCalendar';
import axios from 'axios';

const StudyPlanGenerator = () => {
    const [examDate, setExamDate] = useState('');
    const [topicsInput, setTopicsInput] = useState('');
    const [dailyHours, setDailyHours] = useState(2);
    const [isGenerating, setIsGenerating] = useState(false);
    const [plan, setPlan] = useState(null);
    const [error, setError] = useState('');

    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!examDate || !topicsInput.trim() || !dailyHours) {
            setError('Please fill in all fields.');
            return;
        }

        setIsGenerating(true);
        setError('');
        setPlan(null);

        try {
            const response = await axios.post(`${API_URL}/study-plans`, {
                examDate,
                topics: topicsInput.split(',').map(t => t.trim()).filter(t => t),
                dailyHours: Number(dailyHours),
            });

            if (response.data.success) {
                setPlan(response.data.data);
            } else {
                setError(response.data.message || 'Failed to generate plan.');
            }
        } catch (err) {
            console.error('Generation error:', err);
            setError(err.response?.data?.message || 'Network error. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">AI Study Plan Generator</h1>
                    <p className="text-gray-600 dark:text-gray-400">Tell us your exam details, and we'll build a customized, day-by-day roadmap for you.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
                        {error}
                    </div>
                )}

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
                    <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Exam Date</label>
                            <input
                                type="date"
                                value={examDate}
                                onChange={(e) => setExamDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Daily Study Hours</label>
                            <input
                                type="number"
                                min="1"
                                max="16"
                                value={dailyHours}
                                onChange={(e) => setDailyHours(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Syllabus Topics (comma separated)</label>
                            <textarea
                                value={topicsInput}
                                onChange={(e) => setTopicsInput(e.target.value)}
                                placeholder="e.g., Calculus, Linear Algebra, Probability, Statistics"
                                rows={3}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                required
                            />
                        </div>
                        <div className="md:col-span-3">
                            <button
                                type="submit"
                                disabled={isGenerating}
                                className="w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                {isGenerating ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Generating Plan...
                                    </>
                                ) : 'Generate Study Plan'}
                            </button>
                        </div>
                    </form>
                </div>

                {plan && (
                    <div className="space-y-6">
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">Overall Strategy</h2>
                            <p className="text-blue-800 dark:text-blue-300">{plan.overallStrategy}</p>
                        </div>
                        <InteractiveCalendar schedule={plan.schedule} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudyPlanGenerator;
