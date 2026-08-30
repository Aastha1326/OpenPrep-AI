/**
 * @fileoverview Dialog for selecting content, customizing layout, and triggering PDF export.
 */
import React, { useState } from 'react';
import axios from 'axios';

const StudyGuideExportModal = ({ isOpen, onClose }) => {
    const [title, setTitle] = useState('My Revision Booklet');
    const [studentName, setStudentName] = useState('');
    const [watermark, setWatermark] = useState('');
    const [includeNotes, setIncludeNotes] = useState(true);
    const [includeFlashcards, setIncludeFlashcards] = useState(true);
    const [includeFormulas, setIncludeFormulas] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');

    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

    if (!isOpen) return null;

    const handleExport = async () => {
        if (!includeNotes && !includeFlashcards && !includeFormulas) {
            setError('Please select at least one content type to include.');
            return;
        }

        setIsGenerating(true);
        setError('');

        try {
            const response = await axios.post(`${API_URL}/study-guides/export-pdf`, {
                title,
                studentName,
                watermark,
                includeNotes,
                includeFlashcards,
                includeFormulas,
            }, {
                responseType: 'blob', // Crucial for file download
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${title.replace(/\s+/g, '_')}_StudyGuide.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

            onClose();
        } catch (err) {
            console.error('Export error:', err);
            setError('Failed to generate PDF. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const estimatedPages = (includeNotes ? 2 : 0) + (includeFlashcards ? 1 : 0) + (includeFormulas ? 1 : 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 overflow-hidden">

                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Export Study Guide</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Booklet Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Student Name (Optional)</label>
                            <input
                                type="text"
                                value={studentName}
                                onChange={(e) => setStudentName(e.target.value)}
                                placeholder="John Doe"
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Watermark (Optional)</label>
                            <input
                                type="text"
                                value={watermark}
                                onChange={(e) => setWatermark(e.target.value)}
                                placeholder="CONFIDENTIAL"
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Include Content</label>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer">
                                <input type="checkbox" checked={includeNotes} onChange={(e) => setIncludeNotes(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                                <span className="text-sm text-gray-900 dark:text-white">High-Yield Notes</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer">
                                <input type="checkbox" checked={includeFlashcards} onChange={(e) => setIncludeFlashcards(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                                <span className="text-sm text-gray-900 dark:text-white">Key Flashcards</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer">
                                <input type="checkbox" checked={includeFormulas} onChange={(e) => setIncludeFormulas(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                                <span className="text-sm text-gray-900 dark:text-white">Formula Cheat-Sheet</span>
                            </label>
                        </div>
                    </div>

                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex justify-between text-sm">
                            <span className="text-blue-800 dark:text-blue-200">Estimated Length:</span>
                            <span className="font-semibold text-blue-900 dark:text-blue-100">~{estimatedPages} pages</span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                            <span className="text-blue-800 dark:text-blue-200">Format:</span>
                            <span className="font-semibold text-blue-900 dark:text-blue-100">A4, Print-Optimized</span>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={isGenerating}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Generating...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                Download PDF
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudyGuideExportModal;
