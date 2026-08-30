/**
 * @fileoverview Main page for converting YouTube videos to flashcard decks.
 * Includes a preview UI for editing and discarding cards before saving.
 */
import React, { useState } from 'react';
import YoutubeUrlInput from '../components/Flashcards/YoutubeUrlInput';
import axios from 'axios';

const VideoToFlashcards = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [flashcards, setFlashcards] = useState([]);
    const [error, setError] = useState('');

    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

    const handleGenerate = async (url) => {
        setIsGenerating(true);
        setError('');
        setFlashcards([]);

        try {
            const response = await axios.post(`${API_URL}/flashcards/generate/youtube`, { url });
            if (response.data.success) {
                setFlashcards(response.data.data);
            } else {
                setError(response.data.message || 'Failed to generate flashcards.');
            }
        } catch (err) {
            console.error('Generation error:', err);
            setError(err.response?.data?.message || 'Network error. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCardChange = (index, field, value) => {
        const updated = [...flashcards];
        updated[index][field] = value;
        setFlashcards(updated);
    };

    const handleDeleteCard = (index) => {
        const updated = flashcards.filter((_, i) => i !== index);
        setFlashcards(updated);
    };

    const handleSaveDeck = () => {
        // TODO: Implement API call to save the deck to the user's account
        alert(`Successfully saved ${flashcards.length} flashcards to your deck!`);
        setFlashcards([]);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Video to Flashcards</h1>
                    <p className="text-gray-600 dark:text-gray-400">Paste a YouTube lecture URL, and we'll automatically generate a study deck for you.</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
                    <YoutubeUrlInput onGenerate={handleGenerate} isGenerating={isGenerating} />
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
                        {error}
                    </div>
                )}

                {flashcards.length > 0 && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Preview Generated Cards ({flashcards.length})</h2>
                            <button
                                onClick={handleSaveDeck}
                                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                            >
                                Save to My Decks
                            </button>
                        </div>

                        <div className="space-y-4">
                            {flashcards.map((card, index) => (
                                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 relative group">
                                    <button
                                        onClick={() => handleDeleteCard(index)}
                                        className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                        title="Discard card"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase mb-1">Front (Question)</label>
                                            <textarea
                                                value={card.front}
                                                onChange={(e) => handleCardChange(index, 'front', e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                                rows={3}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-green-600 dark:text-green-400 uppercase mb-1">Back (Answer)</label>
                                            <textarea
                                                value={card.back}
                                                onChange={(e) => handleCardChange(index, 'back', e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                                rows={3}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">Difficulty:</span>
                                        <select
                                            value={card.difficulty}
                                            onChange={(e) => handleCardChange(index, 'difficulty', e.target.value)}
                                            className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 outline-none"
                                        >
                                            <option value="easy">Easy</option>
                                            <option value="medium">Medium</option>
                                            <option value="hard">Hard</option>
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoToFlashcards;
