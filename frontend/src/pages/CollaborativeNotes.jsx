/**
 * @fileoverview Main page for viewing shared notes and interacting with collaborative highlights.
 */
import React, { useState, useEffect } from 'react';
import InteractiveHighlightViewer from '../components/notes/InteractiveHighlightViewer';
import axios from 'axios';

const CollaborativeNotes = () => {
    const [noteText, setNoteText] = useState('');
    const [highlights, setHighlights] = useState([]);
    const [activeHighlightId, setActiveHighlightId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    const mockNoteId = 'note_123';

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Mock note text
                setNoteText('The mitochondria is the powerhouse of the cell. It generates most of the chemical energy needed to power the cell\'s biochemical reactions. Chemical energy produced by the mitochondria is stored in a small molecule called adenosine triphosphate (ATP). Mitochondria contain their own small chromosomes. Generally, mitochondria, and therefore mitochondrial DNA, are inherited only from the mother.');

                const response = await axios.get(`${API_URL}/notes/${mockNoteId}/highlights`);
                if (response.data.success) {
                    setHighlights(response.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch note data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleAddReply = async (highlightId, text) => {
        try {
            const response = await axios.post(`${API_URL}/notes/highlights/${highlightId}/replies`, { text });
            if (response.data.success) {
                // Optimistic update
                setHighlights(prev => prev.map(hl =>
                    hl.id === highlightId
                        ? { ...hl, comments: [...hl.comments, response.data.data] }
                        : hl
                ));
            }
        } catch (error) {
            console.error('Failed to add reply:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
            <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)]">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Collaborative Study Notes</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Biology 101: Cellular Respiration. Click on highlighted text to join the discussion.
                    </p>
                </div>

                <InteractiveHighlightViewer
                    noteText={noteText}
                    highlights={highlights}
                    activeHighlightId={activeHighlightId}
                    setActiveHighlightId={setActiveHighlightId}
                    onAddReply={handleAddReply}
                />
            </div>
        </div>
    );
};

export default CollaborativeNotes;
