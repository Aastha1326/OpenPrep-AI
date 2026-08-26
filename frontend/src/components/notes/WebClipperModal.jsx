/**
 * @fileoverview Modal for URL import, preview, subject selection, and AI bullet summary.
 */
import React, { useState } from 'react';
import axios from 'axios';

const WebClipperModal = ({ isOpen, onClose, onSave }) => {
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [error, setError] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');

    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

    if (!isOpen) return null;

    const handleIngest = async (e) => {
        e.preventDefault();
        if (!url.trim()) return;

        setIsLoading(true);
        setError('');
        setPreviewData(null);

        try {
            const response = await axios.post(`${API_URL}/clipper/ingest-url`, { url });
            if (response.data.success) {
                setPreviewData(response.data.data);
                setSelectedSubject(response.data.data.suggestedSubject || '');
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch article. Check the URL and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!previewData || !selectedSubject) return;

        try {
            const response = await axios.post(`${API_URL}/clipper/save-note`, {
                title: previewData.title,
                content: `<h1>${previewData.title}</h1><p><strong>Summary:</strong> ${previewData.summary}</p><ul>${previewData.keyTakeaways.map(t => `<li>${t}</li>`).join('')}</ul><hr/><p>${previewData.textContent.substring(0, 1000)}...</p>`,
                subject: selectedSubject,
                tags: previewData.tags,
                url: previewData.url,
            });

            if (response.data.success) {
                onSave(response.data.data);
                handleClose();
            }
        } catch (err) {
            setError('Failed to save note. Please try again.');
        }
    };

    const handleClose = () => {
        setUrl('');
        setPreviewData(null);
        setError('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">

                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                        Smart Web Clipper
                    </h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {!previewData ? (
                        <form onSubmit={handleIngest} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Article URL</label>
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        placeholder="https://example.com/educational-article"
                                        className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={isLoading || !url.trim()}
                                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        {isLoading ? (
                                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        ) : 'Clip'}
                                    </button>
                                </div>
                            </div>
                            {error && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">{error}</p>}

                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                    <strong>Tip:</strong> The clipper will automatically strip ads, navigation bars, and extract the core educational content, then generate an AI summary.
                                </p>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Save to Subject</label>
                                <select
                                    value={selectedSubject}
                                    onChange={(e) => setSelectedSubject(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="">Select a subject...</option>
                                    <option value="Computer Science">Computer Science</option>
                                    <option value="Mathematics">Mathematics</option>
                                    <option value="Biology">Biology</option>
                                    <option value="History">History</option>
                                    <option value="General">General</option>
                                </select>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{previewData.title}</h3>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {previewData.tags.map((tag, idx) => (
                                        <span key={idx} className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 italic mb-4 border-l-4 border-blue-500 pl-3">
                                    {previewData.summary}
                                </p>
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Key Takeaways:</h4>
                                <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                    {previewData.keyTakeaways.map((takeaway, idx) => (
                                        <li key={idx}>{takeaway}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {previewData && (
                    <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3">
                        <button
                            onClick={handleClose}
                            className="px-5 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!selectedSubject}
                            className="px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                            Save to Notebook
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WebClipperModal;
