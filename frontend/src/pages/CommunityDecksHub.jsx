/**
 * @fileoverview Main hub page for discovering and voting on community flashcard decks.
 */
import React, { useState, useEffect } from 'react';
import CommunityDeckCard from '../components/Decks/CommunityDeckCard';
import axios from 'axios';

const CommunityDecksHub = () => {
    const [decks, setDecks] = useState([]);
    const [filters, setFilters] = useState({ subject: '', difficulty: '' });
    const [isLoading, setIsLoading] = useState(true);

    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

    useEffect(() => {
        const fetchDecks = async () => {
            setIsLoading(true);
            try {
                const params = new URLSearchParams(filters).toString();
                const response = await axios.get(`${API_URL}/community-decks?${params}`);
                if (response.data.success) {
                    setDecks(response.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch community decks:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDecks();
    }, [filters]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Community Decks Hub</h1>
                        <p className="text-gray-600 dark:text-gray-400">Discover, upvote, and use flashcard decks curated by fellow students.</p>
                    </div>
                    <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md">
                        Publish Your Deck
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-8 flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Subject</label>
                        <select
                            value={filters.subject}
                            onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Subjects</option>
                            <option value="Mathematics">Mathematics</option>
                            <option value="Psychology">Psychology</option>
                            <option value="Computer Science">Computer Science</option>
                        </select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Difficulty</label>
                        <select
                            value={filters.difficulty}
                            onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Levels</option>
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                        </select>
                    </div>
                </div>

                {/* Deck Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse"></div>
                        ))}
                    </div>
                ) : decks.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400">No decks found matching your filters.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {decks.map((deck) => (
                            <CommunityDeckCard key={deck.id} deck={deck} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommunityDecksHub;
