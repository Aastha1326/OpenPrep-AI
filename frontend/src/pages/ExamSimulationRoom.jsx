/**
 * @fileoverview Distraction-free exam environment with time-tracking and proctoring.
 */
import React, { useState, useEffect, useRef } from 'react';
import ProctoringOverlay from '../components/exam/ProctoringOverlay';
import axios from 'axios';

const ExamSimulationRoom = () => {
    const [isExamStarted, setIsExamStarted] = useState(false);
    const [sessionId, setSessionId] = useState('');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
    const [focusLossCount, setFocusLossCount] = useState(0);
    const [questionLogs, setQuestionLogs] = useState([]);
    const [questionStartTime, setQuestionStartTime] = useState(Date.now());
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [analytics, setAnalytics] = useState(null);

    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

    // Mock questions
    const questions = [
        { id: 'q1', text: 'What is the time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n^2)', 'O(1)'], correct: 'O(log n)' },
        { id: 'q2', text: 'Which data structure uses LIFO?', options: ['Queue', 'Stack', 'Array', 'Tree'], correct: 'Stack' }
    ];

    useEffect(() => {
        if (!isExamStarted || isSubmitted) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isExamStarted, isSubmitted]);

    const handleStartExam = async () => {
        try {
            const response = await axios.post(`${API_URL}/exam-simulation/start`, { examId: 'mock_exam_1' });
            if (response.data.success) {
                setSessionId(response.data.data.sessionId);
                setIsExamStarted(true);
                // Request fullscreen
                if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen().catch(err => console.log('Fullscreen denied:', err));
                }
            }
        } catch (error) {
            console.error('Failed to start exam:', error);
        }
    };

    const handleFocusLoss = () => {
        setFocusLossCount(prev => prev + 1);
    };

    const handleNextQuestion = () => {
        const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
        const currentQ = questions[currentQuestionIndex];

        setQuestionLogs(prev => [...prev, {
            questionId: currentQ.id,
            timeSpentSeconds: timeSpent,
            isCorrect: selectedAnswer === currentQ.correct
        }]);

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedAnswer(null);
            setQuestionStartTime(Date.now());
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        setIsSubmitted(true);
        if (document.exitFullscreen) {
            document.exitFullscreen().catch(err => console.log('Exit fullscreen error:', err));
        }

        const totalTime = 600 - timeLeft;
        try {
            const response = await axios.post(`${API_URL}/exam-simulation/submit`, {
                sessionId,
                questionLogs,
                totalFocusLossEvents: focusLossCount,
                totalExamDurationSeconds: totalTime
            });
            if (response.data.success) {
                setAnalytics(response.data.data.analytics);
            }
        } catch (error) {
            console.error('Failed to submit exam:', error);
        }
    };

    if (!isExamStarted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 max-w-md w-full text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Exam Simulation</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        This is a proctored simulation. Tab switching or window blurring will be logged and reduce your integrity score.
                    </p>
                    <button
                        onClick={handleStartExam}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
                    >
                        Start Exam in Fullscreen
                    </button>
                </div>
            </div>
        );
    }

    if (isSubmitted && analytics) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
                <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">Exam Analytics Report</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center">
                            <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold">Accuracy</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.overallAccuracy}%</p>
                        </div>
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
                            <p className="text-sm text-green-600 dark:text-green-400 font-semibold">Integrity Score</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.integrityScore}/100</p>
                        </div>
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-center">
                            <p className="text-sm text-purple-600 dark:text-purple-400 font-semibold">Avg Time/Q</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.avgTimePerQuestion}s</p>
                        </div>
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-center">
                            <p className="text-sm text-red-600 dark:text-red-400 font-semibold">Focus Losses</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.focusLossEvents}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-3 bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 text-white font-semibold rounded-xl transition-colors"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const currentQ = questions[currentQuestionIndex];
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
            <ProctoringOverlay onFocusLoss={handleFocusLoss} />

            {/* Minimal Header */}
            <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 shrink-0">
                <span className="font-semibold text-gray-700 dark:text-gray-300">Question {currentQuestionIndex + 1} of {questions.length}</span>
                <div className={`text-xl font-mono font-bold ${timeLeft < 60 ? 'text-red-600 animate-pulse' : 'text-gray-900 dark:text-white'}`}>
                    {minutes}:{seconds.toString().padStart(2, '0')}
                </div>
            </header>

            {/* Question Area */}
            <main className="flex-1 flex items-center justify-center p-6">
                <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">{currentQ.text}</h3>
                    <div className="space-y-3">
                        {currentQ.options.map((option) => (
                            <label
                                key={option}
                                className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedAnswer === option
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="answer"
                                    value={option}
                                    checked={selectedAnswer === option}
                                    onChange={() => setSelectedAnswer(option)}
                                    className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                                />
                                <span className="ml-3 text-gray-800 dark:text-gray-200">{option}</span>
                            </label>
                        ))}
                    </div>
                    <button
                        onClick={handleNextQuestion}
                        disabled={!selectedAnswer}
                        className="w-full mt-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 dark:disabled:bg-blue-900 text-white font-semibold rounded-xl transition-colors"
                    >
                        {currentQuestionIndex === questions.length - 1 ? 'Submit Exam' : 'Next Question'}
                    </button>
                </div>
            </main>
        </div>
    );
};

export default ExamSimulationRoom;
