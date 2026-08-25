/**
 * @fileoverview Card component for displaying community flashcard deck details and voting controls.
 */
import React, { useState } from 'react';

const CommunityDeckCard = ({ deck }) => {
    const [votes, setVotes] = useState({ up: deck.upvotes, down: deck.downvotes });
    const [userVote, setUserVote] = useState(null);

    const handleVote = async (type) => {
        // Optimistic update
        const newVotes = { ...votes };
        if (userVote === type) {
            newVotes[type] -= 1;
            setUserVote(null);
        } else {
            if (userVote) newVotes[userVote] -= 1;
            newVotes[type] += 1;
            setUserVote(type);
        }
        setVotes(newVotes);

        // TODO: API call to persist vote
        // await axios.post(`/api/community-decks/${deck.id}/vote`, { voteType: type });
    };

    const difficultyColors = {
        Beginner: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        Intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
        Advanced: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-shadow flex flex-col h-full">
            <div className="flex justify-between items-start mb-3">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${difficultyColors[deck.difficulty]}`}>
                    {deck.difficulty}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(deck.createdAt).toLocaleDateString()}
                </span>
            </div>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{deck.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-grow">
                {deck.description || `A comprehensive deck covering ${deck.subject} topics.`}
            </p>

            <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    {deck.ownerName}
                </div>

                <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                        onClick={() => handleVote('up')}
                        className={`p-1.5 rounded-md transition-colors ${userVote === 'up' ? 'bg-green-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300'}`}
                        title="Upvote"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                    </button>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white w-6 text-center">
                        {votes.up - votes.down}
                    </span>
                    <button
                        onClick={() => handleVote('down')}
                        className={`p-1.5 rounded-md transition-colors ${userVote === 'down' ? 'bg-red-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300'}`}
                        title="Downvote"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CommunityDeckCard;
