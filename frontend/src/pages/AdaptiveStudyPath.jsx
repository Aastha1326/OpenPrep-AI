/**
 * @fileoverview Main page for generating and interacting with the adaptive study path.
 */
import React, { useState } from 'react';
import AdaptivePathVisualizer from '../components/Paths/AdaptivePathVisualizer';
import axios from 'axios';

const AdaptiveStudyPath = () => {
    const [subject, setSubject] = useState('');
    const [weakTopics, setWeakTopics] = useState('');
    const [completedTopics, setCompletedTopics] = useState('');
    const [daysUntilExam, setDaysUntilExam] = useState(14);

    const [isGenerating, setIsGenerating] = useState(false);
    const [pathData, setPathData] = useState(null);
    const [error, setError] = useState('');

    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!subject.trim() || !daysUntilExam) {
            setError('Subject and days until exam are required.');
            return;
        }

        setIsGenerating(true);
        setError('');
        setPathData(null);

        try {
            const response = await axios.post(`${API_URL}/adaptive-paths`, {
                subject: subject.trim(),
                weakTopics: weakTopics.split(',').map(t => t.trim()).filter(t => t),
                completedTopics: completedTopics.split(',').map(t => t.trim()).filter(t => t),
                daysUntilExam: Number(daysUntilExam),
            });

            if (response.data.success) {
                setPathData(response.data.data);
            } else {
                setError(response.data.message || 'Failed to generate study path.');
            }
        } catch (err) {
            console.error('Generation error:', err);
            setError(err.response?.data?.message || 'Network error. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleNodeComplete = async (nodeId, score) => {
        try {
            const response = await axios.put(`${API_URL}/adaptive-paths/mock-path-id/update`, {
                completedNodeId: nodeId,
                score: score,
            });

            if (response.data.success) {
                setPathData(response.data.data);
            }
        } catch (err) {
            console.error('Update error:', err);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Adaptive Study Path</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        AI-powered learning trajectory that adjusts to your strengths and weaknesses.
                    </p>
                </div>

                {!pathData ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
                        <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="e.g., Calculus, Organic Chemistry"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Weak Topics (comma separated)</label>
                                <input
                                    type="text"
                                    value={weakTopics}
                                    onChange={(e) => setWeakTopics(e.target.value)}
                                    placeholder="e.g., Limits, Derivatives"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mastered Topics (comma separated)</label>
                                <input
                                    type="text"
                                    value={completedTopics}
                                    onChange={(e) => setCompletedTopics(e.target.value)}
                                    placeholder="e.g., Algebra, Functions"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Days Until Exam</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={daysUntilExam}
                                    onChange={(e) => setDaysUntilExam(e.target.value)}
                                    className="w-full md:w-1/3 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>

                            {error && (
                                <div className="md:col-span-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
                                    {error}
                                </div>
                            )}

                            <div className="md:col-span-2">
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
                                            Generating Path...
                                        </>
                                    ) : 'Generate My Study Path'}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <button
                            onClick={() => setPathData(null)}
                            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Create New Path
                        </button>
                        <AdaptivePathVisualizer pathData={pathData} onNodeComplete={handleNodeComplete} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdaptiveStudyPath;
