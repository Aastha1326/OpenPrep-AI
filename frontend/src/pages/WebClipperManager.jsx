/**
 * @fileoverview Main page for managing and viewing clipped web notes.
 */
import React, { useState } from 'react';
import WebClipperModal from '../components/notes/WebClipperModal';

const WebClipperManager = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [savedNotes, setSavedNotes] = useState([
        {
            id: 'note_1',
            title: 'Introduction to Neural Networks',
            subject: 'Computer Science',
            date: '2023-10-25',
            tags: ['AI', 'Deep Learning'],
        },
        {
            id: 'note_2',
            title: 'The Krebs Cycle Explained',
            subject: 'Biology',
            date: '2023-10-24',
            tags: ['Metabolism', 'Cellular Respiration'],
        }
    ]);

    const handleSaveNote = (newNote) => {
        setSavedNotes([newNote, ...savedNotes]);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Web Clipper Notes</h1>
                        <p className="text-gray-600 dark:text-gray-400">Manage articles and web pages you have clipped for later study.</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                        Clip New Article
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedNotes.map((note) => (
                        <div key={note.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer group">
                            <div className="flex justify-between items-start mb-3">
                                <span className="px-2 py-1 text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md">
                                    {note.subject}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{note.date}</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                                {note.title}
                            </h3>
                            <div className="flex flex-wrap gap-2 mt-auto">
                                {note.tags.map((tag, idx) => (
                                    <span key={idx} className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full border border-blue-100 dark:border-blue-800">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Empty State / Add New Placeholder */}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-5 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 hover:border-blue-500 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors min-h-[180px]"
                    >
                        <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        <span className="font-medium">Clip another article</span>
                    </button>
                </div>
            </div>

            <WebClipperModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveNote}
            />
        </div>
    );
};

export default WebClipperManager;
