/**
 * @fileoverview Main hub page for discovering and viewing shared community notes.
 */
import React, { useState, useEffect } from 'react';
import CollaborativeAnnotationViewer from '../components/Notes/CollaborativeAnnotationViewer';
import axios from 'axios';

const SharedNotesHub = () => {
    const [notes, setNotes] = useState([]);
    const [selectedNote, setSelectedNote] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

    useEffect(() => {
        const fetchNotes = async () => {
            try {
                const response = await axios.get(`${API_URL}/shared-notes`);
                if (response.data.success) {
                    setNotes(response.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch shared notes:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchNotes();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="flex flex-col items-center gap-4">
                    <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-gray-600 dark:text-gray-400">Loading community notes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
            <div className="max-w-6xl mx-auto">
                {!selectedNote ? (
                    <>
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Shared Notes Hub</h1>
                                <p className="text-gray-600 dark:text-gray-400">Discover and collaboratively annotate study materials from the community.</p>
                            </div>
                            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
                                Upload Your Note
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {notes.map((note) => (
                                <div
                                    key={note.id}
                                    onClick={() => setSelectedNote(note)}
                                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 cursor-pointer hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {note.title}
                                        </h3>
                                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-semibold rounded-full">
                                            Public
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                                        <span>by {note.ownerName}</span>
                                        <span>•</span>
                                        <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 font-medium">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                                        {note.annotationCount} Annotations
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="space-y-6">
                        <button
                            onClick={() => setSelectedNote(null)}
                            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            Back to Hub
                        </button>

                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedNote.title}</h2>
                                <button className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                    Report Note
                                </button>
                            </div>

                            <CollaborativeAnnotationViewer
                                noteUrl="https://via.placeholder.com/800x600?text=Note+Document+Preview"
                                initialAnnotations={[
                                    { id: 'ann_1', userId: 'user-1', x: 20, y: 30, text: 'This formula is crucial for the final exam!', timestamp: new Date().toISOString() }
                                ]}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SharedNotesHub;
