/**
 * @fileoverview Main page for uploading and comparing two study documents.
 */
import React, { useState } from 'react';
import DiffViewer from '../components/Comparison/DiffViewer';
import axios from 'axios';

const DocumentComparator = () => {
    const [textA, setTextA] = useState('');
    const [textB, setTextB] = useState('');
    const [isComparing, setIsComparing] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    const [error, setError] = useState('');

    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

    const handleCompare = async (e) => {
        e.preventDefault();
        if (!textA.trim() || !textB.trim()) {
            setError('Please provide content for both documents.');
            return;
        }

        setIsComparing(true);
        setError('');
        setAnalysis(null);

        try {
            const response = await axios.post(`${API_URL}/comparison/analyze`, { textA, textB });
            if (response.data.success) {
                setAnalysis(response.data.data);
            } else {
                setError(response.data.message || 'Failed to compare documents.');
            }
        } catch (err) {
            console.error('Comparison error:', err);
            setError(err.response?.data?.message || 'Network error. Please try again.');
        } finally {
            setIsComparing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Document Overlap Analyzer</h1>
                    <p className="text-gray-600 dark:text-gray-400">Compare two study materials to find shared concepts, missing information, and contradictions.</p>
                </div>

                {!analysis ? (
                    <form onSubmit={handleCompare} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Document A (e.g., Lecture Notes)</label>
                                <textarea
                                    value={textA}
                                    onChange={(e) => setTextA(e.target.value)}
                                    placeholder="Paste text from Document A here..."
                                    rows={12}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Document B (e.g., Textbook Chapter)</label>
                                <textarea
                                    value={textB}
                                    onChange={(e) => setTextB(e.target.value)}
                                    placeholder="Paste text from Document B here..."
                                    rows={12}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
                                {error}
                            </div>
                        )}

                        <div className="flex justify-center">
                            <button
                                type="submit"
                                disabled={isComparing}
                                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                            >
                                {isComparing ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Analyzing Documents...
                                    </>
                                ) : (
                                    'Compare Documents'
                                )}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-6">
                        <button
                            onClick={() => { setAnalysis(null); setTextA(''); setTextB(''); }}
                            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            Start New Comparison
                        </button>
                        <DiffViewer analysis={analysis} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocumentComparator;
