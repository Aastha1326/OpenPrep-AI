/**
 * @fileoverview Modal component offering various export formats for flashcard decks.
 */
import React, { useState } from 'react';
import { downloadAnkiPackage } from '../../utils/ankiPackageGenerator';

const ExportOptionsModal = ({ isOpen, onClose, deckId, deckName }) => {
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleAnkiExport = async () => {
        setIsExporting(true);
        setError('');
        try {
            await downloadAnkiPackage(deckId, deckName);
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsExporting(false);
        }
    };

    const handleCSVExport = () => {
        // Mock CSV export logic
        alert('CSV export functionality would be implemented here.');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Export Deck</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Choose a format to export "<span className="font-semibold text-gray-900 dark:text-white">{deckName}</span>".
                    </p>

                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleAnkiExport}
                        disabled={isExporting}
                        className="w-full flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700 transition-all group"
                    >
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        </div>
                        <div className="text-left">
                            <p className="font-semibold text-gray-900 dark:text-white">Anki Package (.apkg)</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Best for importing into Anki desktop/mobile with SM-2 intervals preserved.</p>
                        </div>
                        {isExporting && <svg className="animate-spin ml-auto h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                    </button>

                    <button
                        onClick={handleCSVExport}
                        className="w-full flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all group"
                    >
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <div className="text-left">
                            <p className="font-semibold text-gray-900 dark:text-white">CSV File (.csv)</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Plain text format for Excel, Notion, or other custom tools.</p>
                        </div>
                    </button>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportOptionsModal;
