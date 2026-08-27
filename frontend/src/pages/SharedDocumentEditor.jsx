/**
 * @fileoverview Main page for the real-time collaborative document editor.
 */
import React, { useState, useEffect } from 'react';
import CollaborativeRichTextEditor from '../components/editor/CollaborativeRichTextEditor';
import axios from 'axios';

const SharedDocumentEditor = () => {
    const [documentData, setDocumentData] = useState(null);
    const [remoteCursors, setRemoteCursors] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);

    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    const docId = 'doc_123';

    useEffect(() => {
        const fetchDoc = async () => {
            try {
                const response = await axios.get(`${API_URL}/collaborative-docs/${docId}`);
                if (response.data.success) {
                    setDocumentData(response.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch document:', error);
            }
        };
        fetchDoc();

        // Mock remote cursor movement
        const cursorInterval = setInterval(() => {
            setRemoteCursors([
                { userId: 'user_B', username: 'Alice', x: 50 + Math.random() * 200, y: 30 + Math.random() * 100 }
            ]);
        }, 2000);

        return () => clearInterval(cursorInterval);
    }, []);

    const handleContentChange = (newContent) => {
        // Debounce save in production
        setIsSaving(true);
        setTimeout(async () => {
            try {
                await axios.post(`${API_URL}/collaborative-docs/${docId}/versions`, {
                    content: newContent,
                    version: documentData.version
                });
                setLastSaved(new Date().toLocaleTimeString());
            } catch (error) {
                console.error('Failed to save version:', error);
            } finally {
                setIsSaving(false);
            }
        }, 1000);
    };

    if (!documentData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex flex-col">
            {/* Header */}
            <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">{documentData.title}</h1>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        {isSaving ? 'Saving...' : lastSaved ? `Saved at ${lastSaved}` : 'Unsaved'}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                        {documentData.activeUsers.map((user, idx) => (
                            <div key={user} className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold border-2 border-white dark:border-gray-900">
                                {user.split('_')[1]}
                            </div>
                        ))}
                    </div>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
                        Share
                    </button>
                </div>
            </header>

            {/* Editor */}
            <main className="flex-1 p-6 overflow-hidden">
                <div className="max-w-5xl mx-auto h-full flex flex-col">
                    <CollaborativeRichTextEditor
                        initialContent={documentData.content}
                        onContentChange={handleContentChange}
                        remoteCursors={remoteCursors}
                    />
                </div>
            </main>
        </div>
    );
};

export default SharedDocumentEditor;
