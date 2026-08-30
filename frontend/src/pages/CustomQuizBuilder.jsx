/**
 * @fileoverview Main page for configuring and launching custom AI-generated quizzes.
 */
import React, { useState } from 'react';
import DynamicQuizPlayer from '../components/Quiz/DynamicQuizPlayer';
import axios from 'axios';

const CustomQuizBuilder = () => {
    const [step, setStep] = useState('builder'); // 'builder' | 'quiz' | 'results'
    const [topicsInput, setTopicsInput] = useState('');
    const [questionCount, setQuestionCount] = useState(5);
    const [difficulty, setDifficulty] = useState('medium');
    const [questionType, setQuestionType] = useState('multiple_choice');

    const [quizData, setQuizData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [finalScore, setFinalScore] = useState(null);

    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

    const handleGenerate = async (e) => {
        e.preventDefault();
        const topics = topicsInput.split(',').map(t => t.trim()).filter(t => t);

        if (topics.length === 0) {
            setError('Please enter at least one topic.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await axios.post(`${API_URL}/custom-quizzes/generate`, {
                topics,
                questionCount: Number(questionCount),
                difficulty,
                questionType
            });

            if (response.data.success) {
                setQuizData(response.data.data);
                setStep('quiz');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to generate quiz.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitQuiz = async (answers) => {
        try {
            const response = await axios.post(`${API_URL}/custom-quizzes/submit`, {
                sessionId: quizData.sessionId,
                answers
            });

            if (response.data.success) {
                setFinalScore(response.data.data);
                setStep('results');
            }
        } catch (err) {
            console.error('Failed to submit quiz:', err);
        }
    };

    if (step === 'results' && finalScore) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 flex items-center justify-center">
                <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Quiz Completed!</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">Your performance has been logged and your weak areas have been updated.</p>

                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 mb-8">
                        <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold">Your Score</p>
                        <p className="text-5xl font-extrabold text-blue-600 dark:text-blue-400 mt-2">{finalScore.percentage}%</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{finalScore.score} out of {finalScore.totalQuestions} correct</p>
                    </div>

                    <button
                        onClick={() => { setStep('builder'); setTopicsInput(''); setFinalScore(null); setQuizData(null); }}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
                    >
                        Create Another Quiz
                    </button>
                </div>
            </div>
        );
    }

    if (step === 'quiz' && quizData) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
                <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Custom Quiz: {quizData.metadata.topics.join(', ')}</h1>
                    <button
                        onClick={() => setStep('builder')}
                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white underline"
                    >
                        Cancel Quiz
                    </button>
                </div>
                <DynamicQuizPlayer questions={quizData.questions} onSubmit={handleSubmitQuiz} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Custom Quiz Generator</h1>
                    <p className="text-gray-600 dark:text-gray-400">Test your knowledge with AI-generated questions tailored to your exact needs.</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
                    <form onSubmit={handleGenerate} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Topics (comma separated)</label>
                            <input
                                type="text"
                                value={topicsInput}
                                onChange={(e) => setTopicsInput(e.target.value)}
                                placeholder="e.g., Photosynthesis, Cellular Respiration, Mitosis"
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Questions</label>
                                <select
                                    value={questionCount}
                                    onChange={(e) => setQuestionCount(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    {[5, 10, 15, 20].map(num => (
                                        <option key={num} value={num}>{num} Questions</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Difficulty</label>
                                <select
                                    value={difficulty}
                                    onChange={(e) => setDifficulty(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
                                <select
                                    value={questionType}
                                    onChange={(e) => setQuestionType(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="multiple_choice">Multiple Choice</option>
                                    <option value="short_answer">Short Answer</option>
                                </select>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-lg rounded-xl transition-colors shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Generating Questions...
                                </>
                            ) : 'Generate Quiz'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CustomQuizBuilder;
