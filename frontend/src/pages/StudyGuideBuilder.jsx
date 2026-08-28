/**
 * @fileoverview Main page for selecting content and initiating the PDF study guide export.
 */
import React, { useState } from 'react';
import StudyGuideExportModal from '../components/export/StudyGuideExportModal';

const StudyGuideBuilder = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Study Guide Builder</h1>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Compile your flashcards, high-yield notes, and formula sheets into a beautifully formatted,
                        printer-ready A4 revision booklet.
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-8 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Preview Your Booklet</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            The generated PDF will include a custom cover page, table of contents, and your selected study materials.
                        </p>
                    </div>

                    <div className="p-8 flex flex-col items-center justify-center min-h-[300px]">
                        <div className="w-32 h-40 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 shadow-lg rounded mb-6 flex flex-col items-center justify-center p-2">
                            <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                            <div className="w-3/4 h-2 bg-gray-200 dark:bg-gray-600 rounded mb-1"></div>
                            <div className="w-1/2 h-2 bg-gray-200 dark:bg-gray-600 rounded"></div>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 text-center max-w-md">
                            Click the button below to customize your content, add a watermark, and generate your revision booklet.
                        </p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 transition-all transform hover:scale-105 flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            Create Study Guide
                        </button>
                    </div>
                </div>

                <StudyGuideExportModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                />
            </div>
        </div>
    );
};

export default StudyGuideBuilder;
