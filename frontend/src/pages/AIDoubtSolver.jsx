/**
 * @fileoverview Main page for the Multi-Modal AI Doubt Solver.
 * Integrates image upload, text context, and Markdown rendering for solutions.
 */
import React, { useState } from 'react';
import ImageUploadZone from '../components/DoubtSolver/ImageUploadZone';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const AIDoubtSolver = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [context, setContext] = useState('');
    const [isSolving, setIsSolving] = useState(false);
    const [solution, setSolution] = useState('');
    const [error, setError] = useState('');

    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

    const handleSolve = async (e) => {
        e.preventDefault();
        if (!selectedFile) {
            setError('Please upload an image of your doubt.');
            return;
        }

        setIsSolving(true);
        setError('');
        setSolution('');

        const formData = new FormData();
        formData.append('image', selectedFile);
        if (context.trim()) {
            formData.append('context', context.trim());
        }

        try {
            const response = await axios.post(`${API_URL}/doubt-solver/solve`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response.data.success) {
                setSolution(response.data.data.solution);
            } else {
                setError(response.data.message || 'Failed to solve doubt.');
            }
        } catch (err) {
            console.error('Solve error:', err);
            setError(err.response?.data?.message || 'Network error. Please try again.');
        } finally {
            setIsSolving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">AI Doubt Solver</h1>
                    <p className="text-gray-600 dark:text-gray-400">Upload a photo of your problem, and get a step-by-step explanation.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Input Section */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">1. Upload Problem</h2>
                            <ImageUploadZone onFileSelect={setSelectedFile} />
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">2. Add Context (Optional)</h2>
                            <textarea
                                value={context}
                                onChange={(e) => setContext(e.target.value)}
                                placeholder="e.g., 'I don't understand step 3', or 'This is a calculus problem about derivatives'"
                                rows={4}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            />
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleSolve}
                            disabled={isSolving || !selectedFile}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {isSolving ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Analyzing...
                                </>
                            ) : 'Get Solution'}
                        </button>
                    </div>

                    {/* Output Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 min-h-[400px]">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">Solution</h2>

                        {!solution && !isSolving && (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                                <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                <p>Your step-by-step solution will appear here.</p>
                            </div>
                        )}

                        {isSolving && (
                            <div className="space-y-3 animate-pulse">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                            </div>
                        )}

                        {solution && (
                            <div className="prose dark:prose-invert max-w-none">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm, remarkMath]}
                                    rehypePlugins={[rehypeKatex]}
                                    components={{
                                        p: ({ node, ...props }) => <p className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed" {...props} />,
                                        h3: ({ node, ...props }) => <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-3" {...props} />,
                                        strong: ({ node, ...props }) => <strong className="font-semibold text-blue-700 dark:text-blue-400" {...props} />,
                                    }}
                                >
                                    {solution}
                                </ReactMarkdown>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIDoubtSolver;
