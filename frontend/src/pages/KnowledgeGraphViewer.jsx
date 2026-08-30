/**
 * @fileoverview Main page for generating and viewing AI-driven concept maps.
 */
import React, { useState } from 'react';
import InteractiveGraph from '../components/ConceptMap/InteractiveGraph';
import axios from 'axios';

const KnowledgeGraphViewer = () => {
    const [inputText, setInputText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [graphData, setGraphData] = useState(null);
    const [error, setError] = useState('');

    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!inputText.trim()) {
            setError('Please enter some study notes or topics.');
            return;
        }

        setIsGenerating(true);
        setError('');
        setGraphData(null);

        try {
            const response = await axios.post(`${API_URL}/concept-map/generate`, { inputText });
            if (response.data.success) {
                setGraphData(response.data.data);
            } else {
                setError(response.data.message || 'Failed to generate concept map.');
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
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">AI Concept Map Generator</h1>
                    <p className="text-gray-600 dark:text-gray-400">Paste your study notes or syllabus, and we will visualize the key concepts and their relationships.</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
                    <form onSubmit={handleGenerate} className="space-y-4">
                        <div>
                            <label htmlFor="inputText" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Study Material or Topics
                            </label>
                            <textarea
                                id="inputText"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="e.g., Photosynthesis is the process used by plants... It involves chloroplasts, sunlight, water, and carbon dioxide to produce glucose and oxygen."
                                rows={6}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                required
                            />
                        </div>
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
                                    Analyzing Concepts...
                                </>
                            ) : (
                                'Generate Concept Map'
                            )}
                        </button>
                    </form>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
                        {error}
                    </div>
                )}

                {graphData && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Interactive Knowledge Graph</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Scroll to zoom, drag to pan, and click on nodes to view detailed definitions.
                        </p>
                        <InteractiveGraph nodes={graphData.nodes} edges={graphData.edges} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default KnowledgeGraphViewer;
