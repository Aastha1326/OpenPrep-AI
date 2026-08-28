/**
 * @fileoverview Main page integrating the code editor and test results console for CS practice exams.
 */
import React, { useState } from 'react';
import CodeEditorPane from '../components/codeRunner/CodeEditorPane';
import TestResultsConsole from '../components/codeRunner/TestResultsConsole';
import axios from 'axios';

const CodePracticeExam = () => {
    const [language, setLanguage] = useState('python');
    const [code, setCode] = useState('# Write a function to calculate the sum of numbers up to n\ndef sum_up_to(n):\n    return n * (n + 1) // 2\n\nprint(sum_up_to(int(input())))');
    const [results, setResults] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

    const sampleTestCases = [
        { input: "5\n", expectedOutput: "15" },
        { input: "10\n", expectedOutput: "55" }
    ];

    const handleRun = async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await axios.post(`${API_URL}/code/run-sample`, {
                language,
                code,
                testCases: sampleTestCases
            });
            if (response.data.success) {
                setResults(response.data.data);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Execution failed.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await axios.post(`${API_URL}/code/submit`, {
                language,
                code,
                problemId: 'mock-problem-1'
            });
            if (response.data.success) {
                setResults(response.data.data);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Submission failed.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex flex-col">
            {/* Header */}
            <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 shrink-0">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Practice Exam: Algorithmic Thinking</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Problem 1: Summation Formula</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleRun}
                        disabled={isLoading}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Run Sample
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Submit
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex overflow-hidden">
                {/* Problem Description (Mock) */}
                <div className="w-1/3 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-6 overflow-y-auto">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Problem Statement</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                        Given an integer <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">n</code>, calculate the sum of all integers from 1 to <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">n</code> inclusive.
                    </p>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Constraints</h3>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc pl-5 space-y-1">
                        <li>1 &le; n &le; 10^9</li>
                        <li>Time Limit: 2.0 seconds</li>
                        <li>Memory Limit: 128 MB</li>
                    </ul>
                </div>

                {/* Editor & Console */}
                <div className="flex-1 flex flex-col p-4 gap-4">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                            {error}
                        </div>
                    )}
                    <div className="flex-1 flex flex-col min-h-0">
                        <CodeEditorPane code={code} setCode={setCode} language={language} setLanguage={setLanguage} />
                        <div className="h-1/3 mt-4">
                            <TestResultsConsole results={results} isLoading={isLoading} />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CodePracticeExam;
