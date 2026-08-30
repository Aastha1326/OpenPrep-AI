/**
 * @fileoverview Main page for managing the personal reference library and generating new citations.
 */
import React, { useState, useEffect } from 'react';
import CitationFormatter from '../components/References/CitationFormatter';
import axios from 'axios';

const ReferenceLibrary = () => {
    const [input, setInput] = useState('');
    const [subject, setSubject] = useState('');
    const [project, setProject] = useState('');
    const [references, setReferences] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [copiedId, setCopiedId] = useState(null);

    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

    useEffect(() => {
        fetchReferences();
    }, []);

    const fetchReferences = async () => {
        try {
            const response = await axios.get(`${API_URL}/references`);
            if (response.data.success) {
                setReferences(response.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch references:', err);
        }
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!input.trim()) {
            setError('Please enter a URL, book title, or text snippet.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await axios.post(`${API_URL}/references`, {
                input: input.trim(),
                subject: subject.trim() || 'General',
                project: project.trim() || 'Unassigned'
            });

            if (response.data.success) {
                setReferences([response.data.data, ...references]);
                setInput('');
                setSubject('');
                setProject('');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to generate citation.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`${API_URL}/references/${id}`);
            setReferences(references.filter(ref => ref.id !== id));
        } catch (err) {
            console.error('Failed to delete reference:', err);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Reference Library</h1>
                    <p className="text-gray-600 dark:text-gray-400">Automatically generate, format, and manage academic citations for your study notes.</p>
                </div>

                {/* Generator Form */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New Citation</h2>
                    <form onSubmit={handleGenerate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL, Book Title, or Paper Snippet</label>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="e.g., https://example.com/paper or 'Introduction to Algorithms by Cormen'"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject (Optional)</label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="e.g., Computer Science"
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project (Optional)</label>
                                <input
                                    type="text"
                                    value={project}
                                    onChange={(e) => setProject(e.target.value)}
                                    placeholder="e.g., Final Thesis"
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                        {error && (
                            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">{error}</p>
                        )}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full md:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Analyzing Source...
                                </>
                            ) : 'Generate Citation'}
                        </button>
                    </form>
                </div>

                {/* Reference List */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your References ({references.length})</h2>
                    {references.length === 0 ? (
                        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                            <p className="text-gray-500 dark:text-gray-400">No references saved yet. Add your first citation above.</p>
                        </div>
                    ) : (
                        references.map((ref) => (
                            <div key={ref.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 relative group">
                                <button
                                    onClick={() => handleDelete(ref.id)}
                                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                    title="Delete reference"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                                <CitationFormatter
                                    citationData={ref}
                                    onCopy={(text) => handleCopy(text, ref.id)}
                                />
                                {copiedId === ref.id && (
                                    <p className="text-xs text-green-600 dark:text-green-400 mt-2 font-medium flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        Copied to clipboard!
                                    </p>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReferenceLibrary;
